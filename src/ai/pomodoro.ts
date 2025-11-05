/**
 * Módulo Pomodoro - Técnica de gestión del tiempo
 * 25 minutos de trabajo, 5 minutos de descanso corto, 15 minutos de descanso largo después de 4 pomodoros
 */

export type PomodoroState = 'idle' | 'working' | 'shortBreak' | 'longBreak';
export type PomodoroPhase = 'work' | 'break';

export interface PomodoroConfig {
  workDuration: number; // en segundos
  shortBreakDuration: number; // en segundos
  longBreakDuration: number; // en segundos
  pomodorosUntilLongBreak: number;
}

export interface PomodoroStatus {
  state: PomodoroState;
  timeRemaining: number; // en segundos
  currentPomodoro: number;
  totalPomodoros: number;
  phase: PomodoroPhase;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workDuration: 25 * 60, // 25 minutos
  shortBreakDuration: 5 * 60, // 5 minutos
  longBreakDuration: 15 * 60, // 15 minutos
  pomodorosUntilLongBreak: 4
};

export class PomodoroTimer {
  private config: PomodoroConfig;
  private status: PomodoroStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate?: (status: PomodoroStatus) => void;
  private onComplete?: (phase: PomodoroPhase) => void;
  private startedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedDuration: number = 0;
  private lastSaveTime: number = 0;

  constructor(config?: Partial<PomodoroConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = {
      state: 'idle',
      timeRemaining: 0,
      currentPomodoro: 0,
      totalPomodoros: 0,
      phase: 'work'
    };
  }

  /**
   * Inicia un pomodoro de trabajo
   */
  start(): void {
    if (this.status.state === 'working') {
      return; // Ya está trabajando
    }

    this.status = {
      state: 'working',
      timeRemaining: this.config.workDuration,
      currentPomodoro: this.status.currentPomodoro + 1,
      totalPomodoros: this.status.totalPomodoros + 1,
      phase: 'work'
    };

    this.startedAt = Date.now();
    this.pausedAt = null;
    this.pausedDuration = 0;
    
    this.saveState();
    this.startTimer();
  }

  /**
   * Inicia un descanso corto
   */
  startShortBreak(): void {
    this.status = {
      state: 'shortBreak',
      timeRemaining: this.config.shortBreakDuration,
      currentPomodoro: this.status.currentPomodoro,
      totalPomodoros: this.status.totalPomodoros,
      phase: 'break'
    };

    this.startedAt = Date.now();
    this.pausedAt = null;
    this.pausedDuration = 0;
    
    this.saveState();
    this.startTimer();
  }

  /**
   * Inicia un descanso largo
   */
  startLongBreak(): void {
    this.status = {
      state: 'longBreak',
      timeRemaining: this.config.longBreakDuration,
      currentPomodoro: this.status.currentPomodoro,
      totalPomodoros: this.status.totalPomodoros,
      phase: 'break'
    };

    this.startedAt = Date.now();
    this.pausedAt = null;
    this.pausedDuration = 0;
    
    this.saveState();
    this.startTimer();
  }

  /**
   * Pausa el temporizador actual
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.startedAt && !this.pausedAt) {
      this.pausedAt = Date.now();
      const elapsed = Math.floor((this.pausedAt - this.startedAt) / 1000);
      this.pausedDuration += elapsed;
      this.saveState();
    }
  }

  /**
   * Reanuda el temporizador
   */
  resume(): void {
    if (this.status.state !== 'idle' && !this.intervalId) {
      if (this.pausedAt) {
        const pausedTime = Math.floor((Date.now() - this.pausedAt) / 1000);
        this.pausedDuration += pausedTime;
        this.pausedAt = null;
        this.startedAt = Date.now();
        this.saveState();
      }
      this.startTimer();
    }
  }

  /**
   * Detiene y resetea el temporizador
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.status = {
      state: 'idle',
      timeRemaining: 0,
      currentPomodoro: this.status.currentPomodoro,
      totalPomodoros: this.status.totalPomodoros,
      phase: 'work'
    };

    this.startedAt = null;
    this.pausedAt = null;
    this.pausedDuration = 0;
    
    this.saveState();

    if (this.onUpdate) {
      this.onUpdate(this.status);
    }
  }

  /**
   * Resetea completamente el contador
   */
  reset(): void {
    this.stop();
    this.status = {
      state: 'idle',
      timeRemaining: 0,
      currentPomodoro: 0,
      totalPomodoros: 0,
      phase: 'work'
    };

    this.saveState();

    if (this.onUpdate) {
      this.onUpdate(this.status);
    }
  }

  /**
   * Inicia el temporizador
   */
  private startTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.status.timeRemaining > 0) {
        this.status.timeRemaining--;
        
        // Guardar estado cada 5 segundos para no sobrecargar
        const now = Date.now();
        if (now - this.lastSaveTime > 5000) {
          this.saveState();
          this.lastSaveTime = now;
        }
        
        if (this.onUpdate) {
          this.onUpdate(this.status);
        }
      } else {
        // Temporizador completado
        this.handleComplete();
      }
    }, 1000);

    if (this.onUpdate) {
      this.onUpdate(this.status);
    }
    
    this.lastSaveTime = Date.now();
  }
  
  /**
   * Guarda el estado actual en almacenamiento persistente
   */
  private saveState(): void {
    savePomodoroState(
      this.status,
      this.startedAt,
      this.pausedAt,
      this.pausedDuration
    ).catch(err => console.error('Error guardando estado:', err));
  }

  /**
   * Maneja la finalización del temporizador
   */
  private handleComplete(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const phase = this.status.phase;

    if (this.onComplete) {
      this.onComplete(phase);
    }

    // Auto-avanzar al siguiente estado
    if (this.status.state === 'working') {
      // Determinar si es descanso corto o largo
      if (this.status.currentPomodoro % this.config.pomodorosUntilLongBreak === 0) {
        this.startLongBreak();
      } else {
        this.startShortBreak();
      }
    } else {
      // Descanso completado, volver a idle
      this.status = {
        ...this.status,
        state: 'idle',
        timeRemaining: 0
      };
    }

    if (this.onUpdate) {
      this.onUpdate(this.status);
    }
  }

  /**
   * Obtiene el estado actual
   */
  getStatus(): PomodoroStatus {
    return { ...this.status };
  }

  /**
   * Configura callback de actualización
   */
  setOnUpdate(callback: (status: PomodoroStatus) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Configura callback de completado
   */
  setOnComplete(callback: (phase: PomodoroPhase) => void): void {
    this.onComplete = callback;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<PomodoroConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Formatea el tiempo restante en formato MM:SS
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene el porcentaje de progreso
   */
  static getProgress(status: PomodoroStatus, config: PomodoroConfig): number {
    if (status.state === 'idle') return 0;

    let totalDuration: number;
    switch (status.state) {
      case 'working':
        totalDuration = config.workDuration;
        break;
      case 'shortBreak':
        totalDuration = config.shortBreakDuration;
        break;
      case 'longBreak':
        totalDuration = config.longBreakDuration;
        break;
      default:
        return 0;
    }

    const elapsed = totalDuration - status.timeRemaining;
    return (elapsed / totalDuration) * 100;
  }
}

// Instancia global del temporizador
let pomodoroInstance: PomodoroTimer | null = null;

/**
 * Guarda el estado del Pomodoro en el almacenamiento persistente
 */
async function savePomodoroState(status: PomodoroStatus, startedAt: number | null, pausedAt: number | null, pausedDuration: number): Promise<void> {
  try {
    // Usar window.api para guardar en el main process
    if (typeof window !== 'undefined' && window.api && window.api.setConfig) {
      await window.api.setConfig('pomodoro', 'state', {
        state: status.state,
        timeRemaining: status.timeRemaining,
        currentPomodoro: status.currentPomodoro,
        totalPomodoros: status.totalPomodoros,
        phase: status.phase,
        startedAt,
        pausedAt,
        pausedDuration
      });
    }
  } catch (error) {
    console.error('Error guardando estado Pomodoro:', error);
  }
}

/**
 * Restaura el estado del Pomodoro desde el almacenamiento persistente
 */
async function restorePomodoroState(): Promise<{
  status: PomodoroStatus;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDuration: number;
} | null> {
  try {
    if (typeof window !== 'undefined' && window.api && window.api.getConfig) {
      const config = await window.api.getConfig();
      // El estado puede estar en config.pomodoro.state o directamente en config.pomodoro
      const pomodoroState = config?.pomodoro?.state || config?.pomodoro;
      
      if (pomodoroState && pomodoroState.state !== 'idle') {
        const now = Date.now();
        let timeRemaining = pomodoroState.timeRemaining || 0;
        
        // Si estaba corriendo (no pausado), calcular tiempo transcurrido
        if (pomodoroState.startedAt && !pomodoroState.pausedAt) {
          const elapsed = Math.floor((now - pomodoroState.startedAt) / 1000) - pomodoroState.pausedDuration;
          timeRemaining = Math.max(0, timeRemaining - elapsed);
        }
        
        // Si el tiempo se agotó, devolver null para reiniciar
        if (timeRemaining <= 0 && pomodoroState.state !== 'idle') {
          return null;
        }
        
        return {
          status: {
            state: pomodoroState.state,
            timeRemaining,
            currentPomodoro: pomodoroState.currentPomodoro || 0,
            totalPomodoros: pomodoroState.totalPomodoros || 0,
            phase: pomodoroState.phase || 'work'
          },
          startedAt: pomodoroState.pausedAt ? null : pomodoroState.startedAt,
          pausedAt: pomodoroState.pausedAt,
          pausedDuration: pomodoroState.pausedDuration || 0
        };
      }
    }
  } catch (error) {
    console.error('Error restaurando estado Pomodoro:', error);
  }
  
  return null;
}

/**
 * Carga la configuración del Pomodoro desde el almacenamiento
 */
async function loadPomodoroConfig(): Promise<Partial<PomodoroConfig> | null> {
  try {
    if (typeof window !== 'undefined' && window.api && window.api.getConfig) {
      const config = await window.api.getConfig();
      const pomodoroConfig = config?.pomodoro?.config;
      
      if (pomodoroConfig) {
        return {
          workDuration: pomodoroConfig.workDuration ? pomodoroConfig.workDuration * 60 : undefined,
          shortBreakDuration: pomodoroConfig.shortBreakDuration ? pomodoroConfig.shortBreakDuration * 60 : undefined,
          longBreakDuration: pomodoroConfig.longBreakDuration ? pomodoroConfig.longBreakDuration * 60 : undefined,
          pomodorosUntilLongBreak: pomodoroConfig.pomodorosUntilLongBreak
        };
      }
    }
  } catch (error) {
    console.error('Error cargando configuración Pomodoro:', error);
  }
  
  return null;
}

/**
 * Guarda la configuración del Pomodoro
 */
export async function savePomodoroConfig(config: {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration?: number;
  pomodorosUntilLongBreak?: number;
}): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.api && window.api.setConfig) {
      await window.api.setConfig('pomodoro', 'config', {
        workDuration: config.workDuration,
        shortBreakDuration: config.shortBreakDuration,
        longBreakDuration: config.longBreakDuration || 15,
        pomodorosUntilLongBreak: config.pomodorosUntilLongBreak || 4
      });
      
      // Actualizar la instancia existente si hay una
      if (pomodoroInstance) {
        pomodoroInstance.updateConfig({
          workDuration: config.workDuration * 60,
          shortBreakDuration: config.shortBreakDuration * 60,
          longBreakDuration: (config.longBreakDuration || 15) * 60,
          pomodorosUntilLongBreak: config.pomodorosUntilLongBreak || 4
        });
      }
    }
  } catch (error) {
    console.error('Error guardando configuración Pomodoro:', error);
  }
}

/**
 * Obtiene la configuración actual del Pomodoro
 */
export async function getPomodoroConfig(): Promise<PomodoroConfig> {
  const savedConfig = await loadPomodoroConfig();
  if (savedConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...savedConfig
    };
  }
  return DEFAULT_CONFIG;
}

/**
 * Obtiene la instancia global del temporizador Pomodoro
 */
export async function getPomodoroTimer(): Promise<PomodoroTimer> {
  if (!pomodoroInstance) {
    // Cargar configuración guardada
    const savedConfig = await loadPomodoroConfig();
    pomodoroInstance = new PomodoroTimer(savedConfig || undefined);
    
    // Restaurar estado guardado
    const restored = await restorePomodoroState();
    if (restored) {
      pomodoroInstance['status'] = restored.status;
      pomodoroInstance['startedAt'] = restored.startedAt;
      pomodoroInstance['pausedAt'] = restored.pausedAt;
      pomodoroInstance['pausedDuration'] = restored.pausedDuration;
      
      // Si estaba corriendo, reiniciar el temporizador
      if (restored.status.state !== 'idle' && restored.startedAt && !restored.pausedAt) {
        pomodoroInstance['startTimer']();
      }
    }
  }
  return pomodoroInstance;
}

/**
 * Resetea la instancia global (útil para testing)
 */
export function resetPomodoroTimer(): void {
  if (pomodoroInstance) {
    pomodoroInstance.stop();
  }
  pomodoroInstance = null;
}

