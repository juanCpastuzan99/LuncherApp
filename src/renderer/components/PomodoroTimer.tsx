/**
 * Componente Pomodoro estilo minimalista para lanzador de apps
 * Diseño compacto y elegante
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PomodoroTimer, getPomodoroTimer, getPomodoroConfig, savePomodoroConfig, type PomodoroStatus } from '../../ai/pomodoro';
import './PomodoroTimer.css';

interface AlertState {
  show: boolean;
  message: string;
  type: 'work' | 'break';
}

export const PomodoroTimerComponent: React.FC = () => {
  const [status, setStatus] = useState<PomodoroStatus>({
    state: 'idle',
    timeRemaining: 0,
    currentPomodoro: 0,
    totalPomodoros: 0,
    phase: 'work'
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: '',
    type: 'work'
  });
  
  const timerRef = useRef<PomodoroTimer | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);

  const updateStatus = useCallback(() => {
    if (timerRef.current) {
      const currentStatus = timerRef.current.getStatus();
      setStatus(currentStatus);
      lastUpdateRef.current = Date.now();
    }
  }, []);

  const syncAfterBackground = useCallback(async () => {
    if (!timerRef.current) return;

    const now = Date.now();
    const timeSinceLastUpdate = Math.floor((now - lastUpdateRef.current) / 1000);

    if (timeSinceLastUpdate > 2) {
      const timer = await getPomodoroTimer();
      const currentStatus = timer.getStatus();
      setStatus(currentStatus);
      
      if (status.state !== 'idle' && currentStatus.state !== status.state) {
        const wasWorking = status.state === 'working';
        showAlert(wasWorking ? 'work' : 'break');
      }
    }
    
    updateStatus();
  }, [status.state, updateStatus]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        syncAfterBackground();
      }
    };

    const handleFocus = () => {
      syncAfterBackground();
    };

    const handleBlur = () => {
      lastUpdateRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [syncAfterBackground]);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getPomodoroConfig();
        setWorkMinutes(Math.floor(config.workDuration / 60));
        setBreakMinutes(Math.floor(config.shortBreakDuration / 60));
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    let mounted = true;

    const initTimer = async () => {
      const timer = await getPomodoroTimer();
      if (!mounted) return;

      timerRef.current = timer;

      timer.setOnUpdate((newStatus) => {
        if (mounted) {
          setStatus(newStatus);
          setIsPaused(false);
          lastUpdateRef.current = Date.now();
        }
      });

      timer.setOnComplete((phase) => {
        if (mounted) {
          const isWorkComplete = phase === 'work';
          showAlert(isWorkComplete ? 'work' : 'break');
          
          if ('Notification' in window && Notification.permission === 'granted') {
            const message = isWorkComplete
              ? '¡Pomodoro completado! Toma un descanso.'
              : '¡Descanso terminado! Listo para trabajar.';
            new Notification('Pomodoro', {
              body: message,
              icon: '/favicon.ico',
              requireInteraction: true
            });
          }
        }
      });

      const initialStatus = timer.getStatus();
      if (mounted) {
        setStatus(initialStatus);
        lastUpdateRef.current = Date.now();
      }

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      updateIntervalRef.current = setInterval(() => {
        if (mounted && timerRef.current && isVisibleRef.current) {
          updateStatus();
        }
      }, 500);
    };

    initTimer();

    return () => {
      mounted = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [updateStatus]);

  const showAlert = (type: 'work' | 'break') => {
    const isWorkComplete = type === 'work';
    const message = isWorkComplete
      ? '¡Pomodoro completado!\nToma un descanso'
      : '¡Descanso terminado!\nListo para trabajar';
    
    setAlert({
      show: true,
      message,
      type
    });

    playNotificationSound();

    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 8000);
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      [800, 1000].forEach((freq, i) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 150);
      });
    } catch (error) {
      console.log('Audio no disponible');
    }
  };

  const handleStart = async () => {
    const timer = await getPomodoroTimer();
    if (status.state === 'idle') {
      timer.start();
      setShowConfig(false);
      updateStatus();
    } else if (isPaused) {
      timer.resume();
      setIsPaused(false);
      updateStatus();
    }
  };

  const handleSaveConfig = async () => {
    if (workMinutes < 1 || workMinutes > 60) {
      window.alert('El tiempo de trabajo debe estar entre 1 y 60 minutos');
      return;
    }
    if (breakMinutes < 1 || breakMinutes > 30) {
      window.alert('El tiempo de descanso debe estar entre 1 y 30 minutos');
      return;
    }

    await savePomodoroConfig({
      workDuration: workMinutes,
      shortBreakDuration: breakMinutes,
      longBreakDuration: breakMinutes * 3, // Descanso largo = 3x descanso corto
      pomodorosUntilLongBreak: 4
    });

    // Recargar la instancia del timer para aplicar la nueva configuración
    // Necesitamos resetear la instancia global para que use la nueva configuración
    if (status.state === 'idle') {
      // La configuración se aplicará automáticamente en la próxima llamada a getPomodoroTimer()
      // porque savePomodoroConfig ya actualiza la instancia existente
    }

    setShowConfig(false);
  };

  const handlePause = async () => {
    const timer = await getPomodoroTimer();
    const currentStatus = timer.getStatus();
    if (currentStatus.state !== 'idle' && currentStatus.timeRemaining > 0) {
      timer.pause();
      setIsPaused(true);
      updateStatus();
    }
  };

  const handleStop = async () => {
    const timer = await getPomodoroTimer();
    timer.stop();
    setIsPaused(false);
    updateStatus();
  };

  const handleSkip = async () => {
    const timer = await getPomodoroTimer();
    if (status.state !== 'idle') {
      timer.stop();
      timer.start();
      updateStatus();
    }
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  const formatTime = (seconds: number): string => {
    return PomodoroTimer.formatTime(seconds);
  };

  const getProgress = (): number => {
    const config = {
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      pomodorosUntilLongBreak: 4
    };
    return PomodoroTimer.getProgress(status, config);
  };

  const getStateIcon = (): string => {
    switch (status.state) {
      case 'working': return '🍅';
      case 'shortBreak': return '☕';
      case 'longBreak': return '🌴';
      default: return '🍅';
    }
  };

  const getStateText = (): string => {
    switch (status.state) {
      case 'working': return 'Trabajando';
      case 'shortBreak': return 'Descanso';
      case 'longBreak': return 'Descanso largo';
      default: return 'Pomodoro';
    }
  };

  return (
    <div className="pomodoro-launcher">
      {/* Estado principal */}
      <div className="pomodoro-main">
        <div className="pomodoro-status-line">
          <span className="status-icon">{getStateIcon()}</span>
          <span className="status-text">{getStateText()}</span>
          {status.totalPomodoros > 0 && (
            <span className="total-badge">{status.totalPomodoros}</span>
          )}
        </div>

        <div className="pomodoro-time-large">
          {formatTime(status.timeRemaining)}
        </div>

        {status.state !== 'idle' && (
          <>
            <div className="pomodoro-progress-mini">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="pomodoro-session-info">
              <span>Sesión #{status.currentPomodoro}</span>
              {isPaused && <span className="pause-dot">⏸</span>}
            </div>
          </>
        )}

        {status.state === 'idle' && !showConfig && (
          <div className="pomodoro-hint">
            Presiona Enter para comenzar
          </div>
        )}

        {/* Configuración de tiempos */}
        {status.state === 'idle' && showConfig && (
          <div className="pomodoro-config">
            <div className="config-row">
              <label>Tiempo de trabajo (minutos):</label>
              <input
                type="number"
                min="1"
                max="60"
                value={workMinutes}
                onChange={(e) => setWorkMinutes(parseInt(e.target.value) || 25)}
                className="config-input"
              />
            </div>
            <div className="config-row">
              <label>Tiempo de descanso (minutos):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 5)}
                className="config-input"
              />
            </div>
            <div className="config-actions">
              <button className="config-btn save" onClick={handleSaveConfig}>
                ✓ Guardar
              </button>
              <button className="config-btn cancel" onClick={() => setShowConfig(false)}>
                ✕ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controles compactos */}
      <div className="pomodoro-controls-mini">
        {status.state === 'idle' ? (
          <>
            {!showConfig && (
              <button className="control-btn start-btn" onClick={handleStart}>
                ▶ Iniciar
              </button>
            )}
            <button 
              className="control-btn config-btn" 
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar tiempos"
            >
              ⚙️
            </button>
          </>
        ) : (
          <>
            {isPaused ? (
              <button className="control-btn" onClick={handleStart}>▶</button>
            ) : (
              <button className="control-btn" onClick={handlePause}>⏸</button>
            )}
            <button className="control-btn" onClick={handleSkip}>⏭</button>
            <button className="control-btn stop" onClick={handleStop}>⏹</button>
          </>
        )}
      </div>

      {/* Alerta minimalista */}
      {alert.show && (
        <div className="alert-mini" onClick={closeAlert}>
          <div className="alert-mini-content">
            <span className="alert-mini-icon">
              {alert.type === 'work' ? '✓' : '→'}
            </span>
            <div className="alert-mini-text">
              {alert.message.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};