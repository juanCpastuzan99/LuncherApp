const { app, BrowserWindow, globalShortcut, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const Store = require('electron-store');

// Configuración de caché (se inicializa cuando app está lista)
let CACHE_FILE;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener la ruta del caché de forma segura
function getCacheFile() {
  if (!CACHE_FILE) {
    CACHE_FILE = path.join(app.getPath('userData'), 'apps-cache.json');
  }
  return CACHE_FILE;
}

// Configuración persistente
const store = new Store({
  name: 'config',
  defaults: {
    pomodoro: {},
    flashcards: { list: [] },
    notes: [],
    quizzes: [],
    snippets: [],
    todos: [],
    favorites: [],
    history: []
  }
});

let mainWindow;

function getBaseDir() {
  if (app.isPackaged) {
    return process.resourcesPath;
    }
  return __dirname.split(path.sep).slice(0, -1).join(path.sep);
}

function createWindow() {
  console.log('=== CREANDO VENTANA ===');
  console.log('App packaged:', app.isPackaged);
  console.log('Base dir:', getBaseDir());

  const isPackaged = app.isPackaged;
  const baseDir = getBaseDir();
  
  // Determinar ruta del preload
  let preloadPath;
  if (isPackaged) {
    // En producción, electron-vite copia preload.js a out/preload/index.js
    // Pero también puede estar en resourcesPath
    const possiblePaths = [
      path.join(process.resourcesPath, 'preload.js'),
      path.join(process.resourcesPath, 'out', 'preload', 'index.js'),
      path.join(__dirname, 'preload.js'),
      path.join(__dirname, '..', 'preload.js')
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        preloadPath = possiblePath;
        break;
      }
    }
    
    if (!preloadPath) {
      console.error('❌ No se encontró preload.js en producción');
      preloadPath = path.join(process.resourcesPath, 'preload.js'); // Fallback
    }
  } else {
    preloadPath = path.join(__dirname, 'preload.js');
  }
  
  console.log('📦 Preload path:', preloadPath);
  console.log('📦 Preload existe:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 800,
    height: 420,
    show: false, // No mostrar hasta que esté listo
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: !isPackaged ? false : true,
    skipTaskbar: !isPackaged ? false : true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Eventos de la ventana
  mainWindow.on('blur', () => {
    if (isPackaged && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Error cargando:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Contenido cargado exitosamente');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.center();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Cargar contenido según el entorno
  if (!isPackaged) {
    // DESARROLLO: Intentar Vite primero, luego archivo local
    const devPort = process.env.VITE_DEV_SERVER_PORT || process.env.PORT || '5174';
    const devUrl = `http://localhost:${devPort}`;
    
    console.log('🔍 [DEV] Intentando cargar desde Vite:', devUrl);
    
    mainWindow.loadURL(devUrl)
      .then(() => {
        console.log('✅ [DEV] Cargado desde Vite dev server');
      })
      .catch((err) => {
        console.log('⚠️ [DEV] Vite no disponible, intentando archivo local...');
        console.log('Error:', err.message);
        
        // Intentar archivos locales después de un delay
        setTimeout(() => {
          const paths = [
            path.join(baseDir, 'dist-electron', 'renderer', 'index.html'),
            path.join(baseDir, 'out', 'renderer', 'index.html'),
            path.join(baseDir, 'src', 'renderer', 'index.html')
          ];
          
          let loaded = false;
          for (const htmlPath of paths) {
            if (fs.existsSync(htmlPath)) {
              console.log('📄 [DEV] Cargando desde archivo:', htmlPath);
              mainWindow.loadFile(htmlPath)
                .then(() => {
                  console.log('✅ [DEV] Cargado desde archivo exitosamente');
                })
                .catch((e) => {
                  console.error('❌ [DEV] Error cargando archivo:', e.message);
                });
              loaded = true;
              break;
            }
          }
          
          if (!loaded) {
            console.error('❌ [DEV] No se encontró ningún archivo HTML');
            const fallbackHtml = '<html><body style="background:#1a1a2e;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div><h1>Dev Launcher</h1><p>Esperando servidor Vite...</p></div></body></html>';
            mainWindow.loadURL(`data:text/html,${encodeURIComponent(fallbackHtml)}`);
          }
        }, 2000);
      });
  } else {
    // PRODUCCIÓN: Cargar desde out/renderer
    const rendererPath = path.join(process.resourcesPath, 'out', 'renderer', 'index.html');
    console.log('📦 [PROD] Cargando desde:', rendererPath);
    console.log('📦 [PROD] Archivo existe:', fs.existsSync(rendererPath));
    
    mainWindow.loadFile(rendererPath)
      .then(() => {
        console.log('✅ [PROD] Cargado exitosamente');
      })
      .catch((err) => {
        console.error('❌ [PROD] Error cargando:', err);
      });
  }
}

// Función simplificada para escanear aplicaciones
function scanAllApps() {
  const results = [];
  const startTime = Date.now();

// Escanear Menú de Inicio
  const startDirs = [
    path.join(process.env.ProgramData || 'C:/ProgramData', 'Microsoft/Windows/Start Menu/Programs'),
    path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData/Roaming'), 'Microsoft/Windows/Start Menu/Programs')
  ];

  const allowedExt = new Set(['.lnk', '.url', '.appref-ms']);
  const seenIds = new Set(); // Para evitar duplicados

  function walk(dir, depth = 0) {
    // Limitar profundidad para evitar bucles infinitos
    if (depth > 10) return;

    try {
      if (!fs.existsSync(dir)) {
      return;
    }
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
    for (const entry of entries) {
        try {
      const full = path.join(dir, entry.name);
          
      if (entry.isDirectory()) {
            walk(full, depth + 1);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExt.has(ext)) {
              const displayName = entry.name.replace(ext, '').trim();
              
              // Evitar nombres vacíos y duplicados
              if (displayName && !seenIds.has(full)) {
                seenIds.add(full);
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
        } catch (entryError) {
          // Ignorar errores de archivos individuales
          continue;
        }
      }
    } catch (e) {
      // Ignorar errores de directorios
      console.error(`Error escaneando directorio ${dir}:`, e.message);
    }
  }

  console.log('🔍 Iniciando escaneo de aplicaciones...');
  
  for (const d of startDirs) {
    if (fs.existsSync(d)) {
      console.log(`📁 Escaneando: ${d}`);
      walk(d);
    } else {
      console.log(`⚠️ Directorio no existe: ${d}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✓ Escaneadas ${results.length} aplicaciones en ${duration}ms`);
  
  return results;
}

// Función para cargar apps con caché
async function loadAppsWithCache() {
  try {
    const cacheFilePath = getCacheFile();
    
    // Cargar del cache si existe
    if (fs.existsSync(cacheFilePath)) {
      const cacheData = fs.readFileSync(cacheFilePath, 'utf-8');
      const cache = JSON.parse(cacheData);
      
      if (Date.now() - cache.timestamp < CACHE_DURATION && Array.isArray(cache.apps)) {
        console.log(`⚡ Cargado desde caché (${cache.apps.length} apps)`);
        return cache.apps;
      } else {
        console.log('🔄 Cache expirado, reescaneando...');
      }
    }
    
    // Escanear si no hay cache válido
    console.log('🔍 Escaneando aplicaciones...');
    console.time('⏱️ Apps scan');
    const apps = scanAllApps();
    console.timeEnd('⏱️ Apps scan');
    
    // Guardar en cache
    try {
      fs.writeFileSync(cacheFilePath, JSON.stringify({
        timestamp: Date.now(),
        apps
      }, null, 2));
      console.log(`💾 Cache guardado exitosamente en: ${cacheFilePath}`);
    } catch (cacheError) {
      console.error('⚠️ Error guardando cache:', cacheError.message);
    }
    
    return apps;
  } catch (error) {
    console.error('❌ Error en loadAppsWithCache:', error);
    // En caso de error, intentar escanear directamente
    return scanAllApps();
  }
}

// IPC Handlers
ipcMain.on('scan-apps', async (event) => {
  console.log('🔍 [IPC] Solicitud de escaneo de aplicaciones recibida');
  console.log('🔍 [IPC] Sender disponible:', !!event?.sender);
  console.log('🔍 [IPC] Sender destroyed:', event?.sender?.isDestroyed?.() || 'N/A');
  
  try {
    const apps = await loadAppsWithCache();
    console.log(`📤 [IPC] Enviando ${apps.length} aplicaciones al renderer`);
    
    // Enviar siempre al sender que solicitó (más confiable)
    if (event?.sender && !event.sender.isDestroyed()) {
      try {
        event.sender.send('apps-updated', apps);
        console.log('✅ [IPC] Apps enviadas al sender exitosamente');
      } catch (sendError) {
        console.error('❌ [IPC] Error enviando al sender:', sendError);
        // Fallback: intentar con mainWindow
      if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('apps-updated', apps);
          console.log('✅ [IPC] Apps enviadas a mainWindow (fallback)');
        }
      }
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      // Fallback: enviar a la ventana principal
      mainWindow.webContents.send('apps-updated', apps);
      console.log('✅ [IPC] Apps enviadas a mainWindow exitosamente');
    } else {
      console.warn('⚠️ [IPC] No hay ventana disponible para enviar apps');
      console.warn('⚠️ [IPC] mainWindow existe:', !!mainWindow);
      console.warn('⚠️ [IPC] mainWindow destroyed:', mainWindow?.isDestroyed?.() || 'N/A');
    }
  } catch (error) {
    console.error('❌ [IPC] Error en scan-apps:', error);
    // Enviar array vacío en caso de error
    try {
      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('apps-updated', []);
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('apps-updated', []);
      }
    } catch (sendError) {
      console.error('❌ [IPC] Error enviando array vacío:', sendError);
    }
  }
});

ipcMain.on('launch', (event, app) => {
  console.log('🚀 Lanzando aplicación:', app.name);
  try {
    // Guardar en historial
    const history = store.get('history', []);
    history.unshift({
      id: app.id,
      timestamp: Date.now(),
      appName: app.name
    });
    store.set('history', history.slice(0, 100)); // Limitar a 100

    if (app.type === 'uwp' && app.path.includes('!')) {
      // Aplicación UWP
      exec(`start shell:AppsFolder\\${app.path}`, (error) => {
        if (error) {
          console.error('Error lanzando UWP app:', error);
        }
      });
  } else {
      // Aplicación normal
      shell.openPath(app.path).catch(err => {
        console.error('Error abriendo:', err);
        // Intentar como comando
        exec(`start "" "${app.path}"`, (error) => {
          if (error) {
            console.error('Error ejecutando:', error);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error en launch:', error);
  }
});

ipcMain.on('window-action', (event, { action, target }) => {
  console.log('🪟 Acción de ventana:', action, target);
  // Aquí puedes agregar lógica de gestión de ventanas si es necesario
});

ipcMain.on('hide-window', () => {
  if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
      }
});

// IPC Handlers para configuración
ipcMain.handle('config-set', (event, { section, key, value }) => {
  try {
    const current = store.get(section, {});
    current[key] = value;
    store.set(section, current);
    return { success: true };
  } catch (error) {
    console.error('Error guardando config:', error);
    return { success: false, error: error.message };
        }
});

ipcMain.handle('config-get', () => {
  try {
    return store.store;
  } catch (error) {
    console.error('Error obteniendo config:', error);
    return {};
    }
  });

app.whenReady().then(() => {
      // Limpiar cache al iniciar (opcional, descomentar si es necesario)
      // if (!app.isPackaged) {
      //   const { session } = require('electron');
      //   session.defaultSession.clearCache();
      //   session.defaultSession.clearStorageData();
      // }

      createWindow();

      // Esperar a que la ventana esté lista antes de enviar apps
      // El renderer solicitará las apps cuando esté listo
      // No enviar automáticamente aquí para evitar problemas de timing

  // IPC Handler para limpiar cache
  ipcMain.on('clear-cache', async () => {
    try {
      await session.defaultSession.clearCache();
      await session.defaultSession.clearStorageData();
      console.log('✓ Cache de Electron limpiado');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('cache-cleared');
      }
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  });

  // Registrar hotkey para mostrar/ocultar
  globalShortcut.register('Ctrl+Alt+Space', () => {
    if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
        } else {
      mainWindow.center();
        mainWindow.show();
      mainWindow.focus();
        // Enfocar el input de búsqueda
        if (mainWindow.webContents) {
      mainWindow.webContents.send('focus-search');
    }
        }
      }
    });

  // Registrar hotkey para minimizar (Windows+C)
  // En Windows, la tecla Windows se captura como "Super" o con el código de tecla
  if (process.platform === 'win32') {
    // Para Windows, intentar múltiples combinaciones
    try {
      // Intentar con Super+C (tecla Windows + C)
      const registered = globalShortcut.register('Super+C', () => {
        if (mainWindow && mainWindow.isVisible()) {
          mainWindow.minimize();
  }
      });
      if (registered) {
        console.log('✓ Hotkey Win+C registrado');
  }
    } catch (err) {
      console.log('No se pudo registrar Super+C directamente');
      // Alternativa: Ctrl+Win+C
      try {
        globalShortcut.register('CommandOrControl+Super+C', () => {
          if (mainWindow && mainWindow.isVisible()) {
            mainWindow.minimize();
          }
        });
        console.log('✓ Hotkey Ctrl+Win+C registrado como alternativa');
      } catch (err2) {
        console.log('No se pudo registrar hotkey de minimizar');
      }
    }
      } else {
    // Para Linux/Mac, usar Super+C
    globalShortcut.register('Super+C', () => {
      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.minimize();
    }
  });
}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

