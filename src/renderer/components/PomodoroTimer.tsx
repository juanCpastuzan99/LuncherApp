/**
 * Componente para mostrar y controlar el temporizador Pomodoro
 */

import React, { useEffect, useState } from 'react';
import { PomodoroTimer, getPomodoroTimer, type PomodoroStatus } from '../../ai/pomodoro';
import './PomodoroTimer.css';

export const PomodoroTimerComponent: React.FC = () => {
  const [status, setStatus] = useState<PomodoroStatus>({
    state: 'idle',
    timeRemaining: 0,
    currentPomodoro: 0,
    totalPomodoros: 0,
    phase: 'work'
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Inicializar temporizador de forma asíncrona para restaurar estado
    getPomodoroTimer().then((timer) => {
    
      // Configurar callbacks
      timer.setOnUpdate((newStatus) => {
        setStatus(newStatus);
        setIsPaused(false);
      });

      timer.setOnComplete((phase) => {
        // Mostrar notificación
        if ('Notification' in window && Notification.permission === 'granted') {
          const message = phase === 'work' 
            ? '¡Pomodoro completado! Toma un descanso.' 
            : '¡Descanso terminado! Listo para trabajar.';
          new Notification('Pomodoro', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });

      // Obtener estado inicial
      setStatus(timer.getStatus());

      // Solicitar permiso para notificaciones
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Actualizar periódicamente para asegurar sincronización (cada segundo)
      const updateInterval = setInterval(() => {
        const currentStatus = timer.getStatus();
        // Solo actualizar si el estado cambió o el tiempo cambió
        setStatus((prevStatus) => {
          if (
            prevStatus.state !== currentStatus.state ||
            prevStatus.timeRemaining !== currentStatus.timeRemaining ||
            prevStatus.currentPomodoro !== currentStatus.currentPomodoro
          ) {
            return currentStatus;
          }
          return prevStatus;
        });
      }, 1000); // Actualizar cada segundo para sincronizar con el temporizador

      return () => {
        clearInterval(updateInterval);
      };
    });
  }, []);

  const handleStart = async () => {
    const timer = await getPomodoroTimer();
    if (status.state === 'idle') {
      timer.start();
      setStatus(timer.getStatus());
    } else if (isPaused) {
      timer.resume();
      setIsPaused(false);
      setStatus(timer.getStatus());
    }
  };

  const handlePause = async () => {
    const timer = await getPomodoroTimer();
    const currentStatus = timer.getStatus();
    if (currentStatus.state !== 'idle' && currentStatus.timeRemaining > 0) {
      timer.pause();
      setIsPaused(true);
      setStatus(timer.getStatus());
    }
  };

  const handleStop = async () => {
    const timer = await getPomodoroTimer();
    timer.stop();
    setIsPaused(false);
    setStatus(timer.getStatus());
  };

  const handleReset = async () => {
    const timer = await getPomodoroTimer();
    timer.reset();
    setIsPaused(false);
    setStatus(timer.getStatus());
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

  const getStateLabel = (): string => {
    switch (status.state) {
      case 'working':
        return 'Trabajando';
      case 'shortBreak':
        return 'Descanso Corto';
      case 'longBreak':
        return 'Descanso Largo';
      default:
        return 'Inactivo';
    }
  };

  const getStateEmoji = (): string => {
    switch (status.state) {
      case 'working':
        return '🍅';
      case 'shortBreak':
        return '☕';
      case 'longBreak':
        return '🌴';
      default:
        return '⏸️';
    }
  };

  if (status.state === 'idle') {
    return (
      <div className="pomodoro-timer idle">
        <div className="pomodoro-header">
          <span className="pomodoro-icon">🍅</span>
          <span className="pomodoro-label">Pomodoro</span>
        </div>
        <div className="pomodoro-controls">
          <button className="pomodoro-btn start" onClick={handleStart}>
            Iniciar Pomodoro
          </button>
        </div>
        {status.totalPomodoros > 0 && (
          <div className="pomodoro-stats">
            <span>Pomodoros completados: {status.totalPomodoros}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`pomodoro-timer ${status.state}`}>
      <div className="pomodoro-header">
        <span className="pomodoro-icon">{getStateEmoji()}</span>
        <span className="pomodoro-label">{getStateLabel()}</span>
      </div>
      
      <div className="pomodoro-time">
        {formatTime(status.timeRemaining)}
      </div>
      
      <div className="pomodoro-progress">
        <div 
          className="pomodoro-progress-bar" 
          style={{ width: `${getProgress()}%` }}
        />
      </div>
      
      <div className="pomodoro-stats">
        <span>Pomodoro #{status.currentPomodoro}</span>
        {status.totalPomodoros > 0 && (
          <span className="pomodoro-total">Total: {status.totalPomodoros}</span>
        )}
      </div>
      
      <div className="pomodoro-controls">
        {isPaused ? (
          <button className="pomodoro-btn resume" onClick={handleStart}>
            Reanudar
          </button>
        ) : (
          <button className="pomodoro-btn pause" onClick={handlePause}>
            Pausar
          </button>
        )}
        <button className="pomodoro-btn stop" onClick={handleStop}>
          Detener
        </button>
        <button className="pomodoro-btn reset" onClick={handleReset}>
          Resetear
        </button>
      </div>
    </div>
  );
};

