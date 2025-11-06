import React, { useState, useEffect } from 'react';
import { intelligentSearch } from '../../ai/fuzzySearch';
import { useNotes } from '../store/hooks';
import './NotesList.css';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface NotesListProps {
  query?: string;
  category?: string;
  onSelect?: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ query = '', category, onSelect }) => {
  const { notes } = useNotes();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query) {
      const searchResults = intelligentSearch(query, notes.map(note => ({
        id: note.id,
        name: `${note.title} ${note.content}`,
        path: note.id,
        ext: '.note',
        type: 'note'
      })));
      
      const matchedIds = new Set(searchResults.map(r => r.app.id));
      setFilteredNotes(notes.filter(n => matchedIds.has(n.id)));
    } else if (category) {
      setFilteredNotes(notes.filter(n => n.category === category));
    } else {
      setFilteredNotes(notes);
    }
    setSelectedIndex(0);
  }, [query, category, notes]);


  if (notes.length === 0) {
    return (
      <div className="notes-list empty">
        <p>No hay notas. Crea una con: "nueva nota: [título]"</p>
      </div>
    );
  }

  if (filteredNotes.length === 0) {
    return (
      <div className="notes-list empty">
        <p>No se encontraron notas</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {filteredNotes.slice(0, 10).map((note, index) => (
        <div
          key={note.id}
          className={`note-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect?.(note)}
        >
          <div className="note-title">{note.title}</div>
          <div className="note-preview">{note.content.substring(0, 100)}...</div>
          <div className="note-meta">
            <span className="note-category">{note.category}</span>
            {note.tags.length > 0 && (
              <span className="note-tags">
                {note.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesList;

