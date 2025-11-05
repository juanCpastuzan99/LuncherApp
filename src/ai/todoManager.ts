/**
 * Gestor de Tareas Rápido para proyectos de desarrollo
 */

export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoStatus = 'pending' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  createdAt: number;
  completedAt?: number;
  tags: string[];
}

/**
 * Crea una nueva tarea
 */
export function createTodo(
  title: string,
  priority: TodoPriority = 'medium',
  description?: string,
  tags: string[] = []
): Todo {
  return {
    id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    description: description?.trim(),
    priority,
    status: 'pending',
    createdAt: Date.now(),
    tags: tags.map(t => t.toLowerCase())
  };
}

/**
 * Marca una tarea como completada
 */
export function completeTodo(todo: Todo): Todo {
  return {
    ...todo,
    status: 'completed',
    completedAt: Date.now()
  };
}

/**
 * Filtra tareas por estado, prioridad o búsqueda
 */
export function filterTodos(
  todos: Todo[],
  filters: {
    status?: TodoStatus;
    priority?: TodoPriority;
    query?: string;
  }
): Todo[] {
  let filtered = todos;

  if (filters.status) {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  if (filters.priority) {
    filtered = filtered.filter(t => t.priority === filters.priority);
  }

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(todo => {
      const titleMatch = todo.title.toLowerCase().includes(query);
      const descMatch = todo.description?.toLowerCase().includes(query);
      const tagMatch = todo.tags.some(tag => tag.includes(query));
      return titleMatch || descMatch || tagMatch;
    });
  }

  return filtered;
}

/**
 * Obtiene estadísticas de tareas
 */
export function getTodoStats(todos: Todo[]): {
  total: number;
  pending: number;
  completed: number;
  byPriority: Record<TodoPriority, number>;
} {
  return {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    completed: todos.filter(t => t.status === 'completed').length,
    byPriority: {
      high: todos.filter(t => t.priority === 'high').length,
      medium: todos.filter(t => t.priority === 'medium').length,
      low: todos.filter(t => t.priority === 'low').length
    }
  };
}

