import React from 'react';
import './ResultsList.css';

interface App {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: string;
}

interface ResultsListProps {
  apps: App[];
  selectedIndex: number;
  onSelect: (app: App) => void;
  query: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ apps, selectedIndex, onSelect, query }) => {
  // Si no hay query, no mostrar nada
  if (!query || !query.trim()) {
    return null;
  }
  
  // Si hay query pero no hay resultados, mostrar mensaje
  if (apps.length === 0) {
    return (
      <div className="results-list" style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '150px',
        padding: '2rem'
      }}>
        <div style={{ 
          textAlign: 'center', 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '1rem'
        }}>
          No se encontraron aplicaciones
        </div>
      </div>
    );
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="results-list" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {apps.map((app, index) => (
        <div
          key={app.id}
          className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(app)}
          onMouseEnter={() => {}}
          style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
        >
          <div className="result-icon">
            {app.type === 'uwp' ? '📱' : app.ext === '.exe' ? '💻' : '📄'}
          </div>
          <div className="result-content">
            <div className="result-name">
              {highlightMatch(app.name, query)}
            </div>
            <div className="result-path">{app.path}</div>
          </div>
          {index === selectedIndex && (
            <div className="result-hint">Enter</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultsList;

