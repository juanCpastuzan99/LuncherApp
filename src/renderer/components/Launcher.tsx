/**
 * Componente principal del Launcher
 * Implementado con React + TypeScript
 */

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { Footer } from './Footer';
import './Launcher.css';

export const Launcher: React.FC = () => {
  const { 
    apps, 
    filteredApps, 
    searchQuery, 
    activeIndex,
    isLoading,
    setApps,
    setSearchQuery,
    setLoading,
    filterApps,
    moveActive
  } = useAppStore();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Aplicar tema al montar y cuando cambie
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      let actualTheme = theme;
      
      if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          actualTheme = 'dark';
        } else {
          actualTheme = 'light';
        }
      }
      
      root.classList.remove('theme-dark', 'theme-light');
      root.classList.add(`theme-${actualTheme}`);
      root.setAttribute('data-theme', actualTheme);
      root.style.colorScheme = actualTheme;
    };
    
    // Cargar tema inicial
    window.api.getConfig().then(config => {
      const theme = config?.ui?.theme || 'dark';
      applyTheme(theme);
      
      // Escuchar cambios del sistema si es auto
      if (theme === 'auto' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('auto');
        mediaQuery.addEventListener('change', handler);
        
        // Cleanup
        return () => mediaQuery.removeEventListener('change', handler);
      }
    });
    
    // Escuchar cambios de tema desde settings
    const cleanup = window.api.onThemeChanged?.(applyTheme);
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  
  // Cargar aplicaciones al montar
  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);
        const [config, appsList] = await Promise.all([
          window.api.getConfig(),
          window.api.getApps()
        ]);
        
        useAppStore.getState().setConfig(config);
        setApps(appsList || []);
      } catch (error) {
        console.error('Error cargando aplicaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadApps();
    
    // Escuchar actualizaciones
    window.api.onAppsUpdated((count) => {
      console.log('Aplicaciones actualizadas:', count);
      window.api.getApps().then((updatedList) => {
        if (updatedList && updatedList.length > 0) {
          setApps(updatedList);
          if (searchQuery) {
            filterApps(searchQuery);
          }
        }
      });
    });
    
    // Focus en el input
    window.api.onFocusSearch(() => {
      setTimeout(() => searchInputRef.current?.focus(), 30);
    });
    
    // Recargar después de un delay
    setTimeout(() => {
      window.api.reloadIndex().then((list) => {
        if (list && list.length > 0) {
          setApps(list);
          if (searchQuery) {
            filterApps(searchQuery);
          }
        }
      });
    }, 2000);
  }, [setApps, setLoading, filterApps, searchQuery]);
  
  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Ocultar la ventana en lugar de cerrarla
        window.api.hideWindow();
        // Limpiar el input
        setSearchQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === 'Enter') {
        if (filteredApps[activeIndex]) {
          handleLaunch(filteredApps[activeIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredApps, activeIndex, moveActive]);
  
  const handleLaunch = async (app: typeof filteredApps[0]) => {
    // Guardar búsqueda si hay query
    if (searchQuery && searchQuery.trim().length >= 2) {
      window.api.setConfig('search', 'lastQuery', searchQuery.trim());
    }
    
    await window.api.launch(app.path, app.type);
    // Ocultar la ventana en lugar de cerrarla
    window.api.hideWindow();
    // Limpiar el input
    setSearchQuery('');
  };
  
  return (
    <div className="overlay">
      <div className="panel">
        <SearchBar 
          ref={searchInputRef}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
        <ResultsList 
          apps={filteredApps}
          activeIndex={activeIndex}
          isLoading={isLoading}
          onLaunch={handleLaunch}
        />
        <Footer />
      </div>
    </div>
  );
};

