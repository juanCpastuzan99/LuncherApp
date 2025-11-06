import React, { useState, useEffect } from 'react';
import { useTodos } from '../store/hooks';
import './TodoList.css';
import type { Todo } from '../../ai/todoManager';

interface TodoListProps {
  query?: string;
  onSelect?: (todo: Todo) => void;
}

const TodoList: React.FC<TodoListProps> = ({ query = '', onSelect }) => {
  const { todos, updateTodo } = useTodos();
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let filtered = todos;

    if (filter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(todo => {
        const titleMatch = todo.title.toLowerCase().includes(lowerQuery);
        const descMatch = todo.description?.toLowerCase().includes(lowerQuery);
        const tagMatch = todo.tags.some(tag => tag.includes(lowerQuery));
        return titleMatch || descMatch || tagMatch;
      });
    }

    // Ordenar: pendientes primero, luego por prioridad
    filtered.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setFilteredTodos(filtered);
    setSelectedIndex(0);
  }, [query, filter, todos]);

  const handleToggle = async (todo: Todo) => {
    await updateTodo(todo.id, {
      status: todo.status === 'pending' ? 'completed' : 'pending',
      completedAt: todo.status === 'pending' ? Date.now() : undefined
    });
    if (onSelect) {
      onSelect(todo);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="todo-list">
      <div className="todo-header">
        <div className="todo-stats">
          <span>{pendingCount} pendientes</span>
          <span>{completedCount} completadas</span>
        </div>
        <div className="todo-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completadas
          </button>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="todo-empty">
          <p>No hay tareas {filter !== 'all' ? `(${filter})` : ''}</p>
        </div>
      ) : (
        <div className="todo-items">
          {filteredTodos.slice(0, 10).map((todo, index) => (
            <div
              key={todo.id}
              className={`todo-item ${index === selectedIndex ? 'selected' : ''} ${todo.status === 'completed' ? 'completed' : ''}`}
              onClick={() => handleToggle(todo)}
            >
              <div className="todo-checkbox">
                {todo.status === 'completed' ? '✓' : '○'}
              </div>
              <div className="todo-content">
                <div className="todo-title">{todo.title}</div>
                {todo.description && (
                  <div className="todo-description">{todo.description}</div>
                )}
                {todo.tags.length > 0 && (
                  <div className="todo-tags">
                    {todo.tags.map(tag => (
                      <span key={tag} className="todo-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div 
                className="todo-priority" 
                style={{ color: getPriorityColor(todo.priority) }}
              >
                {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;

