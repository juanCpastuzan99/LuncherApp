/**
 * Sistema de temas dinámico
 * Aplica tema claro, oscuro o automático según la configuración
 */

// Detectar tema del sistema
function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

// Aplicar tema
function applyTheme(theme) {
  const root = document.documentElement;
  
  // Determinar tema real
  let actualTheme = theme;
  if (theme === 'auto') {
    actualTheme = getSystemTheme();
    // Escuchar cambios en el tema del sistema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        applyTheme(theme); // Re-aplicar con el nuevo tema del sistema
      });
    }
  }
  
  // Remover clases anteriores
  root.classList.remove('theme-dark', 'theme-light');
  
  // Aplicar nueva clase
  root.classList.add(`theme-${actualTheme}`);
  root.setAttribute('data-theme', actualTheme);
  
  // Actualizar color-scheme
  root.style.colorScheme = actualTheme;
  
  console.log(`🎨 Tema aplicado: ${theme} (${actualTheme})`);
}

// Aplicar tema al cargar
async function initTheme() {
  try {
    const config = await window.api.getConfig();
    const theme = config?.ui?.theme || 'dark';
    applyTheme(theme);
    
    // Escuchar cambios en el tema
    window.api.onThemeChange?.(applyTheme);
  } catch (error) {
    console.error('Error cargando tema:', error);
    applyTheme('dark'); // Fallback
  }
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyTheme, getSystemTheme, initTheme };
} else {
  window.themeManager = { applyTheme, getSystemTheme, initTheme };
}

