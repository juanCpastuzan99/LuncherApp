const { app, BrowserWindow, globalShortcut, ipcMain, shell, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const windowManager = require('./windowManager');
const configManager = require('./config');

// Determinar el directorio base correcto (ya sea desarrollo o instalación global)
const getBaseDir = () => {
  // Si estamos en una instalación global, usar __dirname
  // Si estamos en desarrollo, usar process.cwd()
  const isGlobal = __dirname.includes('node_modules') || __dirname.includes('AppData');
  return isGlobal ? path.dirname(__dirname) : process.cwd();
};

let mainWindow = null;
let settingsWindow = null;
let appIndex = [];
let config = {
  hotkey: 'Ctrl+Alt+Space',
  theme: 'dark',
  transparency: true,
  excludePatterns: ['uninstall', 'help', 'documentation'],
  windowHotkeys: {
    tileGrid: 'Ctrl+Alt+T',
    tileVertical: 'Ctrl+Alt+Shift+T',
    tileHorizontal: 'Ctrl+Alt+H',
    moveLeft: 'Ctrl+Alt+Left',
    moveRight: 'Ctrl+Alt+Right',
    center: 'Ctrl+Alt+C',
    maximize: 'Ctrl+Alt+Up',
    minimize: 'Ctrl+Alt+Down',
    workspaceNext: 'Ctrl+Alt+Right',
    workspacePrev: 'Ctrl+Alt+Left'
  }
};

const userDataDir = app.getPath('userData');
const configPath = path.join(userDataDir, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      config = { ...config, ...parsed };
    } else {
      fs.mkdirSync(userDataDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } catch (err) {
    // keep defaults if parsing fails
  }
}

function saveConfig(partial) {
  config = { ...config, ...partial };
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (_) {}
}

function isExcluded(name) {
  const lower = name.toLowerCase();
  return config.excludePatterns.some((p) => lower.includes(p));
}

// Escanear aplicaciones UWP (Microsoft Store) y todas las aplicaciones instaladas
function scanUWPApps(callback) {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $apps = @()
    
    # Método 1: Obtener aplicaciones UWP usando Get-StartApps (más rápido)
    try {
      Get-StartApps | ForEach-Object {
        if ($_.Name -and $_.AppId) {
          $apps += [PSCustomObject]@{
            Name = $_.Name
            AppId = $_.AppId
            Type = 'UWP'
            Source = 'StartApps'
          }
        }
      }
    } catch {
      Write-Host "Error Get-StartApps: $_" -ForegroundColor Yellow
    }
    
    # Método 2: Obtener paquetes AppX (Microsoft Store apps) usando Get-AppxPackage
    # Incluir todas las apps instaladas, excluyendo solo frameworks, recursos y componentes del sistema muy específicos
    try {
      Get-AppxPackage | Where-Object {
        $_.Name -and 
        $_.IsFramework -eq $false -and
        $_.IsResourcePackage -eq $false -and
        # Excluir solo componentes del sistema muy técnicos, pero incluir apps útiles de Microsoft Store
        ($_.Name -notmatch '^Microsoft\.Windows\.(ContentDeliveryManager|PCASvc|PushNotifications|PushToInstall|ShellExperienceHost|Search|AppXDeploymentServer|DesktopAppInstaller|WindowsUpdate|UpdateAssistant|SecureBoot|Recovery|Reset)' -or
         $_.Name -like '*WhatsApp*' -or $_.Name -like '*Spotify*' -or $_.Name -like '*Discord*' -or
         $_.Name -like '*Chrome*' -or $_.Name -like '*Firefox*' -or $_.Name -like '*VSCode*' -or
         $_.Name -like '*Teams*' -or $_.Name -like '*Zoom*' -or $_.Name -like '*Slack*' -or
         $_.Name -like '*Copilot*' -or $_.Name -like '*Sticky*' -or $_.Name -like '*Xbox*' -or
         ($_.Name -like '*Microsoft.*' -and $_.Name -notlike '*Microsoft.Windows.*'))
      } | ForEach-Object {
        $packageName = $_.Name
        $displayName = if ($_.InstallLocation) {
          # Intentar obtener el nombre de display desde el manifest
          try {
            $manifestPath = Join-Path $_.InstallLocation "AppxManifest.xml"
            if (Test-Path $manifestPath) {
              $manifest = [xml](Get-Content $manifestPath)
              $displayName = $manifest.Package.Properties.DisplayName
              if (-not $displayName) {
                $displayName = $manifest.Package.Properties.Name
              }
              if (-not $displayName) {
                $displayName = $packageName
              }
            } else {
              $displayName = $packageName
            }
          } catch {
            $displayName = $packageName
          }
        } else {
          $displayName = $packageName
        }
        
        # Obtener AppId para lanzar la app
        $appId = $null
        try {
          $manifestPath = Join-Path $_.InstallLocation "AppxManifest.xml"
          if (Test-Path $manifestPath) {
            $manifest = [xml](Get-Content $manifestPath)
            $appId = $manifest.Package.Applications.Application.Id
            if (-not $appId) {
              $appId = $manifest.Package.Applications.Application[0].Id
            }
            if ($appId -and $packageName) {
              $fullAppId = "$($packageName)!$appId"
            } else {
              $fullAppId = $packageName
            }
          } else {
            $fullAppId = $packageName
          }
        } catch {
          $fullAppId = $packageName
        }
        
        $apps += [PSCustomObject]@{
          Name = $displayName
          AppId = $fullAppId
          Type = 'UWP'
          Source = 'AppxPackage'
          PackageName = $packageName
        }
      }
    } catch {
      Write-Host "Error Get-AppxPackage: $_" -ForegroundColor Yellow
    }
    
    # Método 3: Obtener aplicaciones desde AppxManifest en WindowsApps (solo para usuario actual)
    try {
      $windowsAppsPath = "$env:ProgramFiles\\WindowsApps"
      if (Test-Path $windowsAppsPath) {
        Get-ChildItem -Path $windowsAppsPath -Directory -ErrorAction SilentlyContinue | 
          Where-Object { $_.Name -match '^[A-Za-z]' } | 
          ForEach-Object {
            $manifestPath = Join-Path $_.FullName "AppxManifest.xml"
            if (Test-Path $manifestPath) {
              try {
                $manifest = [xml](Get-Content $manifestPath)
                $packageName = $manifest.Package.Identity.Name
                $displayName = $manifest.Package.Properties.DisplayName
                if (-not $displayName) {
                  $displayName = $manifest.Package.Properties.Name
                }
                if (-not $displayName) {
                  $displayName = $packageName
                }
                
                $appId = $manifest.Package.Applications.Application.Id
                if (-not $appId) {
                  $appId = $manifest.Package.Applications.Application[0].Id
                }
                if ($appId -and $packageName) {
                  $fullAppId = "$($packageName)!$appId"
                } else {
                  $fullAppId = $packageName
                }
                
                # Solo agregar si no existe ya
                $exists = $apps | Where-Object { $_.AppId -eq $fullAppId }
                if (-not $exists) {
                  $apps += [PSCustomObject]@{
                    Name = $displayName
                    AppId = $fullAppId
                    Type = 'UWP'
                    Source = 'WindowsApps'
                    PackageName = $packageName
                  }
                }
              } catch {}
            }
          }
      }
    } catch {
      Write-Host "Error escaneando WindowsApps: $_" -ForegroundColor Yellow
    }
    
    # Método 4: Buscar aplicaciones en AppData\Local (WhatsApp, Electron apps, etc.)
    try {
      $localAppData = $env:LOCALAPPDATA
      if ($localAppData) {
        Get-ChildItem -Path $localAppData -Directory -ErrorAction SilentlyContinue | 
          Where-Object { 
            $_.Name -match '^[A-Z]' -and 
            $_.Name -notmatch '^Microsoft|^Windows|^Temp|^Cache'
          } | ForEach-Object {
            $appDir = $_.FullName
            # Buscar ejecutables principales
            $exeFiles = Get-ChildItem -Path $appDir -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue -Depth 2 |
              Where-Object { 
                $_.Name -notmatch 'uninstall|update|installer|setup|crash|service' -and
                $_.Directory.Name -notmatch 'uninstall|update|installer|setup|crash|service'
              } | Select-Object -First 1
            
            if ($exeFiles) {
              $exeFile = $exeFiles[0]
              $appName = $_.Name
              # Intentar obtener nombre más descriptivo del ejecutable
              if ($exeFile.Name -ne $appName) {
                $appName = $exeFile.BaseName
              }
              
              $apps += [PSCustomObject]@{
                Name = $appName
                AppId = $exeFile.FullName
                Path = $exeFile.FullName
                Type = 'LocalApp'
                Source = 'AppDataLocal'
              }
            }
          }
      }
    } catch {
      Write-Host "Error escaneando AppData\Local: $_" -ForegroundColor Yellow
    }
    
    # Método 5: Obtener aplicaciones instaladas desde Uninstall Registry
    $regPaths = @(
      'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
      'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
      'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
    )
    
    foreach ($regPath in $regPaths) {
      try {
        Get-ItemProperty $regPath -ErrorAction SilentlyContinue | Where-Object {
          $_.DisplayName -and 
          $_.DisplayName -notmatch '^Update|^Hotfix|^Security Update|^KB' -and
          $_.SystemComponent -ne 1 -and
          $_.WindowsInstaller -ne 1 -and
          $_.ParentName -ne 'Microsoft Corporation'
        } | ForEach-Object {
          # Intentar obtener el ejecutable desde InstallLocation o UninstallString
          $exePath = $null
          if ($_.InstallLocation -and (Test-Path $_.InstallLocation)) {
            $exeName = $_.DisplayName -replace '[^a-zA-Z0-9]', ''
            $possibleExes = Get-ChildItem -Path $_.InstallLocation -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue -Depth 1 |
              Where-Object { $_.Name -notmatch 'uninstall|update|installer|setup' } | Select-Object -First 1
            if ($possibleExes) {
              $exePath = $possibleExes.FullName
            }
          }
          
          $apps += [PSCustomObject]@{
            Name = $_.DisplayName
            AppId = if ($exePath) { $exePath } else { $_.PSChildName }
            Path = if ($exePath) { $exePath } else { $_.DisplayName }
            Type = 'Registry'
            Source = 'UninstallRegistry'
          }
        }
      } catch {}
    }
    
    # Eliminar duplicados por AppId
    $uniqueApps = $apps | Sort-Object Name -Unique | Group-Object AppId | ForEach-Object {
      $_.Group[0]
    }
    
    $uniqueApps | ConvertTo-Json -Compress
  `;
  
  exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
    const results = [];
    if (error) {
      console.error('Error escaneando UWP/Installed apps:', error.message);
    }
    if (stdout && stdout.trim()) {
      try {
        const apps = JSON.parse(stdout);
        const appsArray = Array.isArray(apps) ? apps : [apps];
        appsArray.forEach(app => {
          if (app && app.Name && !isExcluded(app.Name)) {
            // Si es UWP, usar el método especial
            if (app.Type === 'UWP' && app.AppId) {
              results.push({
                id: `uwp:${app.AppId}`,
                name: app.Name,
                path: app.AppId,
                ext: '.uwp',
                type: 'uwp'
              });
            } else if (app.Type === 'LocalApp' && app.Path) {
              // Aplicaciones de AppData\Local con ruta directa
              results.push({
                id: `localapp:${app.Path}`,
                name: app.Name,
                path: app.Path,
                ext: path.extname(app.Path).toLowerCase() || '.exe',
                type: 'registry' // Usar tipo registry para manejar igual
              });
            } else if (app.Path && fs.existsSync(app.Path)) {
              // Si tiene una ruta válida al ejecutable
              results.push({
                id: `installed:${app.Path}`,
                name: app.Name,
                path: app.Path,
                ext: path.extname(app.Path).toLowerCase() || '.exe',
                type: 'registry'
              });
            } else {
              // Para otras aplicaciones, intentar encontrar el ejecutable
              results.push({
                id: `installed:${app.AppId || app.Name}`,
                name: app.Name,
                path: app.Name, // Se buscará el ejecutable por nombre
                ext: '.exe',
                type: 'installed'
              });
            }
          }
        });
      } catch (e) {
        console.error('Error parsing apps:', e, stdout.substring(0, 200));
      }
    }
    callback(results);
  });
}

// Escanear programas desde el registro de Windows y ejecutables comunes
function scanRegistryApps(callback) {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $apps = @()
    
    # App Paths Registry
    $paths = @(
      'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths',
      'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths'
    )
    foreach ($regPath in $paths) {
      if (Test-Path $regPath) {
        Get-ChildItem -Path $regPath -ErrorAction SilentlyContinue | ForEach-Object {
          $name = $_.PSChildName -replace '\\.exe$', ''
          $exePath = $_.GetValue('')
          if ($exePath -and (Test-Path $exePath)) {
            $apps += [PSCustomObject]@{
              Name = $name
              Path = $exePath
              Type = 'AppPath'
            }
          }
        }
      }
    }
    
    # Buscar ejecutables comunes en múltiples ubicaciones
    $programDirs = @()
    if ($env:ProgramFiles) { $programDirs += $env:ProgramFiles }
    if ($env:ProgramFiles -and (Test-Path (Join-Path $env:ProgramFiles '..' 'Program Files (x86)'))) { 
      $programDirs += (Join-Path $env:ProgramFiles '..' 'Program Files (x86)')
    }
    if ($env:LOCALAPPDATA) { $programDirs += $env:LOCALAPPDATA }
    if ($env:APPDATA) { 
      # Buscar en AppData\Roaming para aplicaciones portables
      $roamingApps = Join-Path $env:APPDATA 'Microsoft' 'Windows' 'Start Menu' 'Programs'
      if (Test-Path $roamingApps) { $programDirs += $roamingApps }
    }
    
    foreach ($progDir in $programDirs) {
      if (Test-Path $progDir) {
        try {
          Get-ChildItem -Path $progDir -Recurse -Filter *.exe -ErrorAction SilentlyContinue -Depth 3 | 
            Where-Object { 
              $_.Name -notmatch 'uninstall|setup|install|update|crash|service|helper|launcher' -and
              $_.Directory.Name -notmatch 'uninstall|setup|install|update|crash|service|helpers|tools|binaries' -and
              $_.FullName -notmatch '\\Tools\\|\\Binaries\\|\\SDK\\|\\Debug\\|\\Release\\|\\x86\\|\\x64\\'
            } |
            Select-Object -First 500 | ForEach-Object {
              # Intentar obtener nombre más descriptivo
              $appName = $_.BaseName
              # Si el directorio tiene un nombre descriptivo, usarlo
              $parentDir = $_.Directory.Name
              if ($parentDir -and $parentDir -notmatch '^[0-9]|^v[0-9]' -and $parentDir.Length -gt 3) {
                $appName = $parentDir
              }
              
              $apps += [PSCustomObject]@{
                Name = $appName
                Path = $_.FullName
                Type = 'Executable'
              }
            }
        } catch {}
      }
    }
    
    # Método adicional: Buscar en PATH del sistema
    try {
      $pathEnv = $env:PATH -split ';'
      foreach ($pathDir in $pathEnv) {
        if ($pathDir -and (Test-Path $pathDir)) {
          try {
            Get-ChildItem -Path $pathDir -Filter *.exe -ErrorAction SilentlyContinue | 
              Where-Object { $_.Name -notmatch '^uninstall|^setup' } | ForEach-Object {
                $apps += [PSCustomObject]@{
                  Name = $_.BaseName
                  Path = $_.FullName
                  Type = 'PathExecutable'
                }
              }
          } catch {}
        }
      }
    } catch {}
    
    $apps | Sort-Object Name -Unique | ConvertTo-Json -Compress
  `;
  
  exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '`"')}"`, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
    const results = [];
    if (error) {
      console.error('Error escaneando registry/executables:', error.message);
    }
    if (stdout && stdout.trim()) {
      try {
        const apps = JSON.parse(stdout);
        const appsArray = Array.isArray(apps) ? apps : [apps];
        appsArray.forEach(app => {
          if (app && app.Name && app.Path && !isExcluded(app.Name)) {
            results.push({
              id: `reg:${app.Path}`,
              name: app.Name,
              path: app.Path,
              ext: path.extname(app.Path).toLowerCase() || '.exe',
              type: 'registry'
            });
          }
        });
      } catch (e) {
        console.error('Error parsing registry apps:', e, stdout.substring(0, 200));
      }
    }
    callback(results);
  });
}

// Escanear Menú de Inicio
function scanStartMenu() {
  const results = [];
  const startDirs = [
    path.join(process.env.ProgramData || 'C:/ProgramData', 'Microsoft/Windows/Start Menu/Programs'),
    path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData/Roaming'), 'Microsoft/Windows/Start Menu/Programs')
  ];

  const allowedExt = new Set(['.lnk', '.url', '.appref-ms']);

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExt.has(ext)) {
          const displayName = entry.name.replace(ext, '');
          if (!isExcluded(displayName)) {
            results.push({
              id: full,
              name: displayName,
              path: full,
              ext,
              type: 'shortcut'
            });
          }
        }
      }
    }
  }

  for (const d of startDirs) walk(d);
  return results;
}

// Función principal que combina todas las fuentes
function scanAllApps() {
  console.log('🔍 Escaneando aplicaciones instaladas...');
  console.log('   Fuentes: Menú de Inicio, UWP/Store, Registro, Program Files, AppData, PATH');
  const allResults = [];
  
  // Escanear Menú de Inicio (síncrono) - más rápido y confiable
  const startMenuResults = scanStartMenu();
  allResults.push(...startMenuResults);
  console.log(`✓ Menú de Inicio: ${startMenuResults.length} aplicaciones encontradas`);
  
  let completedScans = 0;
  const totalAsyncScans = 2; // UWP/Installed + Registry/Executables
  
  function finalizeScan() {
    completedScans++;
    if (completedScans === totalAsyncScans) {
      // Eliminar duplicados por nombre y ruta
      const byKey = new Map();
      const byName = new Map(); // Para evitar duplicados por nombre similar
      
      for (const r of allResults) {
        const nameKey = r.name.toLowerCase().trim();
        const fullKey = `${nameKey}::${r.path.toLowerCase()}`;
        
        // Si ya existe uno con el mismo nombre, preferir según tipo
        if (byName.has(nameKey)) {
          const existing = byName.get(nameKey);
          // Preferir: shortcut > registry > uwp > installed
          const priority = { 'shortcut': 4, 'registry': 3, 'uwp': 2, 'installed': 1 };
          const existingPriority = priority[existing.type] || 0;
          const newPriority = priority[r.type] || 0;
          if (newPriority <= existingPriority) {
            continue; // Mantener el existente
          }
        }
        
        if (!byKey.has(fullKey)) {
          byKey.set(fullKey, r);
          byName.set(nameKey, r);
        } else {
          // Preferir shortcuts sobre otros tipos si hay duplicados
          const existing = byKey.get(fullKey);
          if (r.type === 'shortcut' && existing.type !== 'shortcut') {
            byKey.set(fullKey, r);
            byName.set(nameKey, r);
          }
        }
      }
      
      appIndex = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
      console.log(`\n✅ Escaneo completado: ${appIndex.length} aplicaciones únicas encontradas`);
      console.log(`   - Menú de Inicio: ${startMenuResults.length}`);
      console.log(`   - Total antes de deduplicar: ${allResults.length}`);
      console.log(`   - Después de deduplicar: ${appIndex.length}`);
      
      // Mostrar estadísticas por tipo
      const byType = {};
      appIndex.forEach(app => {
        byType[app.type] = (byType[app.type] || 0) + 1;
      });
      console.log(`   - Por tipo:`, byType);
      
      // Notificar al renderer si la ventana está lista
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('apps-updated', appIndex.length);
      }
    }
  }
  
  // Escanear UWP/Installed Apps (asíncrono)
  scanUWPApps((uwpResults) => {
    console.log(`✓ UWP/Store/Installed: ${uwpResults.length} aplicaciones encontradas`);
    allResults.push(...uwpResults);
    finalizeScan();
  });
  
  // Escanear Registry/Executables (asíncrono)
  scanRegistryApps((regResults) => {
    console.log(`✓ Registry/Executables/PATH: ${regResults.length} aplicaciones encontradas`);
    allResults.push(...regResults);
    finalizeScan();
  });
  
  // Timeout de seguridad por si alguna función asíncrona falla
  setTimeout(() => {
    if (completedScans < totalAsyncScans) {
      console.log(`⚠ Advertencia: Solo ${completedScans}/${totalAsyncScans} escaneos completaron. Continuando con los resultados disponibles.`);
      // Forzar finalización si aún no se completó
      while (completedScans < totalAsyncScans) {
        completedScans++;
        if (completedScans === totalAsyncScans) {
          finalizeScan();
        }
      }
    }
  }, 8000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 420,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(getBaseDir(), 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  
  // Cargar el archivo HTML y mostrar la ventana cuando esté lista
  const baseDir = getBaseDir();
  
  // En desarrollo, intentar cargar desde Vite dev server, si no, usar archivo local
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Intentar cargar desde Vite dev server (si está corriendo)
    mainWindow.loadURL('http://localhost:5173')
      .then(() => {
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
      })
      .catch(() => {
        // Si Vite no está corriendo, cargar archivo local
        const rendererPath = path.join(baseDir, 'src', 'renderer', 'index.html');
        mainWindow.loadFile(rendererPath)
          .then(() => {
            mainWindow.center();
            mainWindow.show();
            mainWindow.focus();
          })
          .catch((err) => {
            console.error('Error cargando el archivo HTML:', err);
          });
      });
  } else {
    // En producción, cargar desde archivo
    const rendererPath = path.join(baseDir, 'dist-electron', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath)
      .then(() => {
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
      })
      .catch((err) => {
        console.error('Error cargando el archivo HTML:', err);
      });
  }

  mainWindow.on('blur', () => {
    if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
  });

  // Manejo de errores en la ventana
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error cargando contenido:', errorCode, errorDescription);
  });
}

// ===== FIX PRINCIPAL: Registrar hotkey del launcher =====
function registerHotkey() {
  // Asegurar que la ventana esté creada
  if (!mainWindow) {
    console.warn('⚠ Ventana principal no creada aún, reintentando en 500ms...');
    setTimeout(() => registerHotkey(), 500);
    return;
  }
  
  const handleHotkey = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    console.log('🔔 Hotkey presionado: Ctrl+Alt+Space');
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      // Centrar en pantalla primaria
      mainWindow.center();
      mainWindow.show(); // CAMBIO: usar show() en lugar de showInactive()
      mainWindow.focus();
      mainWindow.webContents.send('focus-search');
    }
  };
  
  // Primero desregistrar solo las variaciones del hotkey principal
  const hotkeyVariations = [
    'Ctrl+Alt+Space',
    'CommandOrControl+Alt+Space',
    'Control+Alt+Space'
  ];
  
  hotkeyVariations.forEach(hk => {
    if (globalShortcut.isRegistered(hk)) {
      globalShortcut.unregister(hk);
      console.log(`🔓 Desregistrado: ${hk}`);
    }
  });
  
  let registered = false;
  let workingHotkey = null;
  
  for (const hotkey of hotkeyVariations) {
    if (registered) break;
    
    console.log(`🔑 Intentando registrar: ${hotkey}`);
    const ok = globalShortcut.register(hotkey, handleHotkey);
    
    if (ok) {
      console.log(`✅ Hotkey registrado exitosamente: ${hotkey}`);
      registered = true;
      workingHotkey = hotkey;
    } else {
      console.warn(`❌ No se pudo registrar: ${hotkey}`);
    }
  }
  
  if (!registered) {
    console.error('❌ ERROR: No se pudo registrar ningún hotkey.');
    console.log('💡 Posibles soluciones:');
    console.log('   1. Otra aplicación está usando Ctrl+Alt+Space');
    console.log('   2. Intenta cerrar otras apps y reiniciar');
    console.log('   3. Puedes cambiar el hotkey en Configuración');
  } else {
    // Verificar que el hotkey esté registrado
    const isRegistered = globalShortcut.isRegistered(workingHotkey);
    console.log(`🔍 Verificación: Hotkey ${workingHotkey} está registrado: ${isRegistered}`);
  }
}

// Registrar hotkeys para window management estilo Hyprland
function registerWindowHotkeys() {
  const hotkeys = config.windowHotkeys || {};
  
  // Tile Grid
  if (hotkeys.tileGrid) {
    const ok = globalShortcut.register(hotkeys.tileGrid, () => {
      windowManager.tileWindows('grid');
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.tileGrid} (Tile Grid)`);
  }
  
  // Tile Vertical
  if (hotkeys.tileVertical) {
    const ok = globalShortcut.register(hotkeys.tileVertical, () => {
      windowManager.tileWindows('vertical');
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.tileVertical} (Tile Vertical)`);
  }
  
  // Tile Horizontal
  if (hotkeys.tileHorizontal) {
    const ok = globalShortcut.register(hotkeys.tileHorizontal, () => {
      windowManager.tileWindows('horizontal');
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.tileHorizontal} (Tile Horizontal)`);
  }
  
  // Mover ventana a la izquierda (o cambiar workspace si está en el borde)
  if (hotkeys.moveLeft) {
    const ok = globalShortcut.register(hotkeys.moveLeft, async () => {
      const activeWindow = await windowManager.getActiveWindow();
      if (activeWindow) {
        // Si la ventana ya está en el lado izquierdo, cambiar workspace
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
        if (activeWindow.X <= 50) {
          windowManager.switchVirtualDesktop('previous');
        } else {
          windowManager.moveWindowToSide('left');
        }
      }
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.moveLeft} (Move Left)`);
  }
  
  // Mover ventana a la derecha (o cambiar workspace si está en el borde)
  if (hotkeys.moveRight) {
    const ok = globalShortcut.register(hotkeys.moveRight, async () => {
      const activeWindow = await windowManager.getActiveWindow();
      if (activeWindow) {
        // Si la ventana ya está en el lado derecho, cambiar workspace
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
        if (activeWindow.X + activeWindow.Width >= screenWidth - 50) {
          windowManager.switchVirtualDesktop('next');
        } else {
          windowManager.moveWindowToSide('right');
        }
      }
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.moveRight} (Move Right)`);
  }
  
  // Centrar ventana
  if (hotkeys.center) {
    const ok = globalShortcut.register(hotkeys.center, () => {
      windowManager.centerActiveWindow();
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.center} (Center)`);
  }
  
  // Maximizar
  if (hotkeys.maximize) {
    const ok = globalShortcut.register(hotkeys.maximize, () => {
      windowManager.maximizeActiveWindow();
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.maximize} (Maximize)`);
  }
  
  // Minimizar
  if (hotkeys.minimize) {
    const ok = globalShortcut.register(hotkeys.minimize, () => {
      windowManager.minimizeActiveWindow();
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.minimize} (Minimize)`);
  }
  
  // Workspace siguiente (opcional, también funciona con moveRight)
  if (hotkeys.workspaceNext && hotkeys.workspaceNext !== hotkeys.moveRight) {
    const ok = globalShortcut.register(hotkeys.workspaceNext, () => {
      windowManager.switchVirtualDesktop('next');
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.workspaceNext} (Workspace Next)`);
  }
  
  // Workspace anterior (opcional, también funciona con moveLeft)
  if (hotkeys.workspacePrev && hotkeys.workspacePrev !== hotkeys.moveLeft) {
    const ok = globalShortcut.register(hotkeys.workspacePrev, () => {
      windowManager.switchVirtualDesktop('previous');
    });
    if (ok) console.log(`✓ Window hotkey registrado: ${hotkeys.workspacePrev} (Workspace Prev)`);
  }
  
  console.log('✓ Todos los hotkeys de window management procesados');
}

function launchItem(filePath, itemType) {
  // Si es una app UWP, usar el método más confiable para Windows Store apps
  if (itemType === 'uwp') {
    // El método más confiable es usar explorer.exe con shell:AppsFolder
    // El AppID debe estar en formato: PackageFamilyName!AppID
    const escapedAppId = filePath.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/"/g, '`"');
    
    // Método 1: Usar explorer.exe directamente con shell:AppsFolder (más confiable)
    const cmd = `explorer.exe shell:AppsFolder\\${escapedAppId}`;
    exec(cmd, (err1) => {
      if (err1) {
        // Método 2: Usar PowerShell Start-Process con el AppID
        const ps = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process '${escapedAppId}'"`;
        exec(ps, (err2) => {
          if (err2) {
            // Método 3: Fallback usando PowerShell con explorer
            const ps2 = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process explorer.exe -ArgumentList 'shell:AppsFolder\\\\${escapedAppId}'"`;
            exec(ps2, (err3) => {
              if (err3) {
                console.error('Error lanzando app UWP:', filePath, err3);
              }
            });
          }
        });
      }
    });
    return;
  }
  
  // Para aplicaciones instaladas por nombre, buscar el ejecutable
  if (itemType === 'installed') {
    const ps = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Get-Command '${filePath.replace(/"/g, '`"')}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1"`;
    exec(ps, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        const exePath = stdout.trim();
        shell.openPath(exePath).catch(() => {
          // Si no se encuentra, intentar abrir directamente
          shell.openPath(filePath).catch((e) => {
            console.error('Error lanzando aplicación instalada:', e);
          });
        });
      } else {
        // Intentar abrir directamente
        shell.openPath(filePath).catch((e) => {
          console.error('Error lanzando aplicación:', e);
        });
      }
    });
    return;
  }
  
  // Para otros tipos (shortcut, registry), usar PowerShell Start-Process
  const escapedPath = filePath.replace(/\\/g, '/').replace(/"/g, '`"');
  const ps = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process -FilePath \"${escapedPath}\""`;
  exec(ps, (err) => {
    if (err) {
      // Fallback: usar shell.openPath
      shell.openPath(filePath).catch((e) => {
        console.error('Error lanzando aplicación:', e);
      });
    }
  });
}

// IPC
// Función para obtener icono de una aplicación
// Deshabilitada para evitar errores al iniciar
async function getAppIcon(appPath, appType) {
  // Retornar null - los iconos están deshabilitados
  return null;
}

ipcMain.handle('get-apps', () => {
  return appIndex;
});

ipcMain.handle('get-app-icon', async (_e, appPath, appType) => {
  return await getAppIcon(appPath, appType);
});

ipcMain.handle('reload-index', () => {
  scanAllApps();
  return appIndex;
});

ipcMain.handle('launch', (_e, targetPath, itemType) => {
  if (typeof targetPath === 'string') {
    // Guardar en historial de lanzamientos
    const app = appIndex.find(a => a.path === targetPath || a.id === targetPath);
    if (app) {
      configManager.addLaunchHistory(app);
    }
    launchItem(targetPath, itemType);
  }
});

// Guardar búsquedas cuando se hace clic en una app
ipcMain.on('save-search', (_e, query) => {
  if (query && query.trim().length >= 2) {
    configManager.addSearchHistory(query.trim());
  }
});

// Función para crear ventana de configuración
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  
  const baseDir = getBaseDir();
  const uiConfig = configManager.getUI();
  
  settingsWindow = new BrowserWindow({
    width: uiConfig.windowWidth || 900,
    height: uiConfig.windowHeight || 600,
    backgroundColor: '#14141c',
    webPreferences: {
      preload: path.join(baseDir, 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Configuración - Win11 Dev Launcher',
    show: false,
    frame: true,
    resizable: true
  });
  
  settingsWindow.loadFile(path.join(baseDir, 'src', 'renderer', 'settings.html'));
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return {
    hotkeys: configManager.getHotkeys(),
    ui: configManager.getUI(),
    scan: configManager.getScanConfig(),
    windowManagement: configManager.getWindowConfig(),
    favorites: configManager.getFavorites(),
    searchHistory: configManager.getSearchHistory(),
    launchHistory: configManager.getLaunchHistory()
  };
});

ipcMain.handle('set-hotkey', (_e, newHotkey) => {
  if (typeof newHotkey === 'string' && newHotkey.trim()) {
    saveConfig({ hotkey: newHotkey.trim() });
    registerHotkey();
  }
  return config.hotkey;
});

// IPC Handlers para window management
ipcMain.handle('tile-windows', async (_e, layout) => {
  return await windowManager.tileWindows(layout || 'grid');
});

ipcMain.handle('move-window-side', async (_e, direction) => {
  return await windowManager.moveWindowToSide(direction);
});

ipcMain.handle('center-window', async () => {
  return await windowManager.centerActiveWindow();
});

ipcMain.handle('maximize-window', async () => {
  return await windowManager.maximizeActiveWindow();
});

ipcMain.handle('minimize-window', async () => {
  return await windowManager.minimizeActiveWindow();
});

ipcMain.handle('switch-workspace', async (_e, direction) => {
  return await windowManager.switchVirtualDesktop(direction);
});

ipcMain.handle('get-windows', async () => {
  return await windowManager.getAllWindows();
});

ipcMain.handle('get-active-window', async () => {
  return await windowManager.getActiveWindow();
});

// Config API Handlers
ipcMain.handle('set-config', (_e, section, key, value) => {
  if (section === 'ui') {
    configManager.setUI(key, value);
  } else if (section === 'scan') {
    configManager.setScanConfig(key, value);
  } else if (section === 'windowManagement') {
    configManager.setWindowConfig(key, value);
  } else if (section === 'search' && key === 'lastQuery') {
    // Guardar búsqueda cuando se lanza una app
    configManager.addSearchHistory(value);
  }
  return true;
});

ipcMain.handle('get-favorites', () => {
  return configManager.getFavorites();
});

ipcMain.handle('add-favorite', (_e, appId) => {
  configManager.addFavorite(appId);
  return true;
});

ipcMain.handle('remove-favorite', (_e, appId) => {
  configManager.removeFavorite(appId);
  return true;
});

ipcMain.handle('get-search-history', () => {
  return configManager.getSearchHistory();
});

ipcMain.handle('get-launch-history', () => {
  return configManager.getLaunchHistory();
});

ipcMain.handle('clear-search-history', () => {
  configManager.clearSearchHistory();
  return true;
});

ipcMain.handle('clear-launch-history', () => {
  configManager.clearLaunchHistory();
  return true;
});

ipcMain.handle('export-config', () => {
  return configManager.export();
});

ipcMain.handle('import-config', (_e, configData) => {
  return configManager.import(configData);
});

ipcMain.handle('reset-config', () => {
  configManager.reset();
  return true;
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
  return true;
});

app.whenReady().then(() => {
  try {
    loadConfig();
    scanAllApps(); // Escanear todas las aplicaciones
    createWindow();
    
    // Registrar hotkeys después de que la ventana esté lista
    setTimeout(() => {
      registerHotkey(); // Registrar primero el hotkey principal
      registerWindowHotkeys(); // Luego los hotkeys de window management
      
      console.log(`\n🎯 Aplicación iniciada correctamente.`);
      console.log(`📌 Presiona ${config.hotkey} (Ctrl+Alt+Space) para abrir/cerrar el launcher.\n`);
      console.log('Hotkeys de window management disponibles:');
      console.log('  - Ctrl+Alt+T: Organizar ventanas en grid');
      console.log('  - Ctrl+Alt+Shift+T: Organizar verticalmente');
      console.log('  - Ctrl+Alt+H: Organizar horizontalmente');
      console.log('  - Ctrl+Alt+Left/Right: Mover ventana a lado / Cambiar workspace');
      console.log('  - Ctrl+Alt+C: Centrar ventana');
      console.log('  - Ctrl+Alt+Up/Down: Maximizar/Minimizar\n');
    }, 1000);
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // No hacer nada - mantener la app corriendo en segundo plano
  // La app solo se cerrará cuando el usuario cierre explícitamente el proceso
});

// Handler IPC para ocultar la ventana principal
ipcMain.handle('hide-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
    return true;
  }
  return false;
});

// Handler IPC para actualizar tema
ipcMain.handle('update-theme', (_e, theme) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Enviar mensaje al renderer para aplicar el tema
    mainWindow.webContents.send('theme-changed', theme);
    return true;
  }
  return false;
});

// Escuchar cambios de tema
ipcMain.on('theme-changed', (_e, theme) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme-changed', theme);
  }
});