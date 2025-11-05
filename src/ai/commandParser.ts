/**
 * Parser de comandos de lenguaje natural
 * Detecta intenciones en la búsqueda y ejecuta acciones
 */

import type { App } from '@shared/types';

export type CommandType = 
  | 'launch' 
  | 'window_management' 
  | 'calculate' 
  | 'convert'
  | 'search' 
  | 'educational'
  | 'flashcard'
  | 'note'
  | 'quiz'
  | 'pomodoro'
  | 'snippet'
  | 'todo'
  | 'commit'
  | 'docs'
  | 'unknown';

export interface ParsedCommand {
  type: CommandType;
  action?: string;
  target?: string;
  query?: string;
  from?: string;
  to?: string;
  value?: number;
  subject?: string;
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
 * Detecta si la query es un comando de lenguaje natural
 */
export function parseCommand(query: string): ParsedCommand {
  const lowerQuery = query.toLowerCase().trim();
  const originalQuery = query.trim();
  
  // Comando de gestión de ventanas
  const windowCommand = detectWindowCommand(lowerQuery);
  if (windowCommand) {
    return windowCommand;
  }
  
  // Comando de cálculo (prioritario si empieza con número o función matemática)
  // Usar query original para preservar mayúsculas en funciones como sin, cos, etc.
  const calcCommand = detectCalcCommand(originalQuery);
  if (calcCommand) {
    return calcCommand;
  }
  
  // Comando de conversión de unidades
  const convertCommand = detectConvertCommand(lowerQuery);
  if (convertCommand) {
    return convertCommand;
  }
  
  // Comando educativo (Wikipedia, búsqueda educativa)
  const educationalCommand = detectEducationalCommand(lowerQuery);
  if (educationalCommand) {
    return educationalCommand;
  }
  
  // Comando de flashcards
  const flashcardCommand = detectFlashcardCommand(lowerQuery);
  if (flashcardCommand) {
    return flashcardCommand;
  }
  
  // Comando de notas
  const noteCommand = detectNoteCommand(lowerQuery);
  if (noteCommand) {
    return noteCommand;
  }
  
  // Comando de quiz
  const quizCommand = detectQuizCommand(lowerQuery);
  if (quizCommand) {
    return quizCommand;
  }
  
  // Comando Pomodoro
  const pomodoroCommand = detectPomodoroCommand(lowerQuery);
  if (pomodoroCommand) {
    return pomodoroCommand;
  }
  
  // Comando de snippets
  const snippetCommand = detectSnippetCommand(lowerQuery);
  if (snippetCommand) {
    return snippetCommand;
  }
  
  // Comando de todos
  const todoCommand = detectTodoCommand(lowerQuery);
  if (todoCommand) {
    return todoCommand;
  }
  
  // Comando de commit
  const commitCommand = detectCommitCommand(lowerQuery);
  if (commitCommand) {
    return commitCommand;
  }
  
  // Comando de documentación
  const docsCommand = detectDocsCommand(lowerQuery);
  if (docsCommand) {
    return docsCommand;
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
  
  // Patrón mejorado: detecta expresiones que empiezan con número u operador matemático
  // Permite: números, operadores, paréntesis, funciones matemáticas, espacios
  const startsWithNumberPattern = /^[\d+\-*/().%\s]+$/;
  
  // Patrón para expresiones que empiezan con número seguido de operador o espacio
  const startsWithNumberAndOperator = /^\s*[\d+\-*/().%\s]+$/;
  
  // Patrón para funciones matemáticas comunes (sin, cos, sqrt, etc.)
  const mathFunctionPattern = /^(sin|cos|tan|ln|log|sqrt|exp|pow)\s*\(/i;
  
  // Si empieza con palabra clave de cálculo
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
  
  // Si empieza con función matemática
  if (mathFunctionPattern.test(query.trim())) {
    return {
      type: 'calculate',
      query: query.trim(),
      confidence: 0.85
    };
  }
  
  // Si es una expresión matemática pura (solo números y operadores)
  if (startsWithNumberPattern.test(query)) {
    return {
      type: 'calculate',
      query: query.trim(),
      confidence: 0.8
    };
  }
  
  // Si empieza con número seguido de operador o espacio (pero no es conversión)
  // Verificar que no sea una conversión de unidades primero
  const trimmed = query.trim();
  if (/^\d+/.test(trimmed) && /^[\d+\-*/().%\s]+$/.test(trimmed)) {
    // Verificar que no sea una conversión (no tiene palabras como "km", "a", "to", etc.)
    const hasUnitKeywords = /\b(km|metros|kilogramos|kg|gramos|libra|onza|celsius|fahrenheit|kelvin|a|to|en)\b/i.test(trimmed);
    if (!hasUnitKeywords) {
      return {
        type: 'calculate',
        query: trimmed,
        confidence: 0.75
      };
    }
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
 * Detecta comandos de conversión de unidades
 */
function detectConvertCommand(query: string): ParsedCommand | null {
  // Patrones: "convertir 100 km a millas", "100 USD a EUR", "convert 5 metros a pies", "100 km millas"
  const convertPatterns = [
    {
      regex: /convertir?\s+(\d+(?:\.\d+)?)\s+(\w+(?:\s+\w+)?)\s+(?:a|to|en)\s+(\w+(?:\s+\w+)?)/i,
      confidence: 0.9
    },
    {
      regex: /(\d+(?:\.\d+)?)\s+(\w+(?:\s+\w+)?)\s+(?:a|to|en)\s+(\w+(?:\s+\w+)?)/i,
      confidence: 0.8
    },
    {
      regex: /(\d+(?:\.\d+)?)\s+(\w+)\s+(\w+)/i,
      confidence: 0.6
    }
  ];
  
  for (const pattern of convertPatterns) {
    const match = query.match(pattern.regex);
    if (match && match[1] && match[2] && match[3]) {
      // Normalizar unidades (eliminar espacios extra, convertir a minúsculas)
      const from = match[2].trim().toLowerCase().replace(/\s+/g, ' ');
      const to = match[3].trim().toLowerCase().replace(/\s+/g, ' ');
      
      return {
        type: 'convert',
        value: parseFloat(match[1]),
        from,
        to,
        confidence: pattern.confidence
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos educativos (Wikipedia, búsqueda educativa)
 */
function detectEducationalCommand(query: string): ParsedCommand | null {
  // Patrones: "wikipedia: fotosíntesis", "buscar en wikipedia: Einstein"
  const wikiPattern = /(?:wikipedia|wiki)\s*:?\s*(.+)/i;
  const educationalPattern = /(?:buscar|search)\s+(?:en\s+)?(?:wikipedia|wiki|educación|educativo)\s*:?\s*(.+)/i;
  
  if (wikiPattern.test(query)) {
    const match = query.match(wikiPattern);
    if (match && match[1]) {
      return {
        type: 'educational',
        action: 'wikipedia',
        query: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (educationalPattern.test(query)) {
    const match = query.match(educationalPattern);
    if (match && match[1]) {
      return {
        type: 'educational',
        action: 'wikipedia',
        query: match[1].trim(),
        confidence: 0.8
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos Pomodoro
 */
function detectPomodoroCommand(query: string): ParsedCommand | null {
  // Patrones: "pomodoro", "iniciar pomodoro", "pausar pomodoro", "detener pomodoro", "resetear pomodoro"
  const pomodoroPattern = /^(pomodoro|pomo)\s*(start|iniciar|comenzar|pause|pausar|stop|detener|reset|resetear|break|descanso)?$/i;
  
  const match = query.match(pomodoroPattern);
  if (match) {
    const action = match[2]?.toLowerCase() || 'start';
    
    let finalAction = 'start';
    if (action === 'pause' || action === 'pausar') {
      finalAction = 'pause';
    } else if (action === 'stop' || action === 'detener') {
      finalAction = 'stop';
    } else if (action === 'reset' || action === 'resetear') {
      finalAction = 'reset';
    } else if (action === 'break' || action === 'descanso') {
      finalAction = 'break';
    }
    
    return {
      type: 'pomodoro',
      action: finalAction,
      confidence: 0.9
    };
  }
  
  // Patrones más específicos
  const specificPatterns = [
    { regex: /^(iniciar|start|comenzar)\s+(pomodoro|pomo)$/i, action: 'start' },
    { regex: /^(pausar|pause)\s+(pomodoro|pomo)$/i, action: 'pause' },
    { regex: /^(detener|stop|parar)\s+(pomodoro|pomo)$/i, action: 'stop' },
    { regex: /^(resetear|reset)\s+(pomodoro|pomo)$/i, action: 'reset' },
    { regex: /^(descanso|break)\s+(pomodoro|pomo)$/i, action: 'break' }
  ];
  
  for (const pattern of specificPatterns) {
    if (pattern.regex.test(query)) {
      return {
        type: 'pomodoro',
        action: pattern.action,
        confidence: 0.95
      };
    }
  }
  
  return null;
}

/**
 * Evalúa una expresión matemática de forma segura con funciones científicas
 */
export function evaluateMath(expression: string): number | null {
  try {
    // Reemplazar funciones matemáticas comunes
    let processed = expression
      .replace(/\bsin\s*\(/gi, 'Math.sin(')
      .replace(/\bcos\s*\(/gi, 'Math.cos(')
      .replace(/\btan\s*\(/gi, 'Math.tan(')
      .replace(/\bln\s*\(/gi, 'Math.log(')
      .replace(/\blog\s*\(/gi, 'Math.log10(')
      .replace(/\bsqrt\s*\(/gi, 'Math.sqrt(')
      .replace(/\bexp\s*\(/gi, 'Math.exp(')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\bpow\s*\(/gi, 'Math.pow(');
    
    // Convertir grados a radianes para funciones trigonométricas
    processed = processed.replace(/sin|cos|tan/i, (match) => {
      // Detectar si hay "grados" o "degrees" después
      return match;
    });
    
    // Limpiar la expresión (remover caracteres no permitidos excepto Math y funciones)
    // Permitir: números, operadores, paréntesis, Math, funciones matemáticas
    const clean = processed.replace(/[^0-9+\-*/().%\sMath\w\.()]/g, '');
    
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

/**
 * Detecta comandos de flashcards
 */
function detectFlashcardCommand(query: string): ParsedCommand | null {
  // "crear tarjeta: pregunta es respuesta", "crear tarjeta matemáticas: capital de Francia es París"
  const createPattern = /crear\s+tarjeta\s*(?:de\s+(\w+))?\s*:?\s*(.+)/i;
  
  // "estudiar tarjetas de matemáticas", "estudiar matemáticas", "tarjetas matemáticas"
  const studyPattern = /(?:estudiar|study|tarjetas|flashcards?)\s*(?:de\s+)?(\w+)?/i;
  
  if (createPattern.test(query)) {
    const match = query.match(createPattern);
    if (match && match[2]) {
      return {
        type: 'flashcard',
        action: 'create',
        subject: match[1]?.toLowerCase() || 'general',
        query: match[2].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (studyPattern.test(query)) {
    const match = query.match(studyPattern);
    if (match) {
      return {
        type: 'flashcard',
        action: 'study',
        subject: match[1]?.toLowerCase(),
        confidence: 0.85
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de notas
 */
function detectNoteCommand(query: string): ParsedCommand | null {
  // "nueva nota: título", "crear nota: álgebra"
  const createPattern = /(?:nueva|crear|new)\s+nota\s*:?\s*(.+)/i;
  
  // "buscar nota: query", "notas de matemáticas", "notas matemáticas"
  const searchPattern = /(?:buscar|search|notas?)\s+(?:nota|de)?\s*:?\s*(.+)/i;
  
  if (createPattern.test(query)) {
    const match = query.match(createPattern);
    if (match && match[1]) {
      return {
        type: 'note',
        action: 'create',
        subject: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (searchPattern.test(query)) {
    const match = query.match(searchPattern);
    if (match && match[1]) {
      return {
        type: 'note',
        action: 'search',
        subject: match[1].trim(),
        confidence: 0.8
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de quiz
 */
function detectQuizCommand(query: string): ParsedCommand | null {
  // "crear quiz: nombre", "crear quiz historia"
  const createPattern = /(?:crear|create|new)\s+quiz\s*:?\s*(.+)/i;
  
  // "empezar quiz de matemáticas", "quiz historia", "empezar quiz: historia"
  const startPattern = /(?:empezar|start|iniciar|quiz)\s*(?:de|:)?\s*(.+)/i;
  
  if (createPattern.test(query)) {
    const match = query.match(createPattern);
    if (match && match[1]) {
      return {
        type: 'quiz',
        action: 'create',
        subject: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (startPattern.test(query)) {
    const match = query.match(startPattern);
    if (match && match[1]) {
      return {
        type: 'quiz',
        action: 'start',
        subject: match[1].trim(),
        confidence: 0.85
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de snippets de código
 */
function detectSnippetCommand(query: string): ParsedCommand | null {
  // "crear snippet: javascript", "snippet react", "buscar snippet: array map"
  const createPattern = /(?:crear|create|new)\s+snippet\s*(?:de|:)?\s*(\w+)?\s*:?\s*(.+)/i;
  
  // "snippet javascript", "snippets react", "buscar snippet: query"
  const searchPattern = /(?:buscar|search|snippets?)\s*(?:de|:)?\s*(\w+)?\s*:?\s*(.+)?/i;
  
  if (createPattern.test(query)) {
    const match = query.match(createPattern);
    if (match) {
      return {
        type: 'snippet',
        action: 'create',
        subject: match[1]?.toLowerCase() || match[2]?.trim().toLowerCase(),
        confidence: 0.9
      };
    }
  }
  
  if (searchPattern.test(query)) {
    const match = query.match(searchPattern);
    if (match) {
      return {
        type: 'snippet',
        action: 'search',
        subject: match[1]?.toLowerCase() || match[2]?.trim().toLowerCase(),
        confidence: 0.8
      };
    }
  }
  
  // Patrón simple: "snippet javascript"
  const simplePattern = /^snippet\s+(\w+)$/i;
  const simpleMatch = query.match(simplePattern);
  if (simpleMatch) {
    return {
      type: 'snippet',
      action: 'search',
      subject: simpleMatch[1].toLowerCase(),
      confidence: 0.7
    };
  }
  
  return null;
}

/**
 * Detecta comandos de todos
 */
function detectTodoCommand(query: string): ParsedCommand | null {
  // "crear todo: tarea", "todo: revisar código", "nueva tarea: nombre"
  const createPattern = /(?:crear|create|new|nueva)\s+(?:todo|tarea|task)\s*:?\s*(.+)/i;
  const todoPattern = /^todo\s*:?\s*(.+)$/i;
  
  // "listar todos", "todos", "mostrar tareas"
  const listPattern = /(?:listar|mostrar|show|todos?|tareas?)$/i;
  
  if (createPattern.test(query)) {
    const match = query.match(createPattern);
    if (match && match[1]) {
      return {
        type: 'todo',
        action: 'create',
        subject: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (todoPattern.test(query)) {
    const match = query.match(todoPattern);
    if (match && match[1]) {
      return {
        type: 'todo',
        action: 'create',
        subject: match[1].trim(),
        confidence: 0.95
      };
    }
  }
  
  if (listPattern.test(query)) {
    return {
      type: 'todo',
      action: 'list',
      confidence: 0.85
    };
  }
  
  return null;
}

/**
 * Detecta comandos de commit message
 */
function detectCommitCommand(query: string): ParsedCommand | null {
  // "commit: agregar feature", "crear commit: mensaje", "commit message: texto"
  const commitPattern = /(?:commit|crear\s+commit|commit\s+message)\s*:?\s*(.+)/i;
  
  if (commitPattern.test(query)) {
    const match = query.match(commitPattern);
    if (match && match[1]) {
      return {
        type: 'commit',
        subject: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  return null;
}

/**
 * Detecta comandos de documentación
 */
function detectDocsCommand(query: string): ParsedCommand | null {
  // "mdn: array map", "docs react", "documentación: hooks"
  const mdnPattern = /^(?:mdn|mozilla)\s*:?\s*(.+)/i;
  const docsPattern = /(?:docs|documentaci[oó]n|documentation)\s*(?:de|:)?\s*(.+)/i;
  
  if (mdnPattern.test(query)) {
    const match = query.match(mdnPattern);
    if (match && match[1]) {
      return {
        type: 'docs',
        action: 'mdn',
        query: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  if (docsPattern.test(query)) {
    const match = query.match(docsPattern);
    if (match && match[1]) {
      return {
        type: 'docs',
        action: 'search',
        query: match[1].trim(),
        confidence: 0.8
      };
    }
  }
  
  return null;
}

