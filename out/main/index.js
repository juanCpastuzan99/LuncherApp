"use strict";
const { app, BrowserWindow, globalShortcut, ipcMain, shell, nativeImage, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const windowManager = require("./windowManager");
const configManager = require("./config");
const getBaseDir = () => {
  const isGlobal = __dirname.includes("node_modules") || __dirname.includes("AppData");
  return isGlobal ? path.dirname(__dirname) : process.cwd();
};
let mainWindow = null;
let settingsWindow = null;
let appIndex = [];
let config = {
  hotkey: "Ctrl+Space",
  theme: "dark",
  transparency: true,
  excludePatterns: ["uninstall", "help", "documentation"],
  windowHotkeys: {
    tileGrid: "Ctrl+Alt+T",
    tileVertical: "Ctrl+Alt+Shift+T",
    tileHorizontal: "Ctrl+Alt+H",
    moveLeft: "Ctrl+Alt+Left",
    moveRight: "Ctrl+Alt+Right",
    center: "Ctrl+Alt+C",
    maximize: "Ctrl+Alt+Up",
    minimize: "Ctrl+Alt+Down",
    workspaceNext: "Ctrl+Alt+Right",
    workspacePrev: "Ctrl+Alt+Left"
  }
};
const userDataDir = app.getPath("userData");
const configPath = path.join(userDataDir, "config.json");
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      config = { ...config, ...parsed };
    } else {
      fs.mkdirSync(userDataDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } catch (err) {
  }
}
function saveConfig(partial) {
  config = { ...config, ...partial };
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (_) {
  }
}
function isExcluded(name) {
  const lower = name.toLowerCase();
  return config.excludePatterns.some((p) => lower.includes(p));
}
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
        ($_.Name -notmatch '^Microsoft.Windows.(ContentDeliveryManager|PCASvc|PushNotifications|PushToInstall|ShellExperienceHost|Search|AppXDeploymentServer|DesktopAppInstaller|WindowsUpdate|UpdateAssistant|SecureBoot|Recovery|Reset)' -or
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
    
    # Método 4: Buscar aplicaciones en AppDataLocal (WhatsApp, Electron apps, etc.)
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
      Write-Host "Error escaneando AppDataLocal: $_" -ForegroundColor Yellow
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
      console.error("Error escaneando UWP/Installed apps:", error.message);
    }
    if (stdout && stdout.trim()) {
      try {
        const apps = JSON.parse(stdout);
        const appsArray = Array.isArray(apps) ? apps : [apps];
        appsArray.forEach((app2) => {
          if (app2 && app2.Name && !isExcluded(app2.Name)) {
            if (app2.Type === "UWP" && app2.AppId) {
              results.push({
                id: `uwp:${app2.AppId}`,
                name: app2.Name,
                path: app2.AppId,
                ext: ".uwp",
                type: "uwp"
              });
            } else if (app2.Type === "LocalApp" && app2.Path) {
              results.push({
                id: `localapp:${app2.Path}`,
                name: app2.Name,
                path: app2.Path,
                ext: path.extname(app2.Path).toLowerCase() || ".exe",
                type: "registry"
                // Usar tipo registry para manejar igual
              });
            } else if (app2.Path && fs.existsSync(app2.Path)) {
              results.push({
                id: `installed:${app2.Path}`,
                name: app2.Name,
                path: app2.Path,
                ext: path.extname(app2.Path).toLowerCase() || ".exe",
                type: "registry"
              });
            } else {
              results.push({
                id: `installed:${app2.AppId || app2.Name}`,
                name: app2.Name,
                path: app2.Name,
                // Se buscará el ejecutable por nombre
                ext: ".exe",
                type: "installed"
              });
            }
          }
        });
      } catch (e) {
        console.error("Error parsing apps:", e, stdout.substring(0, 200));
      }
    }
    callback(results);
  });
}
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
      # Buscar en AppDataRoaming para aplicaciones portables
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
      console.error("Error escaneando registry/executables:", error.message);
    }
    if (stdout && stdout.trim()) {
      try {
        const apps = JSON.parse(stdout);
        const appsArray = Array.isArray(apps) ? apps : [apps];
        appsArray.forEach((app2) => {
          if (app2 && app2.Name && app2.Path && !isExcluded(app2.Name)) {
            results.push({
              id: `reg:${app2.Path}`,
              name: app2.Name,
              path: app2.Path,
              ext: path.extname(app2.Path).toLowerCase() || ".exe",
              type: "registry"
            });
          }
        });
      } catch (e) {
        console.error("Error parsing registry apps:", e, stdout.substring(0, 200));
      }
    }
    callback(results);
  });
}
function scanStartMenu() {
  const results = [];
  const startDirs = [
    path.join(process.env.ProgramData || "C:/ProgramData", "Microsoft/Windows/Start Menu/Programs"),
    path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || "", "AppData/Roaming"), "Microsoft/Windows/Start Menu/Programs")
  ];
  const allowedExt = /* @__PURE__ */ new Set([".lnk", ".url", ".appref-ms"]);
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
          const displayName = entry.name.replace(ext, "");
          if (!isExcluded(displayName)) {
            results.push({
              id: full,
              name: displayName,
              path: full,
              ext,
              type: "shortcut"
            });
          }
        }
      }
    }
  }
  for (const d of startDirs) walk(d);
  return results;
}
function scanAllApps() {
  console.log("🔍 Escaneando aplicaciones instaladas...");
  console.log("   Fuentes: Menú de Inicio, UWP/Store, Registro, Program Files, AppData, PATH");
  const allResults = [];
  const startMenuResults = scanStartMenu();
  allResults.push(...startMenuResults);
  console.log(`✓ Menú de Inicio: ${startMenuResults.length} aplicaciones encontradas`);
  let completedScans = 0;
  const totalAsyncScans = 2;
  function finalizeScan() {
    completedScans++;
    if (completedScans === totalAsyncScans) {
      const byKey = /* @__PURE__ */ new Map();
      const byName = /* @__PURE__ */ new Map();
      for (const r of allResults) {
        const nameKey = r.name.toLowerCase().trim();
        const fullKey = `${nameKey}::${r.path.toLowerCase()}`;
        if (byName.has(nameKey)) {
          const existing = byName.get(nameKey);
          const priority = { "shortcut": 4, "registry": 3, "uwp": 2, "installed": 1 };
          const existingPriority = priority[existing.type] || 0;
          const newPriority = priority[r.type] || 0;
          if (newPriority <= existingPriority) {
            continue;
          }
        }
        if (!byKey.has(fullKey)) {
          byKey.set(fullKey, r);
          byName.set(nameKey, r);
        } else {
          const existing = byKey.get(fullKey);
          if (r.type === "shortcut" && existing.type !== "shortcut") {
            byKey.set(fullKey, r);
            byName.set(nameKey, r);
          }
        }
      }
      appIndex = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
      console.log(`
✅ Escaneo completado: ${appIndex.length} aplicaciones únicas encontradas`);
      console.log(`   - Menú de Inicio: ${startMenuResults.length}`);
      console.log(`   - Total antes de deduplicar: ${allResults.length}`);
      console.log(`   - Después de deduplicar: ${appIndex.length}`);
      const byType = {};
      appIndex.forEach((app2) => {
        byType[app2.type] = (byType[app2.type] || 0) + 1;
      });
      console.log(`   - Por tipo:`, byType);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("apps-updated", appIndex.length);
      }
    }
  }
  scanUWPApps((uwpResults) => {
    console.log(`✓ UWP/Store/Installed: ${uwpResults.length} aplicaciones encontradas`);
    allResults.push(...uwpResults);
    finalizeScan();
  });
  scanRegistryApps((regResults) => {
    console.log(`✓ Registry/Executables/PATH: ${regResults.length} aplicaciones encontradas`);
    allResults.push(...regResults);
    finalizeScan();
  });
  setTimeout(() => {
    if (completedScans < totalAsyncScans) {
      console.log(`⚠ Advertencia: Solo ${completedScans}/${totalAsyncScans} escaneos completaron. Continuando con los resultados disponibles.`);
      while (completedScans < totalAsyncScans) {
        completedScans++;
        if (completedScans === totalAsyncScans) {
          finalizeScan();
        }
      }
    }
  }, 8e3);
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
      preload: path.join(getBaseDir(), "src", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.setMenuBarVisibility(false);
  const baseDir = getBaseDir();
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173").then(() => {
      mainWindow.center();
      mainWindow.show();
      mainWindow.focus();
    }).catch(() => {
      const rendererPath = path.join(baseDir, "src", "renderer", "index.html");
      mainWindow.loadFile(rendererPath).then(() => {
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
      }).catch((err) => {
        console.error("Error cargando el archivo HTML:", err);
      });
    });
  } else {
    const rendererPath = path.join(baseDir, "dist-electron", "renderer", "index.html");
    mainWindow.loadFile(rendererPath).then(() => {
      mainWindow.center();
      mainWindow.show();
      mainWindow.focus();
    }).catch((err) => {
      console.error("Error cargando el archivo HTML:", err);
    });
  }
  mainWindow.on("blur", () => {
    if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
  });
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Error cargando contenido:", errorCode, errorDescription);
  });
}
function registerHotkey() {
  if (!mainWindow) {
    console.warn("⚠ Ventana principal no creada aún, reintentando en 500ms...");
    setTimeout(() => registerHotkey(), 500);
    return;
  }
  globalShortcut.unregisterAll();
  const handleHotkey = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    console.log("🔔 Hotkey presionado!");
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.center();
      mainWindow.showInactive();
      mainWindow.focus();
      mainWindow.webContents.send("focus-search");
    }
  };
  const hotkeyVariations = [
    config.hotkey,
    config.hotkey.replace("Ctrl", "CommandOrControl"),
    // Windows usa CommandOrControl
    "Ctrl+Alt+Space",
    // Alternativa si Ctrl+Space falla
    "CommandOrControl+Alt+Space"
  ];
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
      if (hotkey !== config.hotkey) {
        console.log(`📝 Actualizando hotkey de '${config.hotkey}' a '${hotkey}'`);
        saveConfig({ hotkey });
        config.hotkey = hotkey;
      }
    } else {
      console.warn(`❌ No se pudo registrar: ${hotkey}`);
    }
  }
  if (!registered) {
    console.error("❌ ERROR: No se pudo registrar ningún hotkey. La aplicación seguirá funcionando pero sin atajo de teclado.");
    console.log("💡 Puedes abrir la aplicación desde el menú o cambiar el hotkey en Configuración.");
  }
  const isRegistered = globalShortcut.isRegistered(workingHotkey || config.hotkey);
  console.log(`🔍 Verificación: Hotkey ${workingHotkey || config.hotkey} está registrado: ${isRegistered}`);
}
function registerWindowHotkeys() {
  const hotkeys = config.windowHotkeys || {};
  if (hotkeys.tileGrid) {
    globalShortcut.register(hotkeys.tileGrid, () => {
      windowManager.tileWindows("grid");
    });
  }
  if (hotkeys.tileVertical) {
    globalShortcut.register(hotkeys.tileVertical, () => {
      windowManager.tileWindows("vertical");
    });
  }
  if (hotkeys.tileHorizontal) {
    globalShortcut.register(hotkeys.tileHorizontal, () => {
      windowManager.tileWindows("horizontal");
    });
  }
  if (hotkeys.moveLeft) {
    globalShortcut.register(hotkeys.moveLeft, async () => {
      const activeWindow = await windowManager.getActiveWindow();
      if (activeWindow) {
        screen.getPrimaryDisplay().workAreaSize.width;
        if (activeWindow.X <= 50) {
          windowManager.switchVirtualDesktop("previous");
        } else {
          windowManager.moveWindowToSide("left");
        }
      }
    });
  }
  if (hotkeys.moveRight) {
    globalShortcut.register(hotkeys.moveRight, async () => {
      const activeWindow = await windowManager.getActiveWindow();
      if (activeWindow) {
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
        if (activeWindow.X + activeWindow.Width >= screenWidth - 50) {
          windowManager.switchVirtualDesktop("next");
        } else {
          windowManager.moveWindowToSide("right");
        }
      }
    });
  }
  if (hotkeys.center) {
    globalShortcut.register(hotkeys.center, () => {
      windowManager.centerActiveWindow();
    });
  }
  if (hotkeys.maximize) {
    globalShortcut.register(hotkeys.maximize, () => {
      windowManager.maximizeActiveWindow();
    });
  }
  if (hotkeys.minimize) {
    globalShortcut.register(hotkeys.minimize, () => {
      windowManager.minimizeActiveWindow();
    });
  }
  if (hotkeys.workspaceNext && hotkeys.workspaceNext !== hotkeys.moveRight) {
    globalShortcut.register(hotkeys.workspaceNext, () => {
      windowManager.switchVirtualDesktop("next");
    });
  }
  if (hotkeys.workspacePrev && hotkeys.workspacePrev !== hotkeys.moveLeft) {
    globalShortcut.register(hotkeys.workspacePrev, () => {
      windowManager.switchVirtualDesktop("previous");
    });
  }
  console.log("✓ Hotkeys de window management registrados");
}
function launchItem(filePath, itemType) {
  if (itemType === "uwp") {
    const escapedAppId = filePath.replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/"/g, '`"');
    const cmd = `explorer.exe shell:AppsFolder\\${escapedAppId}`;
    exec(cmd, (err1) => {
      if (err1) {
        const ps2 = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process '${escapedAppId}'"`;
        exec(ps2, (err2) => {
          if (err2) {
            const ps22 = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process explorer.exe -ArgumentList 'shell:AppsFolder\\\\${escapedAppId}'"`;
            exec(ps22, (err3) => {
              if (err3) {
                console.error("Error lanzando app UWP:", filePath, err3);
              }
            });
          }
        });
      }
    });
    return;
  }
  if (itemType === "installed") {
    const ps2 = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Get-Command '${filePath.replace(/"/g, '`"')}' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1"`;
    exec(ps2, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        const exePath = stdout.trim();
        shell.openPath(exePath).catch(() => {
          shell.openPath(filePath).catch((e) => {
            console.error("Error lanzando aplicación instalada:", e);
          });
        });
      } else {
        shell.openPath(filePath).catch((e) => {
          console.error("Error lanzando aplicación:", e);
        });
      }
    });
    return;
  }
  const escapedPath = filePath.replace(/\\/g, "/").replace(/"/g, '`"');
  const ps = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process -FilePath "${escapedPath}""`;
  exec(ps, (err) => {
    if (err) {
      shell.openPath(filePath).catch((e) => {
        console.error("Error lanzando aplicación:", e);
      });
    }
  });
}
async function getAppIcon(appPath, appType) {
  return null;
}
ipcMain.handle("get-apps", () => {
  return appIndex;
});
ipcMain.handle("get-app-icon", async (_e, appPath, appType) => {
  return await getAppIcon();
});
ipcMain.handle("reload-index", () => {
  scanAllApps();
  return appIndex;
});
ipcMain.handle("launch", (_e, targetPath, itemType) => {
  if (typeof targetPath === "string") {
    const app2 = appIndex.find((a) => a.path === targetPath || a.id === targetPath);
    if (app2) {
      configManager.addLaunchHistory(app2);
    }
    launchItem(targetPath, itemType);
  }
});
ipcMain.on("save-search", (_e, query) => {
  if (query && query.trim().length >= 2) {
    configManager.addSearchHistory(query.trim());
  }
});
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
    backgroundColor: "#14141c",
    webPreferences: {
      preload: path.join(baseDir, "src", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "Configuración - Win11 Dev Launcher",
    show: false,
    frame: true,
    resizable: true
  });
  settingsWindow.loadFile(path.join(baseDir, "src", "renderer", "settings.html"));
  settingsWindow.once("ready-to-show", () => {
    settingsWindow.show();
  });
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}
ipcMain.handle("get-config", () => {
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
ipcMain.handle("set-hotkey", (_e, newHotkey) => {
  if (typeof newHotkey === "string" && newHotkey.trim()) {
    saveConfig({ hotkey: newHotkey.trim() });
    registerHotkey();
  }
  return config.hotkey;
});
ipcMain.handle("tile-windows", async (_e, layout) => {
  return await windowManager.tileWindows(layout || "grid");
});
ipcMain.handle("move-window-side", async (_e, direction) => {
  return await windowManager.moveWindowToSide(direction);
});
ipcMain.handle("center-window", async () => {
  return await windowManager.centerActiveWindow();
});
ipcMain.handle("maximize-window", async () => {
  return await windowManager.maximizeActiveWindow();
});
ipcMain.handle("minimize-window", async () => {
  return await windowManager.minimizeActiveWindow();
});
ipcMain.handle("switch-workspace", async (_e, direction) => {
  return await windowManager.switchVirtualDesktop(direction);
});
ipcMain.handle("get-windows", async () => {
  return await windowManager.getAllWindows();
});
ipcMain.handle("get-active-window", async () => {
  return await windowManager.getActiveWindow();
});
ipcMain.handle("set-config", (_e, section, key, value) => {
  if (section === "ui") {
    configManager.setUI(key, value);
  } else if (section === "scan") {
    configManager.setScanConfig(key, value);
  } else if (section === "windowManagement") {
    configManager.setWindowConfig(key, value);
  } else if (section === "search" && key === "lastQuery") {
    configManager.addSearchHistory(value);
  }
  return true;
});
ipcMain.handle("get-favorites", () => {
  return configManager.getFavorites();
});
ipcMain.handle("add-favorite", (_e, appId) => {
  configManager.addFavorite(appId);
  return true;
});
ipcMain.handle("remove-favorite", (_e, appId) => {
  configManager.removeFavorite(appId);
  return true;
});
ipcMain.handle("get-search-history", () => {
  return configManager.getSearchHistory();
});
ipcMain.handle("get-launch-history", () => {
  return configManager.getLaunchHistory();
});
ipcMain.handle("clear-search-history", () => {
  configManager.clearSearchHistory();
  return true;
});
ipcMain.handle("clear-launch-history", () => {
  configManager.clearLaunchHistory();
  return true;
});
ipcMain.handle("export-config", () => {
  return configManager.export();
});
ipcMain.handle("import-config", (_e, configData) => {
  return configManager.import(configData);
});
ipcMain.handle("reset-config", () => {
  configManager.reset();
  return true;
});
ipcMain.handle("open-settings", () => {
  createSettingsWindow();
  return true;
});
app.whenReady().then(() => {
  try {
    loadConfig();
    scanAllApps();
    createWindow();
    setTimeout(() => {
      registerHotkey();
      registerWindowHotkeys();
      console.log(`
🎯 Aplicación iniciada correctamente.`);
      console.log(`📌 Presiona ${config.hotkey} (o Ctrl+Alt+Space) para abrir/cerrar el launcher.
`);
    }, 1e3);
    console.log("Hotkeys de window management disponibles:");
    console.log("  - Ctrl+Alt+T: Organizar ventanas en grid");
    console.log("  - Ctrl+Alt+Shift+T: Organizar verticalmente");
    console.log("  - Ctrl+Alt+H: Organizar horizontalmente");
    console.log("  - Ctrl+Alt+Left/Right: Mover ventana a lado / Cambiar workspace");
    console.log("  - Ctrl+Alt+C: Centrar ventana");
    console.log("  - Ctrl+Alt+Up/Down: Maximizar/Minimizar");
  } catch (error) {
    console.error("Error al iniciar la aplicación:", error);
  }
});
process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
app.on("window-all-closed", () => {
});
ipcMain.handle("hide-window", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
    return true;
  }
  return false;
});
ipcMain.handle("update-theme", (_e, theme) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("theme-changed", theme);
    return true;
  }
  return false;
});
ipcMain.on("theme-changed", (_e, theme) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("theme-changed", theme);
  }
});
