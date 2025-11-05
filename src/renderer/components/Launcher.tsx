/**
 * Componente principal del Launcher
 * Implementado con React + TypeScript
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { Footer } from './Footer';
import { CalcResult } from './CalcResult';
import { SmartSuggestions } from './SmartSuggestions';
import { parseCommand, evaluateMath, formatCalcResult } from '../../ai/commandParser';
import './Launcher.css';

export const Launcher: React.FC = () => {
  const { 
    apps, 
    filteredApps, 
    searchQuery, 
    activeIndex,
    isLoading,
    smartSuggestions,
    setApps,
    setSearchQuery,
    setLoading,
    setLaunchHistory,
    filterApps,
    moveActive
  } = useAppStore();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [calcResult, setCalcResult] = useState<{ query: string; result: string } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if ('onThemeChanged' in window.api && typeof window.api.onThemeChanged === 'function') {
      window.api.onThemeChanged(applyTheme);
    }
  }, []);
  
  // Cargar aplicaciones y historial al montar
  useEffect(() => {
    const loadApps = async () => {
      let appsList: any[] | null = null;
      try {
        setLoading(true); // Ocultar todo durante la carga inicial
        const [config, apps, launchHistory] = await Promise.all([
          window.api.getConfig(),
          window.api.getApps(),
          window.api.getLaunchHistory().catch(() => [])
        ]);
        
        appsList = apps || [];
        
        useAppStore.getState().setConfig(config);
        setLaunchHistory(launchHistory || []);
        // Establecer apps pero no filtrar aún (isLoading previene el filtrado)
        setApps(appsList);
      } catch (error) {
        console.error('Error cargando aplicaciones:', error);
      } finally {
        // Mostrar resultados solo cuando termine la carga
        setLoading(false);
        // Ahora sí filtrar las apps después de que termine el loading
        if (appsList && appsList.length > 0) {
          filterApps(searchQuery);
        }
      }
    };
    
    loadApps();
    
    // Escuchar actualizaciones - pero no mostrar hasta que termine el escaneo
    window.api.onAppsUpdated((count) => {
      console.log('Aplicaciones actualizadas:', count);
      // No actualizar inmediatamente, esperar a que termine el escaneo
      // El escaneo se manejará en el reloadIndex
    });
    
    // Focus en el input
    window.api.onFocusSearch(() => {
      setTimeout(() => searchInputRef.current?.focus(), 30);
    });
    
    // Recargar después de un delay - pero solo mostrar cuando termine
    setTimeout(() => {
      setLoading(true); // Ocultar resultados durante el escaneo
      // Limpiar resultados mientras escanea directamente en el store
      const store = useAppStore.getState();
      store.setFilteredApps([]);
      // Limpiar smartSuggestions también
      useAppStore.setState({ smartSuggestions: [] });
      
      window.api.reloadIndex().then((list) => {
        if (list && list.length > 0) {
          // Establecer apps pero no filtrar aún (isLoading previene el filtrado)
          setApps(list);
        }
        // Mostrar resultados solo cuando termine
        setLoading(false);
        // Ahora sí filtrar las apps después de que termine el loading
        if (list && list.length > 0) {
          if (searchQuery.trim()) {
            filterApps(searchQuery);
          } else {
            filterApps('');
          }
        }
      }).catch(() => {
        setLoading(false); // Asegurar que se muestre incluso si hay error
      });
    }, 2000);
  }, [setApps, setLoading, filterApps, searchQuery]);
  
  // Debouncing para búsqueda - evita parpadeo
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Si la query está vacía, actualizar inmediatamente
    if (!searchQuery.trim()) {
      filterApps('');
      setCalcResult(null);
      return;
    }
    
    // Detectar comandos de cálculo inmediatamente (sin debounce)
    const trimmedQuery = searchQuery.trim();
    const command = parseCommand(trimmedQuery);
    if (command.type === 'calculate' && command.query) {
      const result = evaluateMath(command.query);
      if (result !== null) {
        setCalcResult({
          query: command.query,
          result: formatCalcResult(result)
        });
        // No hacer búsqueda para cálculos
        return;
      }
    } else {
      setCalcResult(null);
    }
    
    // Debounce para búsqueda normal (50ms para respuesta rápida pero sin parpadeo)
    searchTimeoutRef.current = setTimeout(() => {
      filterApps(trimmedQuery);
    }, 50);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filterApps]);
  
  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Ocultar la ventana en lugar de cerrarla
        window.api.hideWindow();
        // Limpiar el input
        setSearchQuery('');
        setCalcResult(null);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === 'Enter') {
        // Si hay resultado de cálculo, copiarlo
        if (calcResult) {
          navigator.clipboard.writeText(calcResult.result).catch(() => {});
          window.api.hideWindow();
          setSearchQuery('');
          setCalcResult(null);
          return;
        }
        
        // Determinar qué lista usar según el contexto
        const showSmartSuggestions = !searchQuery.trim() && smartSuggestions.length > 0;
        
        if (showSmartSuggestions && smartSuggestions[activeIndex]) {
          // Si hay sugerencias inteligentes, usar esa
          handleLaunch(smartSuggestions[activeIndex].app);
        } else if (filteredApps[activeIndex]) {
          // Si hay apps filtradas, lanzar la seleccionada
          handleLaunch(filteredApps[activeIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredApps, activeIndex, moveActive, calcResult, smartSuggestions]);
  
  const handleLaunch = async (app: typeof filteredApps[0]) => {
    const trimmedQuery = searchQuery.trim();
    
    // Detectar si es un comando
    const command = parseCommand(trimmedQuery);
    
    // Comando de cálculo
    if (command.type === 'calculate' && command.query) {
      const result = evaluateMath(command.query);
      if (result !== null) {
        // Copiar resultado al portapapeles
        navigator.clipboard.writeText(formatCalcResult(result)).catch(() => {});
      }
      window.api.hideWindow();
      setSearchQuery('');
      setCalcResult(null);
      return;
    }
    
    // Comando de gestión de ventanas
    if (command.type === 'window_management' && command.action) {
      try {
        switch (command.action) {
          case 'tile':
            await window.api.tileWindows('grid');
            break;
          case 'maximize':
            await window.api.maximizeWindow();
            break;
          case 'minimize':
            await window.api.minimizeWindow();
            break;
          case 'center':
            await window.api.centerWindow();
            break;
          case 'move_left':
            await window.api.moveWindowSide('left');
            break;
          case 'move_right':
            await window.api.moveWindowSide('right');
            break;
          case 'workspace_next':
            await window.api.switchWorkspace('next');
            break;
          case 'workspace_previous':
            await window.api.switchWorkspace('previous');
            break;
        }
        window.api.hideWindow();
        setSearchQuery('');
        setCalcResult(null);
        return;
      } catch (error) {
        console.error('Error ejecutando comando:', error);
      }
    }
    
    // Comando de búsqueda web
    if (command.type === 'search' && command.query) {
      // Buscar navegador en las apps
      const browser = apps.find(a => 
        a.name.toLowerCase().includes('chrome') || 
        a.name.toLowerCase().includes('firefox') ||
        a.name.toLowerCase().includes('edge') ||
        a.name.toLowerCase().includes('opera')
      );
      
      if (browser) {
        await window.api.launch(browser.path, browser.type);
        // Nota: Para abrir con query de búsqueda, necesitarías modificar el handler de launch
        // Por ahora solo abre el navegador
      }
      window.api.hideWindow();
      setSearchQuery('');
      setCalcResult(null);
      return;
    }
    
    // Comando de lanzamiento (si hay target, buscar la app)
    if (command.type === 'launch' && command.target) {
      // Ya debería estar en filteredApps, pero por si acaso
      const targetApp = apps.find(a => 
        a.name.toLowerCase().includes(command.target!.toLowerCase()) ||
        a.path.toLowerCase().includes(command.target!.toLowerCase())
      );
      
      if (targetApp) {
        await window.api.launch(targetApp.path, targetApp.type);
        window.api.hideWindow();
        setSearchQuery('');
        setCalcResult(null);
        return;
      }
    }
    
    // Comportamiento normal de lanzamiento
    if (trimmedQuery && trimmedQuery.length >= 2) {
      window.api.setConfig('search', 'lastQuery', trimmedQuery);
    }
    
    await window.api.launch(app.path, app.type);
    
    // Actualizar historial después de lanzar
    const updatedHistory = await window.api.getLaunchHistory().catch(() => []);
    setLaunchHistory(updatedHistory);
    
    // Ocultar la ventana en lugar de cerrarla
    window.api.hideWindow();
    // Limpiar el input
    setSearchQuery('');
    setCalcResult(null);
  };
  
  // Mostrar sugerencias inteligentes cuando no hay query
  const showSmartSuggestions = !searchQuery.trim() && smartSuggestions.length > 0 && !isLoading;
  const showCalcResult = calcResult !== null;
  // Solo mostrar resultados si no está cargando
  const showResults = !showCalcResult && !isLoading && filteredApps.length > 0;
  
  return (
    <div className="overlay">
      <div className="panel">
        <SearchBar 
          ref={searchInputRef}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
        {showCalcResult && calcResult && (
          <CalcResult query={calcResult.query} result={calcResult.result} />
        )}
        {showResults && !showSmartSuggestions && (
          <ResultsList 
            apps={filteredApps}
            activeIndex={activeIndex}
            isLoading={isLoading}
            onLaunch={handleLaunch}
          />
        )}
        {showSmartSuggestions && (
          <SmartSuggestions
            suggestions={smartSuggestions}
            activeIndex={activeIndex}
            onSelect={handleLaunch}
          />
        )}
        {!showCalcResult && !showResults && !showSmartSuggestions && !isLoading && (
          <div className="no-results">
            <p>No se encontraron resultados</p>
            <p className="hint">Prueba escribiendo el nombre de una aplicación o usa comandos como "calcula 2+2"</p>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

