/**
 * Generador de mensajes de commit siguiendo Conventional Commits
 */

export type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'perf';

export interface CommitMessage {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  breaking?: boolean;
  fullMessage: string;
}

/**
 * Genera un mensaje de commit
 */
export function generateCommitMessage(
  description: string,
  type: CommitType = 'feat',
  scope?: string,
  breaking: boolean = false
): CommitMessage {
  // Detectar tipo automáticamente si no se especifica
  if (!type || type === 'feat') {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('fix') || lowerDesc.includes('error') || lowerDesc.includes('bug')) {
      type = 'fix';
    } else if (lowerDesc.includes('doc') || lowerDesc.includes('readme')) {
      type = 'docs';
    } else if (lowerDesc.includes('test')) {
      type = 'test';
    } else if (lowerDesc.includes('refactor') || lowerDesc.includes('reorganizar')) {
      type = 'refactor';
    } else if (lowerDesc.includes('style') || lowerDesc.includes('formato')) {
      type = 'style';
    } else if (lowerDesc.includes('perf') || lowerDesc.includes('performance')) {
      type = 'perf';
    }
  }

  // Limpiar descripción
  let cleanDescription = description.trim();
  
  // Remover palabras clave del tipo si están en la descripción
  cleanDescription = cleanDescription
    .replace(/^(fix|feat|docs|style|refactor|test|chore|perf):?\s*/i, '')
    .replace(/^(agregar|añadir|add|crear|crear|implementar):\s*/i, '')
    .trim();

  // Capitalizar primera letra
  cleanDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);

  // Construir mensaje
  let fullMessage = type;
  if (scope) {
    fullMessage += `(${scope})`;
  }
  if (breaking) {
    fullMessage += '!';
  }
  fullMessage += `: ${cleanDescription}`;

  return {
    type,
    scope,
    description: cleanDescription,
    breaking,
    fullMessage
  };
}

/**
 * Tipos de commit con descripciones
 */
export const COMMIT_TYPES: Record<CommitType, string> = {
  feat: 'Nueva funcionalidad',
  fix: 'Corrección de bug',
  docs: 'Cambios en documentación',
  style: 'Cambios de formato (sin afectar código)',
  refactor: 'Refactorización de código',
  test: 'Agregar o modificar tests',
  chore: 'Tareas de mantenimiento',
  perf: 'Mejoras de rendimiento'
};

