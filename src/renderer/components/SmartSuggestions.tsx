import React from 'react';
import './SmartSuggestions.css';

interface App {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: string;
}

interface SmartSuggestionsProps {
  suggestions: App[];
  onSelect: (app: App) => void;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="smart-suggestions">
      <div className="suggestions-header">
        <span className="suggestions-icon">💡</span>
        <span className="suggestions-label">Sugerencias</span>
      </div>
      <div className="suggestions-list">
        {suggestions.slice(0, 5).map((app) => (
          <div
            key={app.id}
            className="suggestion-item"
            onClick={() => onSelect(app)}
          >
            <div className="suggestion-icon">
              {app.type === 'uwp' ? '📱' : app.ext === '.exe' ? '💻' : '📄'}
            </div>
            <div className="suggestion-name">{app.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartSuggestions;

