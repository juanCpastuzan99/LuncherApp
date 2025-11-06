import React, { forwardRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <div className="search-bar" style={{ 
        display: 'flex', 
        visibility: 'visible',
        opacity: 1,
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(26, 26, 46, 0.98)',
        backdropFilter: 'blur(10px)'
      }}>
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={ref}
          type="text"
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Buscar aplicaciones..."}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          style={{
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            color: 'rgba(255, 255, 255, 0.95)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            width: '100%',
            minWidth: '200px',
            height: '40px',
            padding: '0.5rem 0.75rem',
            fontSize: '1.1rem'
          }}
        />
        {value && (
          <button
            className="clear-button"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;

