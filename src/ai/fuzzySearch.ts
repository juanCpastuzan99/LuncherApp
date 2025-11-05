/**
 * Búsqueda inteligente con corrección de errores y fuzzy matching
 * Mejora la búsqueda existente con capacidades de IA
 */

import type { App } from '@shared/types';

interface SearchResult {
  app: App;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'synonym';
}

/**
 * Sinónimos comunes para aplicaciones populares
 */
const SYNONYMS: Record<string, string[]> = {
  'editor': ['code', 'visual studio', 'notepad', 'sublime', 'atom', 'vscode', 'vs code'],
  'navegador': ['browser', 'chrome', 'firefox', 'edge', 'opera', 'safari'],
  'terminal': ['cmd', 'powershell', 'bash', 'git bash', 'wsl', 'command'],
  'calculadora': ['calc', 'calculator', 'math'],
  'reproductor': ['player', 'media', 'vlc', 'music', 'video'],
  'imagen': ['image', 'photo', 'paint', 'gimp', 'photoshop'],
  'mensaje': ['message', 'chat', 'slack', 'discord', 'teams', 'whatsapp'],
  'correo': ['mail', 'email', 'outlook', 'gmail', 'thunderbird'],
  'archivo': ['file', 'explorer', 'finder'],
  'configuración': ['settings', 'config', 'preferences', 'options']
};

/**
 * Calcula la similitud entre dos strings usando Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Calcula un score de similitud (0-1) entre dos strings
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

/**
 * Busca sinónimos de la query
 */
function findSynonyms(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const synonyms: string[] = [];
  
  // Buscar sinónimos directos
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (values.some(v => v.includes(lowerQuery) || lowerQuery.includes(v))) {
      synonyms.push(key, ...values);
    }
    if (lowerQuery.includes(key)) {
      synonyms.push(...values);
    }
  }
  
  return [...new Set(synonyms)];
}

/**
 * Calcula score mejorado para una aplicación
 */
function calculateAdvancedScore(
  query: string,
  app: App,
  synonyms: string[]
): { score: number; matchType: SearchResult['matchType'] } {
  const lowerQuery = query.toLowerCase();
  const appName = app.name.toLowerCase();
  const appPath = app.path.toLowerCase();
  
  // Coincidencia exacta
  if (appName === lowerQuery || appPath === lowerQuery) {
    return { score: 1000, matchType: 'exact' };
  }
  
  // Empieza con la query
  if (appName.startsWith(lowerQuery) || appPath.startsWith(lowerQuery)) {
    return { score: 800, matchType: 'exact' };
  }
  
  // Contiene la query
  if (appName.includes(lowerQuery) || appPath.includes(lowerQuery)) {
    return { score: 500, matchType: 'exact' };
  }
  
  // Búsqueda por sinónimos
  for (const synonym of synonyms) {
    if (appName.includes(synonym) || appPath.includes(synonym)) {
      return { score: 400, matchType: 'synonym' };
    }
  }
  
  // Fuzzy matching (corrección de errores)
  const nameSimilarity = similarityScore(lowerQuery, appName);
  const pathSimilarity = similarityScore(lowerQuery, appPath);
  const maxSimilarity = Math.max(nameSimilarity, pathSimilarity);
  
  if (maxSimilarity > 0.7) {
    return { score: Math.floor(maxSimilarity * 300), matchType: 'fuzzy' };
  }
  
  // Búsqueda por palabras individuales
  const queryWords = lowerQuery.split(/\s+/);
  const appWords = appName.split(/\s+/);
  let wordMatches = 0;
  
  for (const qWord of queryWords) {
    for (const aWord of appWords) {
      if (aWord.startsWith(qWord) || similarityScore(qWord, aWord) > 0.7) {
        wordMatches++;
        break;
      }
    }
  }
  
  if (wordMatches > 0) {
    return { score: wordMatches * 100, matchType: 'fuzzy' };
  }
  
  return { score: 0, matchType: 'exact' };
}

/**
 * Búsqueda inteligente mejorada con IA
 */
export function intelligentSearch(
  query: string,
  apps: App[],
  options: {
    maxResults?: number;
    fuzzyThreshold?: number;
  } = {}
): SearchResult[] {
  const { maxResults = 50, fuzzyThreshold = 0.3 } = options;
  
  if (!query.trim()) {
    return apps.slice(0, maxResults).map(app => ({
      app,
      score: 0,
      matchType: 'exact'
    }));
  }
  
  // Buscar sinónimos
  const synonyms = findSynonyms(query);
  
  // Calcular scores para todas las aplicaciones
  const results: SearchResult[] = apps
    .map(app => {
      const { score, matchType } = calculateAdvancedScore(query, app, synonyms);
      return { app, score, matchType };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => {
      // Priorizar por score, luego por matchType, luego alfabéticamente
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      
      const typeOrder: Record<SearchResult['matchType'], number> = {
        exact: 4,
        synonym: 3,
        fuzzy: 2,
        semantic: 1
      };
      
      if (typeOrder[b.matchType] !== typeOrder[a.matchType]) {
        return typeOrder[b.matchType] - typeOrder[a.matchType];
      }
      
      return a.app.name.localeCompare(b.app.name);
    });
  
  // Aplicar threshold para fuzzy matching
  const filtered = results.filter(result => {
    if (result.matchType === 'fuzzy') {
      const minScore = fuzzyThreshold * 300;
      return result.score >= minScore;
    }
    return true;
  });
  
  return filtered.slice(0, maxResults);
}

/**
 * Obtiene sugerencias de búsqueda basadas en la query
 */
export function getSearchSuggestions(
  query: string,
  apps: App[],
  limit: number = 5
): string[] {
  if (!query.trim() || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();
  
  // Buscar en nombres de aplicaciones
  for (const app of apps) {
    const appName = app.name.toLowerCase();
    if (appName.includes(lowerQuery) && appName !== lowerQuery) {
      // Extraer la parte relevante
      const index = appName.indexOf(lowerQuery);
      const suggestion = app.name.substring(index, index + query.length + 10);
      if (suggestion.length > query.length) {
        suggestions.add(suggestion.trim());
      }
    }
  }
  
  // Agregar sinónimos relevantes
  const synonyms = findSynonyms(query);
  synonyms.forEach(syn => {
    if (syn.length > query.length && syn.toLowerCase().includes(lowerQuery)) {
      suggestions.add(syn);
    }
  });
  
  return Array.from(suggestions).slice(0, limit);
}

