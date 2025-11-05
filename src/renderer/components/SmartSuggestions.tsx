/**
 * Componente para mostrar sugerencias inteligentes
 */

import React from 'react';
import type { App } from '@shared/types';
import './SmartSuggestions.css';

interface SmartSuggestion {
  app: App;
  reason: string;
  confidence: number;
}

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  activeIndex: number;
  onSelect: (app: App) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  activeIndex,
  onSelect
}) => {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="smart-suggestions">
      <div className="suggestions-header">
        <span className="suggestions-icon">💡</span>
        <span className="suggestions-title">Sugerencias Inteligentes</span>
      </div>
      <ul className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.app.id}
            className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
            onClick={() => onSelect(suggestion.app)}
            onMouseEnter={() => {
              // Scroll into view si es necesario
            }}
          >
            <div className="suggestion-content">
              <span className="app-name">{suggestion.app.name}</span>
              <span className="suggestion-reason">{suggestion.reason}</span>
            </div>
            <div className="confidence-badge">
              {Math.round(suggestion.confidence * 100)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

