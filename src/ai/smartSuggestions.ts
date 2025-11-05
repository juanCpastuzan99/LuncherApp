/**
 * Sugerencias inteligentes basadas en patrones de uso
 * Analiza historial y contexto para predecir aplicaciones
 */

import type { App, LaunchHistoryItem } from '@shared/types';

interface UsagePattern {
  appId: string;
  hour: number;
  dayOfWeek: number;
  previousApp?: string;
  frequency: number;
  lastUsed: number;
}

interface ContextualSuggestion {
  app: App;
  reason: string;
  confidence: number;
}

/**
 * Analiza patrones de uso del historial
 */
export function analyzeUsagePatterns(
  launchHistory: LaunchHistoryItem[],
  apps: App[]
): Map<string, UsagePattern> {
  const patterns = new Map<string, UsagePattern>();
  
  for (const item of launchHistory) {
    const date = new Date(item.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    const existing = patterns.get(item.id) || {
      appId: item.id,
      hour: 0,
      dayOfWeek: 0,
      frequency: 0,
      lastUsed: 0
    };
    
    existing.frequency++;
    existing.hour = (existing.hour + hour) / 2; // Promedio
    existing.dayOfWeek = dayOfWeek; // Último día usado
    existing.lastUsed = Math.max(existing.lastUsed, item.timestamp);
    
    patterns.set(item.id, existing);
  }
  
  // Detectar relaciones entre aplicaciones
  for (let i = 1; i < launchHistory.length; i++) {
    const prev = launchHistory[i - 1];
    const curr = launchHistory[i];
    const timeDiff = curr.timestamp - prev.timestamp;
    
    // Si se usaron en menos de 5 minutos, hay relación
    if (timeDiff < 5 * 60 * 1000) {
      const pattern = patterns.get(curr.id);
      if (pattern) {
        pattern.previousApp = prev.id;
      }
    }
  }
  
  return patterns;
}

/**
 * Obtiene sugerencias contextuales basadas en:
 * - Hora del día
 * - Día de la semana
 * - Aplicación anteriormente usada
 * - Frecuencia de uso
 */
export function getContextualSuggestions(
  apps: App[],
  launchHistory: LaunchHistoryItem[],
  favorites: string[],
  options: {
    currentAppId?: string;
    maxSuggestions?: number;
  } = {}
): ContextualSuggestion[] {
  const { currentAppId, maxSuggestions = 5 } = options;
  const patterns = analyzeUsagePatterns(launchHistory, apps);
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  const suggestions: ContextualSuggestion[] = [];
  
  // 1. Aplicaciones frecuentemente usadas a esta hora
  for (const [appId, pattern] of patterns.entries()) {
    const app = apps.find(a => a.id === appId);
    if (!app) continue;
    
    const hourDiff = Math.abs(pattern.hour - currentHour);
    const dayMatch = pattern.dayOfWeek === currentDay;
    
    let confidence = 0;
    let reason = '';
    
    // Match por hora (margen de ±2 horas)
    if (hourDiff <= 2) {
      confidence += 0.4;
      reason = `Usada frecuentemente a esta hora`;
    }
    
    // Match por día
    if (dayMatch) {
      confidence += 0.3;
      reason = `${reason ? reason + ' y ' : ''}usada los ${getDayName(currentDay)}`;
    }
    
    // Frecuencia de uso
    if (pattern.frequency > 10) {
      confidence += 0.2;
    }
    
    // Recientemente usada
    const daysSinceLastUse = (Date.now() - pattern.lastUsed) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse < 7) {
      confidence += 0.1;
    }
    
    if (confidence > 0.3) {
      suggestions.push({ app, reason, confidence });
    }
  }
  
  // 2. Aplicaciones relacionadas (usadas después de la app actual)
  if (currentAppId) {
    for (const [appId, pattern] of patterns.entries()) {
      if (pattern.previousApp === currentAppId) {
        const app = apps.find(a => a.id === appId);
        if (app && !suggestions.find(s => s.app.id === appId)) {
          const currentApp = apps.find(a => a.id === currentAppId);
          suggestions.push({
            app,
            reason: `Usualmente usada después de ${currentApp?.name || 'esta aplicación'}`,
            confidence: 0.6
          });
        }
      }
    }
  }
  
  // 3. Favoritos recientes
  for (const favId of favorites) {
    const app = apps.find(a => a.id === favId);
    if (app && !suggestions.find(s => s.app.id === favId)) {
      const lastUsed = launchHistory
        .filter(h => h.id === favId)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (lastUsed) {
        const daysSince = (Date.now() - lastUsed.timestamp) / (1000 * 60 * 60 * 24);
        if (daysSince < 3) {
          suggestions.push({
            app,
            reason: 'Favorito usado recientemente',
            confidence: 0.7
          });
        }
      }
    }
  }
  
  // Ordenar por confianza y limitar resultados
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
}

/**
 * Obtiene sugerencias basadas en la hora del día
 */
export function getTimeBasedSuggestions(
  apps: App[],
  launchHistory: LaunchHistoryItem[]
): ContextualSuggestion[] {
  const now = new Date();
  const hour = now.getHours();
  const suggestions: ContextualSuggestion[] = [];
  
  // Horario laboral (9 AM - 6 PM)
  if (hour >= 9 && hour < 18) {
    const workApps = ['code', 'visual studio', 'slack', 'teams', 'chrome', 'firefox'];
    for (const keyword of workApps) {
      const app = apps.find(a => 
        a.name.toLowerCase().includes(keyword)
      );
      if (app) {
        suggestions.push({
          app,
          reason: 'Aplicación común para horario laboral',
          confidence: 0.5
        });
      }
    }
  }
  
  // Tarde/Noche (6 PM - 12 AM)
  if (hour >= 18) {
    const leisureApps = ['spotify', 'steam', 'vlc', 'discord', 'netflix'];
    for (const keyword of leisureApps) {
      const app = apps.find(a => 
        a.name.toLowerCase().includes(keyword)
      );
      if (app) {
        suggestions.push({
          app,
          reason: 'Aplicación común para tiempo libre',
          confidence: 0.4
        });
      }
    }
  }
  
  return suggestions.slice(0, 3);
}

function getDayName(day: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[day];
}

/**
 * Obtiene sugerencias inteligentes combinadas
 */
export function getSmartSuggestions(
  apps: App[],
  launchHistory: LaunchHistoryItem[],
  favorites: string[],
  currentAppId?: string
): ContextualSuggestion[] {
  const contextual = getContextualSuggestions(apps, launchHistory, favorites, { currentAppId });
  const timeBased = getTimeBasedSuggestions(apps, launchHistory);
  
  // Combinar y deduplicar
  const combined = [...contextual, ...timeBased];
  const unique = new Map<string, ContextualSuggestion>();
  
  for (const suggestion of combined) {
    const existing = unique.get(suggestion.app.id);
    if (!existing || existing.confidence < suggestion.confidence) {
      unique.set(suggestion.app.id, suggestion);
    }
  }
  
  return Array.from(unique.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

