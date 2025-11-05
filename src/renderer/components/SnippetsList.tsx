import React, { useState, useEffect } from 'react';
import { intelligentSearch } from '../../ai/fuzzySearch';
import './SnippetsList.css';
import type { CodeSnippet } from '../../ai/codeSnippets';

interface SnippetsListProps {
  query?: string;
  language?: string;
  onSelect?: (snippet: CodeSnippet) => void;
}

const SnippetsList: React.FC<SnippetsListProps> = ({ query = '', language, onSelect }) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<CodeSnippet[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadSnippets();
  }, []);

  useEffect(() => {
    if (query) {
      const searchResults = intelligentSearch(query, snippets.map(snippet => ({
        id: snippet.id,
        name: `${snippet.name} ${snippet.description || ''} ${snippet.tags.join(' ')}`,
        path: snippet.id,
        ext: '.snippet',
        type: 'snippet'
      })));
      
      const matchedIds = new Set(searchResults.map(r => r.app.id));
      let filtered = snippets.filter(s => matchedIds.has(s.id));
      
      if (language) {
        filtered = filtered.filter(s => s.language === language.toLowerCase());
      }
      
      setFilteredSnippets(filtered);
    } else if (language) {
      setFilteredSnippets(snippets.filter(s => s.language === language.toLowerCase()));
    } else {
      setFilteredSnippets(snippets);
    }
    setSelectedIndex(0);
  }, [query, language, snippets]);

  const loadSnippets = async () => {
    if (window.api?.getConfig) {
      const config = await window.api.getConfig();
      const allSnippets: CodeSnippet[] = config.snippets || [];
      setSnippets(allSnippets);
      setFilteredSnippets(allSnippets);
    }
  };

  const handleCopy = async (snippet: CodeSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      if (onSelect) {
        onSelect(snippet);
      }
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = snippet.code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (onSelect) {
        onSelect(snippet);
      }
    }
  };

  if (snippets.length === 0) {
    return (
      <div className="snippets-list empty">
        <p>No hay snippets. Crea uno con: "guardar snippet: [nombre]"</p>
      </div>
    );
  }

  if (filteredSnippets.length === 0) {
    return (
      <div className="snippets-list empty">
        <p>No se encontraron snippets</p>
      </div>
    );
  }

  return (
    <div className="snippets-list">
      {filteredSnippets.slice(0, 10).map((snippet, index) => (
        <div
          key={snippet.id}
          className={`snippet-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleCopy(snippet)}
        >
          <div className="snippet-header">
            <span className="snippet-name">{snippet.name}</span>
            <span className="snippet-language">{snippet.language}</span>
          </div>
          {snippet.description && (
            <div className="snippet-description">{snippet.description}</div>
          )}
          <div className="snippet-code">{snippet.code.substring(0, 100)}{snippet.code.length > 100 ? '...' : ''}</div>
          {snippet.tags.length > 0 && (
            <div className="snippet-tags">
              {snippet.tags.slice(0, 3).map(tag => (
                <span key={tag} className="snippet-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SnippetsList;

