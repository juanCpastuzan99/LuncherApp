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
import { ConvertResult } from './ConvertResult';
import { SmartSuggestions } from './SmartSuggestions';
import { PomodoroTimerComponent } from './PomodoroTimer';
import { parseCommand, evaluateMath, formatCalcResult } from '../../ai/commandParser';
import { convertUnits } from '../../ai/unitConverter';
import { getPomodoroTimer } from '../../ai/pomodoro';
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
  const [convertResult, setConvertResult] = useState<{ value: number; from: string; to: string; result: number } | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroStatus, setPomodoroStatus] = useState<{ state: string } | null>(null);
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
    
    // Limpiar resultados anteriores
    setCalcResult(null);
    setConvertResult(null);
    
    // Si la query está vacía, actualizar inmediatamente
    if (!searchQuery.trim()) {
      filterApps('');
      return;
    }
    
    // Detectar comandos inmediatamente (sin debounce)
    const trimmedQuery = searchQuery.trim();
    
    // Prioridad 1: Si empieza con número o función matemática, activar modo calculadora
    const startsWithNumberOrMath = /^[\d+\-*/().%\s]|^(sin|cos|tan|ln|log|sqrt|exp|pow)\s*\(/i.test(trimmedQuery);
    
    if (startsWithNumberOrMath) {
      // Intentar evaluar directamente como expresión matemática
      const result = evaluateMath(trimmedQuery);
      if (result !== null) {
        setCalcResult({
          query: trimmedQuery,
          result: formatCalcResult(result)
        });
        return;
      }
    }
    
    // Si no funcionó, usar el parser de comandos
    const command = parseCommand(trimmedQuery);
    
    // Comando de cálculo
    if (command.type === 'calculate' && command.query) {
      const result = evaluateMath(command.query);
      if (result !== null) {
        setCalcResult({
          query: command.query,
          result: formatCalcResult(result)
        });
        return;
      }
    }
    
    // Comando de conversión
    if (command.type === 'convert' && command.value && command.from && command.to) {
      const conversion = convertUnits(command.value, command.from, command.to);
      if (conversion) {
        setConvertResult({
          value: command.value,
          from: command.from,
          to: command.to,
          result: conversion.result
        });
        return;
      }
    }
    
    // Comando educativo (Wikipedia) - solo detectar, no mostrar resultado aún
    if (command.type === 'educational' && command.action === 'wikipedia') {
      // Se manejará en handleLaunch
      return;
    }
    
    // Comando Pomodoro - mostrar temporizador y ejecutar acción si es start
    if (command.type === 'pomodoro') {
      getPomodoroTimer().then((timer) => {
        const pomodoroStatus = timer.getStatus();
        
        // Si es comando start y está idle, iniciar automáticamente
        if (command.action === 'start' && pomodoroStatus.state === 'idle') {
          timer.start();
          setShowPomodoro(true);
          return;
        }
        
        // Mostrar temporizador si está activo o si se está escribiendo el comando
        setShowPomodoro(true);
      });
      return;
    }
    
    // Si no es comando Pomodoro, ocultar el temporizador solo si no está activo
    getPomodoroTimer().then((timer) => {
      const pomodoroStatus = timer.getStatus();
      if (pomodoroStatus.state === 'idle') {
        setShowPomodoro(false);
      }
    });
    
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
        const trimmedQuery = searchQuery.trim();
        
        // Detectar si es un comando antes de procesar
        const command = parseCommand(trimmedQuery);
        
        // Si es comando Pomodoro, ejecutar la acción
        if (command.type === 'pomodoro' && command.action) {
          getPomodoroTimer().then((timer) => {
          
            switch (command.action) {
              case 'start':
                timer.start();
                setShowPomodoro(true);
                break;
              case 'pause':
                timer.pause();
                break;
              case 'stop':
                timer.stop();
                setShowPomodoro(false);
                break;
              case 'reset':
                timer.reset();
                setShowPomodoro(false);
                break;
              case 'break':
                const status = timer.getStatus();
                if (status.currentPomodoro % 4 === 0) {
                  timer.startLongBreak();
                } else {
                  timer.startShortBreak();
                }
                setShowPomodoro(true);
                break;
            }
            
            window.api.hideWindow();
            setSearchQuery('');
          }).catch(() => {});
          return;
        }
        
        // Si hay resultado de conversión, copiarlo
        if (convertResult) {
          const text = `${convertResult.result} ${convertResult.to}`;
          navigator.clipboard.writeText(text).catch(() => {});
          window.api.hideWindow();
          setSearchQuery('');
          setConvertResult(null);
          return;
        }
        
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
        } else if (trimmedQuery) {
          // Si hay texto pero no hay apps, intentar ejecutar como comando
          handleLaunch(filteredApps[0] || apps[0]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredApps, activeIndex, moveActive, calcResult, convertResult, smartSuggestions]);
  
  const handleLaunch = async (app: typeof filteredApps[0]) => {
    const trimmedQuery = searchQuery.trim();
    
    // Detectar si es un comando
    const command = parseCommand(trimmedQuery);
    
    // Manejar comandos Pomodoro
    if (command.type === 'pomodoro' && command.action) {
      const timer = await getPomodoroTimer();
      
      switch (command.action) {
        case 'start':
          timer.start();
          setShowPomodoro(true);
          break;
        case 'pause':
          timer.pause();
          break;
        case 'stop':
          timer.stop();
          setShowPomodoro(false);
          break;
        case 'reset':
          timer.reset();
          setShowPomodoro(false);
          break;
        case 'break':
          const status = timer.getStatus();
          if (status.currentPomodoro % 4 === 0) {
            timer.startLongBreak();
          } else {
            timer.startShortBreak();
          }
          setShowPomodoro(true);
          break;
      }
      
      window.api.hideWindow();
      setSearchQuery('');
      return;
    }
    
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
    
    // Comando educativo (Wikipedia)
    if (command.type === 'educational' && command.action === 'wikipedia' && command.query) {
      // Buscar navegador y abrir Wikipedia
      const browser = apps.find(a => 
        a.name.toLowerCase().includes('chrome') || 
        a.name.toLowerCase().includes('firefox') ||
        a.name.toLowerCase().includes('edge') ||
        a.name.toLowerCase().includes('opera')
      );
      
      if (browser) {
        await window.api.launch(browser.path, browser.type);
        // Abrir Wikipedia en el navegador (requiere modificar launch handler)
        // Por ahora, el usuario puede navegar manualmente
        // URL sería: https://es.wikipedia.org/wiki/${encodeURIComponent(command.query)}
      }
      window.api.hideWindow();
      setSearchQuery('');
      setCalcResult(null);
      setConvertResult(null);
      return;
    }
    
    // Comando de conversión
    if (command.type === 'convert' && command.value && command.from && command.to) {
      const conversion = convertUnits(command.value, command.from, command.to);
      if (conversion) {
        // Resultado ya se muestra en el componente ConvertResult
        // Aquí solo copiamos al portapapeles si presiona Enter
        const text = `${conversion.result} ${command.to}`;
        navigator.clipboard.writeText(text).catch(() => {});
        window.api.hideWindow();
        setSearchQuery('');
        setCalcResult(null);
        setConvertResult(null);
        return;
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
      setConvertResult(null);
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
  
  // Verificar estado del Pomodoro periódicamente
  useEffect(() => {
    const checkPomodoro = async () => {
      try {
        const timer = await getPomodoroTimer();
        setPomodoroStatus(timer.getStatus());
      } catch (error) {
        console.error('Error verificando Pomodoro:', error);
      }
    };
    checkPomodoro();
    const interval = setInterval(checkPomodoro, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determinar si el Pomodoro está activo
  const isPomodoroActive = showPomodoro || (pomodoroStatus && pomodoroStatus.state !== 'idle');
  
  // Si hay búsqueda activa, priorizar resultados sobre Pomodoro
  const hasActiveSearch = searchQuery.trim().length > 0;
  
  // Mostrar sugerencias inteligentes cuando no hay query y no hay Pomodoro activo
  const showSmartSuggestions = !hasActiveSearch && !searchQuery.trim() && smartSuggestions.length > 0 && !isLoading;
  const showCalcResult = calcResult !== null;
  const showConvertResult = convertResult !== null;
  // Solo mostrar resultados si no está cargando y hay resultados
  const showResults = !showCalcResult && !showConvertResult && !isLoading && filteredApps.length > 0;
  
  return (
    <div className="overlay">
      <div className="panel">
        <SearchBar 
          ref={searchInputRef}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
        
        {/* Resultados de búsqueda primero si hay búsqueda activa */}
        {hasActiveSearch && showCalcResult && calcResult && (
          <CalcResult query={calcResult.query} result={calcResult.result} />
        )}
        {hasActiveSearch && showConvertResult && convertResult && (
          <ConvertResult 
            value={convertResult.value}
            from={convertResult.from}
            to={convertResult.to}
            result={convertResult.result}
          />
        )}
        {hasActiveSearch && showResults && !showSmartSuggestions && (
          <ResultsList 
            apps={filteredApps}
            activeIndex={activeIndex}
            isLoading={isLoading}
            onLaunch={handleLaunch}
          />
        )}
        {hasActiveSearch && !showCalcResult && !showConvertResult && !showResults && !showSmartSuggestions && !isLoading && (
          <div className="no-results">
            <p>No se encontraron resultados</p>
            <p className="hint">Prueba: "calcula 2+2", "convertir 100 km a millas", "wikipedia: Einstein", "pomodoro"</p>
          </div>
        )}
        
        {/* Pomodoro en segundo lugar - se muestra si está activo (debajo de resultados si hay búsqueda) */}
        {isPomodoroActive && (
          <PomodoroTimerComponent />
        )}
        
        {/* Sugerencias inteligentes solo cuando no hay búsqueda activa */}
        {!hasActiveSearch && showSmartSuggestions && (
          <SmartSuggestions
            suggestions={smartSuggestions}
            activeIndex={activeIndex}
            onSelect={handleLaunch}
          />
        )}
        
        {/* Mensaje cuando no hay búsqueda ni Pomodoro */}
        {!hasActiveSearch && !isPomodoroActive && !showSmartSuggestions && !isLoading && (
          <div className="no-results">
            <p>Escribe para buscar o escribe "pomodoro" para iniciar</p>
            <p className="hint">Prueba: "calcula 2+2", "convertir 100 km a millas", "wikipedia: Einstein", "pomodoro"</p>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

