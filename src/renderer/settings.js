// Sistema de tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Actualizar tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Actualizar paneles
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
  });
});

// Cerrar ventana
document.getElementById('close-btn').addEventListener('click', () => {
  window.close();
});

// Cargar configuración
async function loadConfig() {
  const config = await window.api.getConfig();
  
  // General
  const theme = config.ui?.theme || 'dark';
  document.getElementById('theme-select').value = theme;
  // Aplicar tema al cargar configuración
  applyThemeToWindow(theme);
  
  document.getElementById('window-width').value = config.ui?.windowWidth || 720;
  document.getElementById('window-height').value = config.ui?.windowHeight || 400;
  document.getElementById('max-results').value = config.ui?.maxResults || 10;
  document.getElementById('show-path').checked = config.ui?.showPath !== false;
  
  // Hotkeys
  const hotkeys = config.hotkeys || {};
  document.getElementById('hotkey-open').value = hotkeys.openLauncher || 'Ctrl+Space';
  document.getElementById('hotkey-tile').value = hotkeys.tileWindows || 'Ctrl+Alt+T';
  document.getElementById('hotkey-move-left').value = hotkeys.moveWindowLeft || 'Ctrl+Alt+H';
  document.getElementById('hotkey-move-right').value = hotkeys.moveWindowRight || 'Ctrl+Alt+L';
  document.getElementById('hotkey-center').value = hotkeys.centerWindow || 'Ctrl+Alt+C';
  document.getElementById('hotkey-maximize').value = hotkeys.maximizeWindow || 'Ctrl+Alt+M';
  document.getElementById('hotkey-minimize').value = hotkeys.minimizeWindow || 'Ctrl+Alt+N';
  
  // Scan
  document.getElementById('scan-uwp').checked = config.scan?.includeUWP !== false;
  document.getElementById('scan-registry').checked = config.scan?.includeRegistry !== false;
  document.getElementById('scan-local').checked = config.scan?.includeLocalApps !== false;
  document.getElementById('scan-startmenu').checked = config.scan?.includeStartMenu !== false;
  
  // Window Management
  document.getElementById('enable-tiling').checked = config.windowManagement?.enableTiling !== false;
  document.getElementById('enable-floating').checked = config.windowManagement?.enableFloating !== false;
  document.getElementById('window-gap').value = config.windowManagement?.gap || 10;
  document.getElementById('default-layout').value = config.windowManagement?.defaultLayout || 'grid';
  
  // Cargar favoritos e historial
  await loadFavorites();
  await loadHistory();
}

// Guardar cambios en tiempo real y aplicar tema
document.getElementById('theme-select').addEventListener('change', async (e) => {
  const theme = e.target.value;
  await window.api.setConfig('ui', 'theme', theme);
  
  // Aplicar tema inmediatamente
  applyThemeToWindow(theme);
  
  // Notificar a la ventana principal si está abierta
  try {
    // Enviar mensaje para actualizar tema en la ventana principal
    window.api.updateTheme?.(theme);
  } catch (e) {
    console.log('No se pudo actualizar tema en ventana principal:', e);
  }
});

// Función para aplicar tema
function applyThemeToWindow(theme) {
  const root = document.documentElement;
  
  // Determinar tema real
  let actualTheme = theme;
  if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      actualTheme = 'dark';
    } else {
      actualTheme = 'light';
    }
    
    // Escuchar cambios del sistema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        applyThemeToWindow('auto');
      };
      // Remover listener anterior si existe
      if (window._themeMediaQuery) {
        window._themeMediaQuery.removeEventListener('change', window._themeMediaQueryHandler);
      }
      window._themeMediaQuery = mediaQuery;
      window._themeMediaQueryHandler = handler;
      mediaQuery.addEventListener('change', handler);
    }
  }
  
  // Remover clases anteriores
  root.classList.remove('theme-dark', 'theme-light');
  
  // Aplicar nueva clase
  root.classList.add(`theme-${actualTheme}`);
  root.setAttribute('data-theme', actualTheme);
  root.style.colorScheme = actualTheme;
  
  console.log(`🎨 Tema aplicado: ${theme} (${actualTheme})`);
}

document.getElementById('window-width').addEventListener('change', (e) => {
  window.api.setConfig('ui', 'windowWidth', parseInt(e.target.value));
});

document.getElementById('window-height').addEventListener('change', (e) => {
  window.api.setConfig('ui', 'windowHeight', parseInt(e.target.value));
});

document.getElementById('max-results').addEventListener('change', (e) => {
  window.api.setConfig('ui', 'maxResults', parseInt(e.target.value));
});

document.getElementById('show-path').addEventListener('change', (e) => {
  window.api.setConfig('ui', 'showPath', e.target.checked);
});

// Scan config
document.getElementById('scan-uwp').addEventListener('change', (e) => {
  window.api.setConfig('scan', 'includeUWP', e.target.checked);
});

document.getElementById('scan-registry').addEventListener('change', (e) => {
  window.api.setConfig('scan', 'includeRegistry', e.target.checked);
});

document.getElementById('scan-local').addEventListener('change', (e) => {
  window.api.setConfig('scan', 'includeLocalApps', e.target.checked);
});

document.getElementById('scan-startmenu').addEventListener('change', (e) => {
  window.api.setConfig('scan', 'includeStartMenu', e.target.checked);
});

// Window Management
document.getElementById('enable-tiling').addEventListener('change', (e) => {
  window.api.setConfig('windowManagement', 'enableTiling', e.target.checked);
});

document.getElementById('enable-floating').addEventListener('change', (e) => {
  window.api.setConfig('windowManagement', 'enableFloating', e.target.checked);
});

document.getElementById('window-gap').addEventListener('change', (e) => {
  window.api.setConfig('windowManagement', 'gap', parseInt(e.target.value));
});

document.getElementById('default-layout').addEventListener('change', (e) => {
  window.api.setConfig('windowManagement', 'defaultLayout', e.target.value);
});

// Hotkeys (placeholder - se implementaría captura de teclas)
document.querySelectorAll('.hotkey-input').forEach(input => {
  input.addEventListener('click', () => {
    input.value = 'Presiona tecla...';
    // Aquí se implementaría la captura de teclas
    setTimeout(() => {
      loadConfig(); // Recargar para volver al valor original
    }, 2000);
  });
});

// Favoritos
async function loadFavorites() {
  const favorites = await window.api.getFavorites();
  const list = document.getElementById('favorites-list');
  
  if (favorites.length === 0) {
    list.innerHTML = '<p class="empty-message">No hay favoritos aún. Haz clic derecho en una aplicación para agregarla.</p>';
    return;
  }
  
  // Obtener información de las apps
  const apps = await window.api.getApps();
  const favoriteApps = favorites.map(favId => {
    return apps.find(app => app.id === favId);
  }).filter(Boolean);
  
  list.innerHTML = favoriteApps.map(app => `
    <div class="favorite-item">
      <div>
        <div class="name">${app.name}</div>
        <div class="path" style="font-size: 12px; color: var(--muted);">${app.path}</div>
      </div>
      <button class="btn-secondary" onclick="removeFavorite('${app.id}')">Eliminar</button>
    </div>
  `).join('');
}

window.removeFavorite = async (appId) => {
  await window.api.removeFavorite(appId);
  await loadFavorites();
};

// Historial
async function loadHistory() {
  const searchHistory = await window.api.getSearchHistory();
  const launchHistory = await window.api.getLaunchHistory();
  
  // Búsquedas
  const searchList = document.getElementById('search-history-list');
  if (searchHistory.length === 0) {
    searchList.innerHTML = '<p class="empty-message">No hay búsquedas recientes</p>';
  } else {
    searchList.innerHTML = searchHistory.map(query => `
      <div class="history-item">
        <span>${query}</span>
      </div>
    `).join('');
  }
  
  // Lanzamientos
  const launchList = document.getElementById('launch-history-list');
  if (launchHistory.length === 0) {
    launchList.innerHTML = '<p class="empty-message">No hay aplicaciones lanzadas recientemente</p>';
  } else {
    launchList.innerHTML = launchHistory.map(item => {
      const date = new Date(item.timestamp);
      return `
        <div class="history-item">
          <div>
            <div class="name">${item.name}</div>
            <div class="path" style="font-size: 12px; color: var(--muted);">${date.toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Limpiar historiales
document.getElementById('clear-search-history').addEventListener('click', async () => {
  if (confirm('¿Estás seguro de limpiar el historial de búsquedas?')) {
    await window.api.clearSearchHistory();
    await loadHistory();
  }
});

document.getElementById('clear-launch-history').addEventListener('click', async () => {
  if (confirm('¿Estás seguro de limpiar el historial de lanzamientos?')) {
    await window.api.clearLaunchHistory();
    await loadHistory();
  }
});

// Exportar/Importar/Reset
document.getElementById('export-config').addEventListener('click', async () => {
  const config = await window.api.exportConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'win11-launcher-config.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-config').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      try {
        const config = JSON.parse(text);
        if (await window.api.importConfig(config)) {
          alert('Configuración importada correctamente');
          await loadConfig();
        } else {
          alert('Error al importar la configuración');
        }
      } catch (err) {
        alert('Error: Archivo JSON inválido');
      }
    }
  };
  input.click();
});

document.getElementById('reset-config').addEventListener('click', async () => {
  if (confirm('¿Estás seguro de resetear toda la configuración? Esta acción no se puede deshacer.')) {
    await window.api.resetConfig();
    alert('Configuración reseteada');
    await loadConfig();
  }
});

// Inicializar
loadConfig();

