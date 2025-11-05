import React, { forwardRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ query, onQueryChange }, ref) => {
    const handleSettingsClick = () => {
      window.api.openSettings();
    };
    
    return (
      <div className="search-container">
        <input
          ref={ref}
          id="search"
          className="search"
          type="text"
          placeholder="Buscar aplicaciones… (Ctrl+Space)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoFocus
        />
        <button
          id="settings-btn"
          className="settings-btn"
          title="Configuración"
          onClick={handleSettingsClick}
        >
          ⚙️
        </button>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

