/**
 * Hook personalizado para búsqueda inteligente con IA
 * Integra fuzzy search, sugerencias contextuales y comandos de lenguaje natural
 * 
 * @module useIntelligentSearch
 * @version 2.0.0
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { intelligentSearch, getSearchSuggestions } from '../../ai/fuzzySearch';
import { parseCommand, evaluateMath, formatCalcResult } from '../../ai/commandParser';
import { getSmartSuggestions } from '../../ai/smartSuggestions';
import type { App, LaunchHistoryItem } from '@shared/types';

// ============================================
// TIPOS Y ENUMS
// ============================================

/**
 * Tipos de match en la búsqueda
 */
export enum MatchType {
  EXACT = 'exact',
  FUZZY = 'fuzzy',
  SEMANTIC = 'semantic',
  SYNONYM = 'synonym',
  PARTIAL = 'partial',
  ACRONYM = 'acronym'
}

/**
 * Tipos de comandos soportados
 */
export enum CommandType {
  CALCULATE = 'calculate',
  SEARCH = 'search',
  WINDOW_MANAGEMENT = 'window_management',
  LAUNCH = 'launch',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

/**
 * Niveles de confianza para las sugerencias
 */
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Resultado de búsqueda individual
 */
export interface SearchResultItem {
  app: App;
  score: number;
  matchType: MatchType;
  highlights?: string[];
  relevanceReason?: string;
}

/**
 * Sugerencia inteligente
 */
export interface SmartSuggestion {
  app: App;
  reason: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  category?: 'frequent' | 'recent' | 'favorite' | 'contextual';
}

/**
 * Comando detectado
 */
export interface DetectedCommand {
  type: CommandType;
  result?: string;
  action?: string;
  parameters?: Record<string, any>;
  confidence?: number;
}

/**
 * Opciones de configuración del hook
 */
export interface UseIntelligentSearchOptions {
  /** Lista de aplicaciones disponibles */
  apps: App[];
  /** Query de búsqueda */
  query: string;
  /** Historial de lanzamientos */
  launchHistory?: LaunchHistoryItem[];
  /** IDs de aplicaciones favoritas */
  favorites?: string[];
  /** Habilitar detección de comandos */
  enableCommands?: boolean;
  /** Habilitar sugerencias inteligentes */
  enableSuggestions?: boolean;
  /** Máximo número de resultados */
  maxResults?: number;
  /** Score mínimo para incluir resultado */
  minScore?: number;
  /** Habilitar cache de resultados */
  enableCache?: boolean;
  /** Callback cuando se detecta un comando */
  onCommandDetected?: (command: DetectedCommand) => void;
  /** Callback para analytics */
  onSearchPerformed?: (query: string, resultsCount: number) => void;
}

/**
 * Resultado completo de la búsqueda inteligente
 */
export interface IntelligentSearchResult {
  /** Resultados de búsqueda rankeados */
  results: SearchResultItem[];
  /** Sugerencias de autocompletado */
  suggestions: string[];
  /** Sugerencias inteligentes basadas en contexto */
  smartSuggestions: SmartSuggestion[];
  /** Comando detectado (si aplica) */
  command?: DetectedCommand;
  /** Query procesada */
  processedQuery: string;
  /** Tiempo de búsqueda en ms */
  searchTime?: number;
  /** Indica si hay más resultados disponibles */
  hasMore: boolean;
  /** Total de resultados encontrados */
  totalResults: number;
  /** Metadata adicional */
  metadata?: {
    cacheHit?: boolean;
    algorithmUsed?: string;
    confidence?: number;
  };
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Calcula el nivel de confianza basado en un score numérico
 */
function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return ConfidenceLevel.HIGH;
  if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

/**
 * Detecta si la query parece ser una expresión matemática
 */
function isMathExpression(query: string): boolean {
  const mathPattern = /^[\s]*[\d+\-*/().%\s]+$|^(sin|cos|tan|ln|log|sqrt|exp|pow|abs|ceil|floor|round)\s*\(/i;
  const hasAppKeywords = /\b(app|aplicación|programa|software)\b/i.test(query);
  return mathPattern.test(query.trim()) && !hasAppKeywords;
}

/**
 * Genera highlights para mostrar coincidencias
 */
function generateHighlights(text: string, query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const highlights: string[] = [];
  
  words.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = text.match(regex);
    if (matches) {
      highlights.push(...matches);
    }
  });
  
  return [...new Set(highlights)];
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook para búsqueda inteligente con soporte de comandos y sugerencias contextuales
 * 
 * @example
 * ```tsx
 * const { results, command, smartSuggestions } = useIntelligentSearch({
 *   apps,
 *   query: searchQuery,
 *   launchHistory,
 *   favorites,
 *   maxResults: 10
 * });
 * ```
 */
export function useIntelligentSearch({
  apps,
  query,
  launchHistory = [],
  favorites = [],
  enableCommands = true,
  enableSuggestions = true,
  maxResults = 10,
  minScore = 0.1,
  enableCache = true,
  onCommandDetected,
  onSearchPerformed
}: UseIntelligentSearchOptions): IntelligentSearchResult {
  
  // Referencias para cache y performance
  const cacheRef = useRef<Map<string, IntelligentSearchResult>>(new Map());
  const searchStartTimeRef = useRef<number>(0);
  const lastQueryRef = useRef<string>('');
  
  /**
   * Limpia el cache cuando las apps cambian
   */
  useEffect(() => {
    if (enableCache) {
      cacheRef.current.clear();
    }
  }, [apps.length, enableCache]);
  
  /**
   * Procesa comandos especiales detectados
   */
  const processCommand = useCallback((command: any, trimmedQuery: string): DetectedCommand | undefined => {
    // Comando de cálculo
    if (command.type === 'calculate') {
      const calcQuery = command.query || trimmedQuery;
      const calcResult = evaluateMath(calcQuery);
      
      if (calcResult !== null) {
        const detectedCommand: DetectedCommand = {
          type: CommandType.CALCULATE,
          result: formatCalcResult(calcResult),
          confidence: 1.0,
          parameters: { expression: calcQuery, value: calcResult }
        };
        
        onCommandDetected?.(detectedCommand);
        return detectedCommand;
      }
    }
    
    // Auto-detección de expresiones matemáticas
    if (!command.type && isMathExpression(trimmedQuery)) {
      const calcResult = evaluateMath(trimmedQuery);
      
      if (calcResult !== null) {
        const detectedCommand: DetectedCommand = {
          type: CommandType.CALCULATE,
          result: formatCalcResult(calcResult),
          confidence: 0.95,
          parameters: { expression: trimmedQuery, value: calcResult }
        };
        
        onCommandDetected?.(detectedCommand);
        return detectedCommand;
      }
    }
    
    // Comando de gestión de ventanas
    if (command.type === 'window_management' && command.action) {
      const detectedCommand: DetectedCommand = {
        type: CommandType.WINDOW_MANAGEMENT,
        action: command.action,
        confidence: 0.9,
        parameters: { 
          target: command.target,
          direction: command.direction 
        }
      };
      
      onCommandDetected?.(detectedCommand);
      return detectedCommand;
    }
    
    // Comando de búsqueda web
    if (command.type === 'search' && command.query) {
      const detectedCommand: DetectedCommand = {
        type: CommandType.SEARCH,
        result: command.query,
        confidence: 0.95,
        parameters: { engine: command.engine || 'google' }
      };
      
      onCommandDetected?.(detectedCommand);
      return detectedCommand;
    }
    
    // Comando de lanzamiento directo
    if (command.type === 'launch' && command.target) {
      return {
        type: CommandType.LAUNCH,
        confidence: 0.85,
        parameters: { target: command.target }
      };
    }
    
    return undefined;
  }, [onCommandDetected]);
  
  /**
   * Convierte el tipo de match de string literal a enum MatchType
   */
  const mapMatchType = (matchType: string): MatchType => {
    switch (matchType) {
      case 'exact':
        return MatchType.EXACT;
      case 'fuzzy':
        return MatchType.FUZZY;
      case 'semantic':
        return MatchType.SEMANTIC;
      case 'synonym':
        return MatchType.SYNONYM;
      default:
        return MatchType.FUZZY;
    }
  };

  /**
   * Procesa los resultados de búsqueda y añade metadata
   */
  const enhanceSearchResults = useCallback((
    searchResults: Array<{ app: App; score: number; matchType: string }>,
    query: string
  ): SearchResultItem[] => {
    return searchResults
      .filter(result => result.score >= minScore)
      .slice(0, maxResults)
      .map(result => ({
        app: result.app,
        score: result.score,
        matchType: mapMatchType(result.matchType),
        highlights: generateHighlights(result.app.name, query),
        relevanceReason: result.score > 0.9 
          ? 'Coincidencia exacta' 
          : result.score > 0.7 
          ? 'Coincidencia alta' 
          : 'Coincidencia parcial'
      }));
  }, [maxResults, minScore]);
  
  /**
   * Mejora las sugerencias inteligentes con niveles de confianza
   */
  const enhanceSmartSuggestions = useCallback((
    suggestions: Array<{ app: App; reason: string; confidence: number }>
  ): SmartSuggestion[] => {
    return suggestions.map(sugg => ({
      ...sugg,
      confidenceLevel: getConfidenceLevel(sugg.confidence),
      category: sugg.reason.includes('frecuente') 
        ? 'frequent' as const
        : sugg.reason.includes('reciente') 
        ? 'recent' as const
        : sugg.reason.includes('favorit') 
        ? 'favorite' as const
        : 'contextual' as const
    }));
  }, []);
  
  /**
   * Resultado principal del hook con memoización
   */
  const result = useMemo(() => {
    searchStartTimeRef.current = performance.now();
    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();
    
    // Check cache
    if (enableCache && cacheRef.current.has(normalizedQuery)) {
      const cached = cacheRef.current.get(normalizedQuery)!;
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true
        }
      };
    }
    
    // Query vacía - mostrar sugerencias inteligentes
    if (!trimmedQuery && enableSuggestions) {
      const smartSuggestions = getSmartSuggestions(apps, launchHistory, favorites);
      const enhanced = enhanceSmartSuggestions(smartSuggestions);
      
      const emptyResult: IntelligentSearchResult = {
        results: [],
        suggestions: [],
        smartSuggestions: enhanced,
        command: undefined,
        processedQuery: '',
        hasMore: false,
        totalResults: 0,
        metadata: {
          cacheHit: false,
          algorithmUsed: 'smart-suggestions',
          confidence: 1.0
        }
      };
      
      return emptyResult;
    }
    
    // Detectar y procesar comandos
    let detectedCommand: DetectedCommand | undefined;
    
    if (enableCommands && trimmedQuery.length > 0) {
      const command = parseCommand(trimmedQuery);
      detectedCommand = processCommand(command, trimmedQuery);
      
      // Si es comando de lanzamiento, buscar la app
      if (detectedCommand?.type === CommandType.LAUNCH) {
        const target = detectedCommand.parameters?.target || '';
        const launchResults = intelligentSearch(target, apps);
        const enhanced = enhanceSearchResults(launchResults, target);
        
        const launchResult: IntelligentSearchResult = {
          results: enhanced,
          suggestions: [],
          smartSuggestions: [],
          command: detectedCommand,
          processedQuery: target,
          searchTime: performance.now() - searchStartTimeRef.current,
          hasMore: launchResults.length > maxResults,
          totalResults: launchResults.length,
          metadata: {
            cacheHit: false,
            algorithmUsed: 'intelligent-search',
            confidence: detectedCommand.confidence
          }
        };
        
        if (enableCache) {
          cacheRef.current.set(normalizedQuery, launchResult);
        }
        
        onSearchPerformed?.(trimmedQuery, enhanced.length);
        return launchResult;
      }
      
      // Si es otro tipo de comando, retornar solo el comando
      if (detectedCommand) {
        const commandResult: IntelligentSearchResult = {
          results: [],
          suggestions: [],
          smartSuggestions: [],
          command: detectedCommand,
          processedQuery: trimmedQuery,
          searchTime: performance.now() - searchStartTimeRef.current,
          hasMore: false,
          totalResults: 0,
          metadata: {
            cacheHit: false,
            algorithmUsed: 'command-parser',
            confidence: detectedCommand.confidence
          }
        };
        
        return commandResult;
      }
    }
    
    // Búsqueda normal mejorada
    const searchResults = intelligentSearch(normalizedQuery, apps);
    const enhanced = enhanceSearchResults(searchResults, trimmedQuery);
    
    // Sugerencias de autocompletado
    const searchSuggestions = getSearchSuggestions(normalizedQuery, apps);
    
    // Sugerencias inteligentes (solo para queries cortas)
    const smartSuggestions = enableSuggestions && trimmedQuery.length < 3
      ? enhanceSmartSuggestions(getSmartSuggestions(apps, launchHistory, favorites))
      : [];
    
    const searchTime = performance.now() - searchStartTimeRef.current;
    
    const finalResult: IntelligentSearchResult = {
      results: enhanced,
      suggestions: searchSuggestions.slice(0, 5),
      smartSuggestions,
      command: undefined,
      processedQuery: normalizedQuery,
      searchTime,
      hasMore: searchResults.length > maxResults,
      totalResults: searchResults.length,
      metadata: {
        cacheHit: false,
        algorithmUsed: 'intelligent-search',
        confidence: enhanced.length > 0 ? enhanced[0].score : 0
      }
    };
    
    // Cache result
    if (enableCache && searchResults.length > 0) {
      cacheRef.current.set(normalizedQuery, finalResult);
      
      // Limit cache size
      if (cacheRef.current.size > 100) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }
    }
    
    // Analytics callback
    onSearchPerformed?.(trimmedQuery, enhanced.length);
    
    // Update last query
    lastQueryRef.current = normalizedQuery;
    
    return finalResult;
  }, [
    apps,
    query,
    launchHistory,
    favorites,
    enableCommands,
    enableSuggestions,
    maxResults,
    minScore,
    enableCache,
    processCommand,
    enhanceSearchResults,
    enhanceSmartSuggestions,
    onSearchPerformed
  ]);
  
  return result;
}

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook para obtener estadísticas de búsqueda
 */
export function useSearchStats(searchResult: IntelligentSearchResult) {
  return useMemo(() => ({
    hasResults: searchResult.results.length > 0,
    hasCommand: !!searchResult.command,
    hasSuggestions: searchResult.suggestions.length > 0,
    hasSmartSuggestions: searchResult.smartSuggestions.length > 0,
    isFromCache: searchResult.metadata?.cacheHit || false,
    searchTime: searchResult.searchTime || 0,
    confidence: searchResult.metadata?.confidence || 0,
    isEmpty: searchResult.totalResults === 0 && !searchResult.command,
    topResult: searchResult.results[0] || null,
    topSuggestion: searchResult.smartSuggestions[0] || null
  }), [searchResult]);
}

/**
 * Hook para gestionar el historial de búsquedas
 */
export function useSearchHistory(maxItems: number = 10) {
  const historyRef = useRef<string[]>([]);
  
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    historyRef.current = [
      query,
      ...historyRef.current.filter(q => q !== query)
    ].slice(0, maxItems);
  }, [maxItems]);
  
  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);
  
  const getHistory = useCallback(() => {
    return [...historyRef.current];
  }, []);
  
  return {
    addToHistory,
    clearHistory,
    getHistory,
    history: historyRef.current
  };
}

// ============================================
// EXPORTS
// ============================================

export default useIntelligentSearch;