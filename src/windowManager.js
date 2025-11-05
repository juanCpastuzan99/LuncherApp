const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Window Manager estilo Hyprland para Windows
 * Usa PowerShell y APIs de Windows para gestionar ventanas
 */

// Configuración de window management
let windowConfig = {
  tileLayout: 'grid', // 'grid', 'vertical', 'horizontal'
  gapSize: 5,
  floatingApps: [], // Apps que siempre flotan
  workspaceRules: {} // Reglas por workspace
};

/**
 * Obtener todas las ventanas visibles usando PowerShell
 */
async function getAllWindows() {
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      using System.Text;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
        [DllImport("user32.dll")]
        public static extern bool IsWindowVisible(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
        [DllImport("user32.dll")]
        public static extern int GetWindowTextLength(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
        [DllImport("user32.dll")]
        public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
      }
      public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
      }
      public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
"@
    
    $windows = @()
    $windowProc = {
      param([IntPtr]$hWnd, [IntPtr]$lParam)
      if ([Win32]::IsWindowVisible($hWnd)) {
        $length = [Win32]::GetWindowTextLength($hWnd)
        if ($length -gt 0) {
          $sb = New-Object System.Text.StringBuilder($length + 1)
          [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
          $title = $sb.ToString()
          if ($title -and $title -notmatch '^Program Manager|^Desktop Window Manager') {
            $rect = New-Object RECT
            if ([Win32]::GetWindowRect($hWnd, [ref]$rect)) {
              $windows += [PSCustomObject]@{
                Handle = $hWnd.ToInt64()
                Title = $title
                X = $rect.Left
                Y = $rect.Top
                Width = $rect.Right - $rect.Left
                Height = $rect.Bottom - $rect.Top
              }
            }
          }
        }
      }
      return $true
    }
    [Win32]::EnumWindows($windowProc, [IntPtr]::Zero) | Out-Null
    $windows | ConvertTo-Json -Compress
  `;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`, { maxBuffer: 10 * 1024 * 1024 });
    if (stdout && stdout.trim()) {
      const windows = JSON.parse(stdout);
      return Array.isArray(windows) ? windows : [windows];
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo ventanas:', error);
    return [];
  }
}

/**
 * Obtener ventana activa (foreground)
 */
async function getActiveWindow() {
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      using System.Text;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
        [DllImport("user32.dll")]
        public static extern int GetWindowTextLength(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
      }
      public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
      }
"@
    
    $hWnd = [Win32]::GetForegroundWindow()
    if ($hWnd -ne [IntPtr]::Zero) {
      $length = [Win32]::GetWindowTextLength($hWnd)
      $sb = New-Object System.Text.StringBuilder($length + 1)
      [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
      $title = $sb.ToString()
      $rect = New-Object RECT
      if ([Win32]::GetWindowRect($hWnd, [ref]$rect)) {
        [PSCustomObject]@{
          Handle = $hWnd.ToInt64()
          Title = $title
          X = $rect.Left
          Y = $rect.Top
          Width = $rect.Right - $rect.Left
          Height = $rect.Bottom - $rect.Top
        } | ConvertTo-Json -Compress
      }
    }
  `;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`, { maxBuffer: 10 * 1024 * 1024 });
    if (stdout && stdout.trim()) {
      return JSON.parse(stdout);
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo ventana activa:', error);
    return null;
  }
}

/**
 * Mover y redimensionar una ventana
 */
async function moveWindow(handle, x, y, width, height) {
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
      }
"@
    
    $hWnd = [IntPtr]$handle
    [Win32]::MoveWindow($hWnd, $x, $y, $width, $height, $true) | Out-Null
  `;

  try {
    await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`);
    return true;
  } catch (error) {
    console.error('Error moviendo ventana:', error);
    return false;
  }
}

/**
 * Organizar ventanas en grid (tiling)
 */
async function tileWindows(layout = 'grid') {
  const windows = await getAllWindows();
  if (windows.length === 0) return;

  // Obtener resolución de pantalla principal
  const psGetScreen = `
    Add-Type -AssemblyName System.Windows.Forms
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    [PSCustomObject]@{
      Width = $screen.WorkingArea.Width
      Height = $screen.WorkingArea.Height
      X = $screen.WorkingArea.X
      Y = $screen.WorkingArea.Y
    } | ConvertTo-Json -Compress
  `;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psGetScreen.replace(/"/g, '`"')}"`);
    const screen = JSON.parse(stdout);
    const gap = windowConfig.gapSize;
    const usableWidth = screen.Width - (gap * 2);
    const usableHeight = screen.Height - (gap * 2);
    const usableX = screen.X + gap;
    const usableY = screen.Y + gap;

    const count = windows.length;
    let cols, rows;

    if (layout === 'grid') {
      // Calcular grid óptimo
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
    } else if (layout === 'vertical') {
      cols = 1;
      rows = count;
    } else { // horizontal
      cols = count;
      rows = 1;
    }

    const cellWidth = Math.floor(usableWidth / cols) - gap;
    const cellHeight = Math.floor(usableHeight / rows) - gap;

    // Organizar ventanas
    for (let i = 0; i < windows.length && i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = usableX + col * (cellWidth + gap);
      const y = usableY + row * (cellHeight + gap);

      await moveWindow(
        windows[i].Handle,
        x,
        y,
        cellWidth,
        cellHeight
      );
    }

    console.log(`✓ Ventanas organizadas en ${layout}: ${count} ventanas`);
    return true;
  } catch (error) {
    console.error('Error organizando ventanas:', error);
    return false;
  }
}

/**
 * Maximizar ventana activa
 */
async function maximizeActiveWindow() {
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
      }
"@
    
    $hWnd = [Win32]::GetForegroundWindow()
    [Win32]::ShowWindow($hWnd, 3) | Out-Null # SW_MAXIMIZE = 3
  `;

  try {
    await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`);
    return true;
  } catch (error) {
    console.error('Error maximizando ventana:', error);
    return false;
  }
}

/**
 * Minimizar ventana activa
 */
async function minimizeActiveWindow() {
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
      }
"@
    
    $hWnd = [Win32]::GetForegroundWindow()
    [Win32]::ShowWindow($hWnd, 6) | Out-Null # SW_MINIMIZE = 6
  `;

  try {
    await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`);
    return true;
  } catch (error) {
    console.error('Error minimizando ventana:', error);
    return false;
  }
}

/**
 * Cambiar entre Virtual Desktops (Workspaces en Windows)
 */
async function switchVirtualDesktop(direction) {
  // direction: 'next' o 'previous'
  const psScript = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
      }
"@
    
    # Ctrl+Win+Left/Right para cambiar entre desktops virtuales
    $VK_CONTROL = 0x11
    $VK_LWIN = 0x5B
    $VK_LEFT = 0x25
    $VK_RIGHT = 0x27
    $KEYEVENTF_KEYUP = 0x0002
    
    if ('${direction}' -eq 'next') {
      [Win32]::keybd_event($VK_CONTROL, 0, 0, 0)
      [Win32]::keybd_event($VK_LWIN, 0, 0, 0)
      [Win32]::keybd_event($VK_RIGHT, 0, 0, 0)
      Start-Sleep -Milliseconds 50
      [Win32]::keybd_event($VK_RIGHT, 0, $KEYEVENTF_KEYUP, 0)
      [Win32]::keybd_event($VK_LWIN, 0, $KEYEVENTF_KEYUP, 0)
      [Win32]::keybd_event($VK_CONTROL, 0, $KEYEVENTF_KEYUP, 0)
    } else {
      [Win32]::keybd_event($VK_CONTROL, 0, 0, 0)
      [Win32]::keybd_event($VK_LWIN, 0, 0, 0)
      [Win32]::keybd_event($VK_LEFT, 0, 0, 0)
      Start-Sleep -Milliseconds 50
      [Win32]::keybd_event($VK_LEFT, 0, $KEYEVENTF_KEYUP, 0)
      [Win32]::keybd_event($VK_LWIN, 0, $KEYEVENTF_KEYUP, 0)
      [Win32]::keybd_event($VK_CONTROL, 0, $KEYEVENTF_KEYUP, 0)
    }
  `;

  try {
    await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`);
    return true;
  } catch (error) {
    console.error('Error cambiando workspace:', error);
    return false;
  }
}

/**
 * Mover ventana a la izquierda/derecha (split screen)
 */
async function moveWindowToSide(direction) {
  const activeWindow = await getActiveWindow();
  if (!activeWindow) return false;

  const psGetScreen = `
    Add-Type -AssemblyName System.Windows.Forms
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    [PSCustomObject]@{
      Width = $screen.WorkingArea.Width
      Height = $screen.WorkingArea.Height
      X = $screen.WorkingArea.X
      Y = $screen.WorkingArea.Y
    } | ConvertTo-Json -Compress
  `;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psGetScreen.replace(/"/g, '`"')}"`);
    const screen = JSON.parse(stdout);
    const gap = windowConfig.gapSize;
    const halfWidth = Math.floor((screen.Width - gap * 3) / 2);
    const fullHeight = screen.Height - gap * 2;

    let x, y, width, height;

    if (direction === 'left') {
      x = screen.X + gap;
      y = screen.Y + gap;
      width = halfWidth;
      height = fullHeight;
    } else if (direction === 'right') {
      x = screen.X + halfWidth + gap * 2;
      y = screen.Y + gap;
      width = halfWidth;
      height = fullHeight;
    } else {
      return false;
    }

    await moveWindow(activeWindow.Handle, x, y, width, height);
    console.log(`✓ Ventana movida a ${direction}`);
    return true;
  } catch (error) {
    console.error('Error moviendo ventana a lado:', error);
    return false;
  }
}

/**
 * Centrar ventana activa
 */
async function centerActiveWindow() {
  const activeWindow = await getActiveWindow();
  if (!activeWindow) return false;

  const psGetScreen = `
    Add-Type -AssemblyName System.Windows.Forms
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    [PSCustomObject]@{
      Width = $screen.WorkingArea.Width
      Height = $screen.WorkingArea.Height
      X = $screen.WorkingArea.X
      Y = $screen.WorkingArea.Y
    } | ConvertTo-Json -Compress
  `;

  try {
    const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psGetScreen.replace(/"/g, '`"')}"`);
    const screen = JSON.parse(stdout);
    
    // Mantener tamaño actual o usar 80% de pantalla
    const width = Math.min(activeWindow.Width, Math.floor(screen.Width * 0.8));
    const height = Math.min(activeWindow.Height, Math.floor(screen.Height * 0.8));
    const x = screen.X + Math.floor((screen.Width - width) / 2);
    const y = screen.Y + Math.floor((screen.Height - height) / 2);

    await moveWindow(activeWindow.Handle, x, y, width, height);
    console.log('✓ Ventana centrada');
    return true;
  } catch (error) {
    console.error('Error centrando ventana:', error);
    return false;
  }
}

module.exports = {
  getAllWindows,
  getActiveWindow,
  moveWindow,
  tileWindows,
  maximizeActiveWindow,
  minimizeActiveWindow,
  switchVirtualDesktop,
  moveWindowToSide,
  centerActiveWindow,
  config: windowConfig
};

