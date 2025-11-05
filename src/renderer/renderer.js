// Función para aplicar tema directamente
function applyThemeDirect(theme) {
  const root = document.documentElement;
  
  // Determinar tema real
  let actualTheme = theme;
  if (theme === 'auto') {
    // Detectar tema del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      actualTheme = 'dark';
    } else {
      actualTheme = 'light';
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

// Cargar tema al inicio
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const config = await window.api.getConfig();
    const theme = config?.ui?.theme || 'dark';
    applyThemeDirect(theme);
    
    // Escuchar cambios del sistema si es auto
    if (theme === 'auto' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        applyThemeDirect('auto');
      });
    }
  } catch (e) {
    console.error('Error cargando tema:', e);
  }
});

const searchInput = document.getElementById('search');
const resultsEl = document.getElementById('results');

let apps = [];
let filtered = [];
let activeIndex = 0;
let searchTimeout = null;
let isRendering = false;
let renderScheduled = false;

function simpleScore(query, text) {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  
  // Coincidencia exacta
  if (t === q) return 1000;
  
  // Empieza con la query (máxima prioridad)
  if (t.startsWith(q)) return 900;
  
  // Contiene la query al inicio del texto
  const index = t.indexOf(q);
  if (index === 0 || (index > 0 && t[index - 1] === ' ')) return 850;
  
  // Búsqueda mejorada por inicio de palabras individuales
  // Ejemplo: "Docke" encuentra "Docker Desktop" porque "Docker" empieza con "Docke"
  const words = t.split(/\s+/).filter(w => w.length > 0);
  
  // Priorizar si alguna palabra empieza con la query completa
  for (const word of words) {
    if (word.startsWith(q)) return 800;
  }
  
  // Priorizar si alguna palabra empieza con las primeras letras de la query
  // Ejemplo: "Docke" coincide con "Docker" (primeras 5 letras)
  for (const word of words) {
    if (word.length >= q.length && word.substring(0, q.length) === q) {
      return 750;
    }
  }
  
  // Búsqueda por acrónimos (primeras letras de cada palabra)
  // Ejemplo: "VSC" encuentra "Visual Studio Code"
  let queryIndex = 0;
  for (const word of words) {
    if (queryIndex < q.length && word.length > 0 && word[0] === q[queryIndex]) {
      queryIndex++;
      if (queryIndex === q.length) {
        return 700; // Todas las letras coincidieron con primeras letras de palabras
      }
    }
  }
  
  // Contiene la query en cualquier parte
  if (t.includes(q)) return 500;
  
  // Búsqueda por partes de la query dentro de palabras
  // Ejemplo: "Dock" encuentra "Docker" aunque no sea el inicio exacto
  for (const word of words) {
    if (word.includes(q)) {
      // Puntuación más alta si está cerca del inicio de la palabra
      const wordIndex = word.indexOf(q);
      return 400 + (50 - wordIndex * 10); // Más puntos si está más cerca del inicio
    }
  }
  
  // Búsqueda por letras consecutivas en palabras (fuzzy matching básico)
  // Ejemplo: "Docke" encuentra "Docker" aunque falte una letra
  for (const word of words) {
    let queryPos = 0;
    for (let i = 0; i < word.length && queryPos < q.length; i++) {
      if (word[i] === q[queryPos]) {
        queryPos++;
        if (queryPos === q.length) {
          // Todas las letras de la query están en orden en la palabra
          return 300 + (50 - (i - q.length + 1) * 5); // Penalizar distancia
        }
      }
    }
  }
  
  // Búsqueda básica por partes
  const parts = q.split(/\s+/).filter(p => p.length > 0);
  let sum = 0;
  for (const p of parts) {
    if (t.includes(p)) sum += 100;
    // Bonus si alguna palabra empieza con la parte
    for (const word of words) {
      if (word.startsWith(p)) {
        sum += 150;
        break;
      }
    }
  }
  return sum;
}

function filterApps(query) {
  if (!query) return apps.slice(0, 50);
  const withScore = apps.map((a) => ({
    ...a,
    score: Math.max(simpleScore(query, a.name), simpleScore(query, a.path))
  }));
  return withScore
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 50);
}

// Cache de iconos
const iconCache = new Map();

// Función para obtener nombre corto
function getShortName(item) {
  // Si el path es muy largo, mostrar solo el nombre del archivo o directorio
  if (item.path.length > 60) {
    const pathParts = item.path.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    // Remover extensión si existe
    return fileName.replace(/\.(lnk|exe|appref-ms)$/i, '');
  }
  // Si el nombre ya es descriptivo, usarlo
  if (item.name && item.name.length < 50) {
    return item.name;
  }
  // Acortar el path mostrando solo las últimas partes
  const parts = item.path.split(/[/\\]/);
  if (parts.length > 3) {
    return '...' + parts.slice(-3).join('\\');
  }
  return item.path;
}

// Función para obtener icono
async function getIcon(item) {
  const cacheKey = `${item.path}-${item.type}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  try {
    const iconDataUrl = await window.api.getAppIcon(item.path, item.type);
    if (iconDataUrl) {
      iconCache.set(cacheKey, iconDataUrl);
      return iconDataUrl;
    }
  } catch (error) {
    console.error('Error obteniendo icono:', error);
  }
  
  // Icono por defecto
  return null;
}

function render() {
  if (isRendering) {
    renderScheduled = true;
    return;
  }
  
  isRendering = true;
  
  // Usar requestAnimationFrame para renderizado suave
  requestAnimationFrame(() => {
    try {
      // Usar DocumentFragment para actualizaciones más rápidas (sin reflow/repaint múltiples)
      const fragment = document.createDocumentFragment();
      
      filtered.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'item' + (idx === activeIndex ? ' active' : '');
        li.tabIndex = 0;
        
        const shortName = getShortName(item);
        
        // Renderizar primero sin icono (placeholder)
        li.innerHTML = `
          <div class="app-icon-placeholder">📱</div>
          <div class="item-content">
            <div class="name">${shortName}</div>
            ${item.path.length > 60 ? `<div class="path">${item.path.substring(0, 60)}...</div>` : ''}
          </div>
        `;
        
        // Cargar icono de forma asíncrona
        getIcon(item).then(icon => {
          if (icon && li.parentNode) {
            const iconElement = li.querySelector('.app-icon-placeholder');
            if (iconElement) {
              iconElement.outerHTML = `<img src="${icon}" class="app-icon" alt="" />`;
            }
          }
        });
        
        li.addEventListener('click', () => launch(item));
        
        // Menú contextual (clic derecho)
        li.addEventListener('contextmenu', async (e) => {
          e.preventDefault();
          const isFavorite = await window.api.getFavorites().then(favs => favs.includes(item.id));
          if (confirm(isFavorite ? 
            `¿Eliminar "${item.name}" de favoritos?` : 
            `¿Agregar "${item.name}" a favoritos?`)) {
            if (isFavorite) {
              await window.api.removeFavorite(item.id);
            } else {
              await window.api.addFavorite(item.id);
            }
          }
        });
        
        fragment.appendChild(li);
      });
      
      // Actualizar DOM de una sola vez (más eficiente)
      resultsEl.innerHTML = '';
      resultsEl.appendChild(fragment);
    } finally {
      isRendering = false;
      if (renderScheduled) {
        renderScheduled = false;
        render();
      }
    }
  });
}

function moveActive(delta) {
  if (filtered.length === 0) return;
  const prevIndex = activeIndex;
  activeIndex = (activeIndex + delta + filtered.length) % filtered.length;
  
  // Optimización: solo actualizar clases active sin re-renderizar todo
  const items = resultsEl.querySelectorAll('.item');
  if (items[prevIndex]) {
    items[prevIndex].classList.remove('active');
  }
  if (items[activeIndex]) {
    items[activeIndex].classList.add('active');
    // Scroll suave al elemento activo
    items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    // Si no hay elementos renderizados, renderizar
    render();
  }
}

function launch(item) {
  // Guardar en historial de búsqueda si hay query
  const query = searchInput.value.trim();
  if (query && query.length >= 2) {
    // Guardar búsqueda (se guardará desde main.js)
    window.api.setConfig('search', 'lastQuery', query); // Temporal
  }
  window.api.launch(item.path, item.type || 'shortcut');
  // Ocultar la ventana en lugar de cerrarla
  window.api.hideWindow();
  // Limpiar el input
  searchInput.value = '';
}

// Debouncing para búsqueda más suave
searchInput.addEventListener('input', (e) => {
  activeIndex = 0;
  const query = e.target.value;
  
  // Limpiar timeout anterior
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Si la query está vacía, mostrar resultados inmediatamente
  if (!query.trim()) {
    filtered = apps.slice(0, 50);
    render();
    return;
  }
  
  // Debounce de 50ms para búsquedas más rápidas
  searchTimeout = setTimeout(() => {
    filtered = filterApps(query);
    render();
  }, 50);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Ocultar la ventana en lugar de cerrarla
    window.api.hideWindow();
    // Limpiar el input
    searchInput.value = '';
    filtered = apps.slice(0, 50);
    activeIndex = 0;
    render();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveActive(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveActive(-1);
  } else if (e.key === 'Enter') {
    if (filtered[activeIndex]) launch(filtered[activeIndex]);
  }
});

async function init() {
  // Inicializar tema primero
  if (window.themeManager && window.themeManager.initTheme) {
    await window.themeManager.initTheme();
  } else {
    // Fallback: aplicar tema directamente
    setTimeout(async () => {
      try {
        const config = await window.api.getConfig();
        const theme = config?.ui?.theme || 'dark';
        applyThemeDirect(theme);
      } catch (e) {
        console.error('Error aplicando tema:', e);
      }
    }, 100);
  }
  
  // Botón de configuración
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.api.openSettings();
    });
  }
  
  // Cargar configuración y aplicaciones iniciales
  const [config, list] = await Promise.all([window.api.getConfig(), window.api.getApps()]);
  apps = list || [];
  
  // Priorizar favoritos
  const favorites = await window.api.getFavorites();
  if (favorites.length > 0) {
    const favoriteApps = favorites.map(favId => apps.find(a => a.id === favId)).filter(Boolean);
    const otherApps = apps.filter(a => !favorites.includes(a.id));
    apps = [...favoriteApps, ...otherApps];
  }
  
  filtered = apps.length > 0 ? apps.slice(0, config?.ui?.maxResults || 50) : [];

  // Siempre renderizar, incluso si está vacío (sin mensajes)
  render();
  
  // Escuchar actualizaciones de aplicaciones
  window.api.onAppsUpdated((count) => {
    console.log('Aplicaciones actualizadas:', count);
    window.api.getApps().then((updatedList) => {
      if (updatedList && updatedList.length > 0) {
        apps = updatedList;
        const currentQuery = searchInput.value;
        if (currentQuery) {
          filtered = filterApps(currentQuery);
        } else {
          filtered = apps.slice(0, 50);
        }
        render();
      }
    });
  });
  
  window.api.onFocusSearch(() => {
    setTimeout(() => searchInput.focus(), 30);
  });
  
  // Escuchar cambios de tema
  window.api.onThemeChanged?.((theme) => {
    applyThemeDirect(theme);
  });
  
  // Recargar índice después de un breve delay para asegurar que el escaneo haya comenzado
  setTimeout(() => {
    window.api.reloadIndex().then((list) => {
      if (list && list.length > 0) {
        apps = list;
        const currentQuery = searchInput.value;
        if (currentQuery) {
          filtered = filterApps(currentQuery);
        } else {
          filtered = apps.slice(0, 50);
        }
        render();
      }
    });
  }, 2000);
}

init();


