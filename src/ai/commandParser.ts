/**
 * Parser de comandos de lenguaje natural
 * Detecta intenciones en la búsqueda y ejecuta acciones
 */

import type { App } from '@shared/types';

export type CommandType = 
  | 'launch' 
  | 'window_management' 
  | 'calculate' 
  | 'search' 
  | 'unknown';

export interface ParsedCommand {
  type: CommandType;
  action?: string;
  target?: string;
  query?: string;
  confidence: number;
}

/**
 * Patrones de comandos para acciones de ventana
 */
const WINDOW_COMMANDS: Record<string, string> = {
  'organiza': 'tile',
  'organizar': 'tile',
  'tile': 'tile',
  'grid': 'tile',
  'maximiza': 'maximize',
  'maximizar': 'maximize',
  'maximize': 'maximize',
  'minimiza': 'minimize',
  'minimizar': 'minimize',
  'minimize': 'minimize',
  'centra': 'center',
  'centrar': 'center',
  'center': 'center',
  'mueve': 'move',
  'mover': 'move',
  'move': 'move',
  'izquierda': 'left',
  'left': 'left',
  'derecha': 'right',
  'right': 'right',
  'workspace': 'workspace',
  'espacio': 'workspace',
  'siguiente': 'next',
  'anterior': 'previous',
  'previous': 'previous',
  'next': 'next'
};

/**
 * Patrones para búsqueda web
 */
const SEARCH_KEYWORDS = ['buscar', 'search', 'busca', 'google', 'web'];

/**
 * Patrones para calculadora
 */
const CALC_KEYWORDS = ['calcula', 'calculate', 'calc', '=', 'cuánto', 'cuanto'];

/**
 * Detecta si la query es un comando de lenguaje natural
 */
export function parseCommand(query: string): ParsedCommand {
  const lowerQuery = query.toLowerCase().trim();
  
  // Comando de gestión de ventanas
  const windowCommand = detectWindowCommand(lowerQuery);
  if (windowCommand) {
    return windowCommand;
  }
  
  // Comando de cálculo
  const calcCommand = detectCalcCommand(lowerQuery);
  if (calcCommand) {
    return calcCommand;
  }
  
  // Comando de búsqueda web
  const searchCommand = detectSearchCommand(lowerQuery);
  if (searchCommand) {
    return searchCommand;
  }
  
  // Comando de lanzamiento (formato: "abre X" o "open X")
  const launchCommand = detectLaunchCommand(lowerQuery);
  if (launchCommand) {
    return launchCommand;
  }
  
  return {
    type: 'unknown',
    confidence: 0
  };
}

/**
 * Detecta comandos de gestión de ventanas
 */
function detectWindowCommand(query: string): ParsedCommand | null {
  // Patrones: "organiza ventanas", "maximiza ventana", "centra ventana", etc.
  const patterns = [
    {
      regex: /(organiza|organizar|tile|grid)\s+(ventanas|windows)?/i,
      action: 'tile',
      confidence: 0.9
    },
    {
      regex: /(maximiza|maximizar|maximize)\s+(ventana|window)?/i,
      action: 'maximize',
      confidence: 0.9
    },
    {
      regex: /(minimiza|minimizar|minimize)\s+(ventana|window)?/i,
      action: 'minimize',
      confidence: 0.9
    },
    {
      regex: /(centra|centrar|center)\s+(ventana|window)?/i,
      action: 'center',
      confidence: 0.9
    },
    {
      regex: /(mueve|mover|move)\s+(ventana|window)?\s+(izquierda|left)/i,
      action: 'move_left',
      confidence: 0.85
    },
    {
      regex: /(mueve|mover|move)\s+(ventana|window)?\s+(derecha|right)/i,
      action: 'move_right',
      confidence: 0.85
    },
    {
      regex: /(workspace|espacio)\s+(siguiente|next)/i,
      action: 'workspace_next',
      confidence: 0.8
    },
    {
      regex: /(workspace|espacio)\s+(anterior|previous)/i,
      action: 'workspace_previous',
      confidence: 0.8
    }
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(query)) {
      return {
        type: 'window_management',
        action: pattern.action,
        confidence: pattern.confidence
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de cálculo
 */
function detectCalcCommand(query: string): ParsedCommand | null {
  // Patrones: "calcula 2+2", "2 * 5", "cuánto es 10% de 200"
  const calcPattern = /(calcula|calculate|calc|cu[áa]nto|cuanto)\s+(?:es\s+)?([\d+\-*/().%\s]+)/i;
  const simpleCalcPattern = /^[\d+\-*/().%\s]+$/;
  
  if (calcPattern.test(query)) {
    const match = query.match(calcPattern);
    if (match && match[2]) {
      return {
        type: 'calculate',
        query: match[2].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (simpleCalcPattern.test(query)) {
    return {
      type: 'calculate',
      query: query.trim(),
      confidence: 0.7
    };
  }
  
  return null;
}

/**
 * Detecta comandos de búsqueda web
 */
function detectSearchCommand(query: string): ParsedCommand | null {
  // Patrones: "buscar en google: electron", "search: tutorial"
  const searchPattern = /(buscar|search|busca)\s+(?:en\s+(?:google|web|internet)\s*:?\s*)?(.+)/i;
  
  if (searchPattern.test(query)) {
    const match = query.match(searchPattern);
    if (match && match[2]) {
      return {
        type: 'search',
        query: match[2].trim(),
        confidence: 0.8
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de lanzamiento
 */
function detectLaunchCommand(query: string): ParsedCommand | null {
  // Patrones: "abre chrome", "open visual studio code", "lanzar firefox"
  const launchPattern = /(abre|open|launch|lanzar|ejecuta|ejecutar)\s+(.+)/i;
  
  if (launchPattern.test(query)) {
    const match = query.match(launchPattern);
    if (match && match[2]) {
      return {
        type: 'launch',
        target: match[2].trim(),
        confidence: 0.7
      };
    }
  }
  
  return null;
}

/**
 * Evalúa una expresión matemática de forma segura
 */
export function evaluateMath(expression: string): number | null {
  try {
    // Limpiar la expresión (remover caracteres no permitidos)
    const clean = expression.replace(/[^0-9+\-*/().%\s]/g, '');
    
    // Reemplazar % por /100
    const withPercent = clean.replace(/(\d+)%/g, '($1/100)');
    
    // Evaluar de forma segura
    const result = Function(`"use strict"; return (${withPercent})`)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
  } catch (error) {
    // Error en evaluación
  }
  
  return null;
}

/**
 * Formatea el resultado de un cálculo
 */
export function formatCalcResult(result: number): string {
  // Redondear a 2 decimales si es necesario
  if (result % 1 !== 0) {
    return result.toFixed(2);
  }
  return result.toString();
}

