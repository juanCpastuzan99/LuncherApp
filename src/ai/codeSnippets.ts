/**
 * Gestor de Code Snippets para estudiantes de desarrollo
 */

export interface CodeSnippet {
  id: string;
  name: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Crea un nuevo snippet
 */
export function createSnippet(
  name: string,
  code: string,
  language: string = 'javascript',
  description?: string,
  tags: string[] = []
): CodeSnippet {
  const now = Date.now();
  return {
    id: `snippet-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    code: code.trim(),
    language: language.toLowerCase(),
    description: description?.trim(),
    tags: tags.map(t => t.toLowerCase()),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Busca snippets por nombre, lenguaje o tags
 */
export function searchSnippets(
  snippets: CodeSnippet[],
  query: string,
  language?: string
): CodeSnippet[] {
  const lowerQuery = query.toLowerCase();
  
  let filtered = snippets;
  
  // Filtrar por lenguaje si se especifica
  if (language) {
    filtered = filtered.filter(s => s.language === language.toLowerCase());
  }
  
  // Buscar por nombre, descripción o tags
  return filtered.filter(snippet => {
    const nameMatch = snippet.name.toLowerCase().includes(lowerQuery);
    const descMatch = snippet.description?.toLowerCase().includes(lowerQuery);
    const tagMatch = snippet.tags.some(tag => tag.includes(lowerQuery));
    const codeMatch = snippet.code.toLowerCase().includes(lowerQuery);
    
    return nameMatch || descMatch || tagMatch || codeMatch;
  });
}

/**
 * Snippets predefinidos comunes
 */
export const DEFAULT_SNIPPETS: CodeSnippet[] = [
  createSnippet(
    'useState Hook',
    `const [state, setState] = useState(initialValue);`,
    'javascript',
    'React useState hook básico',
    ['react', 'hooks', 'state']
  ),
  createSnippet(
    'useEffect Hook',
    `useEffect(() => {
  // efecto
  return () => {
    // cleanup
  };
}, [dependencies]);`,
    'javascript',
    'React useEffect hook con cleanup',
    ['react', 'hooks', 'effect']
  ),
  createSnippet(
    'Debounce Function',
    `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
    'javascript',
    'Función debounce para optimizar eventos',
    ['javascript', 'utility', 'performance']
  ),
  createSnippet(
    'Async/Await',
    `async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}`,
    'javascript',
    'Función async/await con manejo de errores',
    ['javascript', 'async', 'fetch']
  ),
  createSnippet(
    'Componente React',
    `import React from 'react';

interface Props {
  // props
}

const Component: React.FC<Props> = ({ }) => {
  return (
    <div>
      {/* contenido */}
    </div>
  );
};

export default Component;`,
    'typescript',
    'Plantilla de componente React con TypeScript',
    ['react', 'typescript', 'component']
  )
];

