/**
 * Hook personalizado para búsqueda inteligente con IA
 * Integra fuzzy search, sugerencias y comandos de lenguaje natural
 */

import { useMemo } from 'react';
import { intelligentSearch, getSearchSuggestions } from '../../ai/fuzzySearch';
import { parseCommand, evaluateMath, formatCalcResult } from '../../ai/commandParser';
import { getSmartSuggestions } from '../../ai/smartSuggestions';
import type { App, LaunchHistoryItem } from '@shared/types';

interface UseIntelligentSearchOptions {
  apps: App[];
  query: string;
  launchHistory?: LaunchHistoryItem[];
  favorites?: string[];
  enableCommands?: boolean;
  enableSuggestions?: boolean;
}

interface IntelligentSearchResult {
  results: Array<{
    app: App;
    score: number;
    matchType: 'exact' | 'fuzzy' | 'semantic' | 'synonym';
  }>;
  suggestions: string[];
  smartSuggestions: Array<{
    app: App;
    reason: string;
    confidence: number;
  }>;
  command?: {
    type: 'calculate' | 'search' | 'window_management' | 'launch';
    result?: string;
    action?: string;
  };
}

export function useIntelligentSearch({
  apps,
  query,
  launchHistory = [],
  favorites = [],
  enableCommands = true,
  enableSuggestions = true
}: UseIntelligentSearchOptions): IntelligentSearchResult {
  
  const result = useMemo(() => {
    const trimmedQuery = query.trim();
    
    // Si no hay query, mostrar sugerencias inteligentes
    if (!trimmedQuery && enableSuggestions) {
      const smartSuggestions = getSmartSuggestions(
        apps,
        launchHistory,
        favorites
      );
      
      return {
        results: [],
        suggestions: [],
        smartSuggestions
      };
    }
    
    // Detectar comandos
    if (enableCommands && trimmedQuery.length > 0) {
      const command = parseCommand(trimmedQuery);
      
      // Comando de cálculo
      if (command.type === 'calculate' && command.query) {
        const calcResult = evaluateMath(command.query);
        if (calcResult !== null) {
          return {
            results: [],
            suggestions: [],
            smartSuggestions: [],
            command: {
              type: 'calculate',
              result: formatCalcResult(calcResult)
            }
          };
        }
      }
      
      // Comando de gestión de ventanas
      if (command.type === 'window_management' && command.action) {
        return {
          results: [],
          suggestions: [],
          smartSuggestions: [],
          command: {
            type: 'window_management',
            action: command.action
          }
        };
      }
      
      // Comando de búsqueda web
      if (command.type === 'search' && command.query) {
        return {
          results: [],
          suggestions: [],
          smartSuggestions: [],
          command: {
            type: 'search',
            result: command.query
          }
        };
      }
      
      // Comando de lanzamiento (buscar la app)
      if (command.type === 'launch' && command.target) {
        const launchResults = intelligentSearch(command.target, apps);
        return {
          results: launchResults,
          suggestions: [],
          smartSuggestions: [],
          command: {
            type: 'launch'
          }
        };
      }
    }
    
    // Búsqueda normal mejorada
    const searchResults = intelligentSearch(trimmedQuery, apps);
    const searchSuggestions = getSearchSuggestions(trimmedQuery, apps);
    
    // Sugerencias inteligentes (si hay query corta)
    const smartSuggestions = enableSuggestions && trimmedQuery.length < 3
      ? getSmartSuggestions(apps, launchHistory, favorites)
      : [];
    
    return {
      results: searchResults,
      suggestions: searchSuggestions,
      smartSuggestions
    };
  }, [apps, query, launchHistory, favorites, enableCommands, enableSuggestions]);
  
  return result;
}

