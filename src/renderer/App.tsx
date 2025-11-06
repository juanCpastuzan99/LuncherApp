import React, { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import CalcResult from './components/CalcResult';
import SmartSuggestions from './components/SmartSuggestions';
import { PomodoroTimerComponent } from './components/PomodoroTimer';
import FlashcardStudy from './components/FlashcardStudy';
import NotesList from './components/NotesList';
import QuizStudy from './components/QuizStudy';
import SnippetsList from './components/SnippetsList';
import TodoList from './components/TodoList';
import { intelligentSearch } from '../ai/fuzzySearch';
import { parseCommand, evaluateMath, formatCalcResult } from '../ai/commandParser';
import { getSmartSuggestions } from '../ai/smartSuggestions';
import { createFlashcard } from '../ai/educational';
import { createTodo } from '../ai/todoManager';
import { generateCommitMessage } from '../ai/commitGenerator';
import type { App } from '../shared/types';
import type { Note } from './components/NotesList';
import type { Todo } from '../ai/todoManager';
import './App.css';

// ============================================
// CUSTOM HOOKS
// ============================================

/**
 * Hook para manejar la configuración de la aplicación
 */
function useAppConfig() {
  const [launchHistory, setLaunchHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (window.api?.getConfig) {
      window.api.getConfig().then((config: any) => {
        setLaunchHistory(config.history || []);
        setFavorites(config.favorites || []);
      });
    }
  }, []);

  return { launchHistory, setLaunchHistory, favorites };
}

/**
 * Hook para manejar las aplicaciones
 */
function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!window.api) {
      console.warn('⚠️ window.api no está disponible');
      setIsLoading(false);
      return;
    }

    console.log('📡 [useApps] Registrando listener de apps-updated');
    
    let isMounted = true;
    
    // Registrar listener PRIMERO antes de solicitar apps
    const removeListener = window.api.on('apps-updated', (appsList: App[]) => {
      console.log(`📥 [useApps] Apps recibidas: ${appsList.length}`);
      
      if (!isMounted) {
        console.warn('⚠️ [useApps] Componente desmontado, ignorando apps');
        return;
      }
      
      if (Array.isArray(appsList)) {
        console.log(`✅ [useApps] Actualizando apps: ${appsList.length} aplicaciones`);
        setApps(appsList);
        setIsLoading(false);
      } else {
        console.warn('⚠️ [useApps] Apps recibidas no es un array:', typeof appsList);
        setIsLoading(false);
      }
    });

    // Esperar a que el DOM esté completamente listo antes de solicitar
    const requestApps = () => {
      console.log('📤 [useApps] Solicitando escaneo de aplicaciones...');
      window.api.send('scan-apps');
    };

    // Usar requestAnimationFrame para asegurar que React está listo
    if (document.readyState === 'complete') {
      setTimeout(requestApps, 200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(requestApps, 200);
      });
    }

    return () => {
      console.log('🧹 [useApps] Limpiando listener de apps-updated');
      isMounted = false;
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      } else if (window.api?.removeAllListeners) {
        window.api.removeAllListeners('apps-updated');
      }
    };
  }, []);

  return { apps, isLoading };
}

/**
 * Hook para manejar el portapapeles
 */
function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Error copying to clipboard:', fallbackErr);
      }
      
      document.body.removeChild(textArea);
    }
  }, []);

  return { copied, copyToClipboard };
}

// ============================================
// TIPOS Y ESTADOS
// ============================================

interface ViewState {
  type: 'apps' | 'calc' | 'pomodoro' | 'flashcards' | 'notes' | 'quiz' | 'snippets' | 'todos' | 'commit' | 'empty';
  data?: any;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function App() {
  // Estados básicos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const { apps, isLoading } = useApps();
  const { launchHistory, setLaunchHistory, favorites } = useAppConfig();
  const { copied, copyToClipboard } = useClipboard();

  // Estado unificado de la vista
  const [viewState, setViewState] = useState<ViewState>({ type: 'empty' });

  // Apps filtradas y sugerencias
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [suggestions, setSuggestions] = useState<App[]>([]);

  // ============================================
  // EFECTOS
  // ============================================

  // Auto-focus en el input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Procesar búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      handleEmptySearch();
      return;
    }

    processSearch(searchQuery);
  }, [searchQuery, apps, launchHistory, favorites]);

  // ============================================
  // FUNCIONES DE BÚSQUEDA
  // ============================================

  const handleEmptySearch = useCallback(() => {
    if (apps.length === 0) {
      // Si no hay apps aún, mantener estado vacío
      setSuggestions([]);
      setFilteredApps([]);
      setViewState({ type: 'empty' });
      return;
    }
    const smartSuggestions = getSmartSuggestions(apps, launchHistory, favorites);
    setSuggestions(smartSuggestions.map(s => s.app));
    setFilteredApps(apps.slice(0, 10));
    setViewState({ type: 'empty' });
    setSelectedIndex(0);
  }, [apps, launchHistory, favorites]);

  const processSearch = useCallback((query: string) => {
    setSuggestions([]);
    const command = parseCommand(query);

    // Evaluar matemáticas
    if (shouldEvaluateMath(query, command)) {
      const result = evaluateMath(query.trim());
      if (result !== null) {
        setViewState({
          type: 'calc',
          data: { expression: query, result: formatCalcResult(result) }
        });
        setFilteredApps([]);
        return;
      }
    }

    // Procesar comandos especiales
    const commandResult = processCommand(command);
    if (commandResult) {
      setViewState(commandResult);
      setFilteredApps([]);
      return;
    }

    // Búsqueda normal de apps
    const searchResults = intelligentSearch(query.toLowerCase(), apps);
    const filtered = searchResults.slice(0, 10).map(result => result.app);
    
    setFilteredApps(filtered);
    setViewState({ type: 'apps' });
    setSelectedIndex(0);
  }, [apps]);

  // ============================================
  // PROCESAMIENTO DE COMANDOS
  // ============================================

  const shouldEvaluateMath = (query: string, command: any): boolean => {
    if (command.type === 'calculate' && command.query) return true;
    
    if (!command.type || command.type === 'unknown') {
      const mathPattern = /^[\s]*[\d+\-*/().%\s]+$|^(sin|cos|tan|ln|log|sqrt|exp|pow)\s*\(/i;
      const hasAppKeywords = /\b(app|aplicación|programa|software|chrome|firefox|code|visual|studio)\b/i.test(query);
      return mathPattern.test(query.trim()) && !hasAppKeywords;
    }
    
    return false;
  };

  const processCommand = (command: any): ViewState | null => {
    switch (command.type) {
      case 'pomodoro':
        return { type: 'pomodoro' };

      case 'flashcard':
        if (command.action === 'study' && command.subject) {
          return { type: 'flashcards', data: { category: command.subject } };
        }
        if (command.action === 'create') {
          handleCreateFlashcard(command);
          return { type: 'flashcards', data: { category: command.subject || 'general' } };
        }
        break;

      case 'note':
        if (command.action === 'create' && command.subject) {
          handleCreateNote(command.subject);
          return { type: 'notes', data: { category: undefined } };
        }
        if (command.action === 'search' || command.action === 'list') {
          return { type: 'notes', data: { category: command.subject } };
        }
        break;

      case 'quiz':
        if (command.action === 'start' && command.subject) {
          return { type: 'quiz', data: { name: command.subject } };
        }
        break;

      case 'educational':
        if (command.action === 'wikipedia' && command.query) {
          openWikipedia(command.query);
          return null;
        }
        break;

      case 'snippet':
        if (command.action === 'create' || command.action === 'search') {
          return { type: 'snippets', data: { language: command.subject } };
        }
        break;

      case 'todo':
        if (command.action === 'create' && command.subject) {
          handleCreateTodo(command.subject);
          return { type: 'todos' };
        }
        if (command.action === 'list' || command.action === 'search') {
          return { type: 'todos' };
        }
        break;

      case 'commit':
        if (command.subject) {
          const commitMsg = generateCommitMessage(
            command.subject,
            command.action as any || 'feat'
          );
          return { type: 'commit', data: { message: commitMsg.fullMessage } };
        }
        break;

      case 'docs':
        if (command.action && command.query) {
          openDocumentation(command.action, command.query);
          return null;
        }
        break;
    }

    return null;
  };

  // ============================================
  // HANDLERS DE ACCIONES
  // ============================================

  const openWikipedia = (query: string) => {
    const wikiUrl = `https://es.wikipedia.org/wiki/${encodeURIComponent(query)}`;
    window.open(wikiUrl, '_blank');
    resetAndHide();
  };

  const openDocumentation = (action: string, query: string) => {
    const urls: Record<string, string> = {
      mdn: `https://developer.mozilla.org/es/search?q=${encodeURIComponent(query)}`,
      stackoverflow: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
      github: `https://github.com/search?q=${encodeURIComponent(query)}`,
      npm: `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`
    };

    const url = urls[action];
    if (url) {
      window.open(url, '_blank');
      resetAndHide();
    }
  };

  const handleCreateFlashcard = async (command: any) => {
    if (!window.api?.setConfig || !window.api?.getConfig || !command.query) return;

    const parts = command.query.split(/es|:/).map((p: string) => p.trim());
    if (parts.length < 2) return;

    const question = parts[0];
    const answer = parts.slice(1).join(' ');
    const category = command.subject || 'general';
    
    const newCard = createFlashcard(question, answer, category);
    const config = await window.api.getConfig();
    const flashcards = config.flashcards?.list || [];
    await window.api.setConfig('flashcards', 'list', [...flashcards, newCard]);
  };

  const handleCreateNote = async (title: string) => {
    if (!window.api?.setConfig || !window.api?.getConfig) return;

    const config = await window.api.getConfig();
    const notes: Note[] = config.notes || [];
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content: '',
      category: 'general',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await window.api.setConfig('notes', 'list', [...notes, newNote]);
  };

  const handleCreateTodo = async (title: string) => {
    if (!window.api?.setConfig || !window.api?.getConfig) return;

    const config = await window.api.getConfig();
    const todos: Todo[] = config.todos || [];
    const newTodo = createTodo(title);
    await window.api.setConfig('todos', 'list', [...todos, newTodo]);
  };

  const handleLaunch = useCallback((app: App) => {
    if (!window.api) return;

    const command = parseCommand(searchQuery);
    
    // Manejar comandos de gestión de ventanas
    if (command.type === 'window_management' && command.action && window.api.send) {
      window.api.send('window-action', { action: command.action, target: command.target });
      resetAndHide();
      return;
    }

    // Manejar búsqueda web
    if (command.type === 'search' && command.query) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(command.query)}`;
      window.open(searchUrl, '_blank');
      resetAndHide();
      return;
    }

    // Lanzar aplicación normal
    window.api.send('launch', app);
    
    // Actualizar historial
    setLaunchHistory(prev => [{
      id: app.id,
      timestamp: Date.now(),
      appName: app.name
    }, ...prev].slice(0, 100));
    
    resetAndHide();
  }, [searchQuery, setLaunchHistory]);

  const resetAndHide = () => {
    setSearchQuery('');
    window.api?.send('hide-window');
  };

  // ============================================
  // MANEJO DE TECLADO
  // ============================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredApps.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        handleEnterKey();
        break;

      case 'Escape':
        window.api?.send('hide-window');
        break;
    }
  }, [filteredApps.length, viewState]);

  const handleEnterKey = () => {
    // Calculadora
    if (viewState.type === 'calc') {
      copyToClipboard(String(viewState.data.result));
      resetAndHide();
      return;
    }

    // Commit message
    if (viewState.type === 'commit' && viewState.data?.message) {
      copyToClipboard(viewState.data.message);
      resetAndHide();
      return;
    }

    // Lanzar app
    if (filteredApps[selectedIndex]) {
      handleLaunch(filteredApps[selectedIndex]);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const shouldShowContentArea = isLoading || 
    viewState.type !== 'empty' || 
    searchQuery.trim();

  return (
    <div className="app-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <SearchBar
        ref={searchInputRef}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar aplicaciones..."
      />
      
      {/* Sugerencias sin búsqueda */}
      {!searchQuery.trim() && suggestions.length > 0 && !isLoading && (
        <SmartSuggestions suggestions={suggestions} onSelect={handleLaunch} />
      )}
      
      {/* Área de contenido */}
      {shouldShowContentArea && (
        <div className="content-area" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <LoadingState />
          ) : (
            <ContentRenderer
              viewState={viewState}
              searchQuery={searchQuery}
              filteredApps={filteredApps}
              selectedIndex={selectedIndex}
              copied={copied}
              suggestions={suggestions}
              onLaunch={handleLaunch}
              onCopySnippet={copyToClipboard}
              onCloseView={() => setSearchQuery('')}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

const LoadingState = () => (
  <div className="loading">Escaneando aplicaciones...</div>
);

interface ContentRendererProps {
  viewState: ViewState;
  searchQuery: string;
  filteredApps: App[];
  selectedIndex: number;
  copied: boolean;
  suggestions: App[];
  onLaunch: (app: App) => void;
  onCopySnippet: (code: string) => void;
  onCloseView: () => void;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  viewState,
  searchQuery,
  filteredApps,
  selectedIndex,
  copied,
  suggestions,
  onLaunch,
  onCopySnippet,
  onCloseView
}) => {
  switch (viewState.type) {
    case 'calc':
      return (
        <CalcResult 
          result={viewState.data.result} 
          expression={viewState.data.expression}
          copied={copied}
        />
      );

    case 'pomodoro':
      return (
        <div style={{ padding: '1rem' }}>
          <PomodoroTimerComponent />
        </div>
      );

    case 'flashcards':
      return (
        <FlashcardStudy
          category={viewState.data?.category}
          onClose={onCloseView}
        />
      );

    case 'notes':
      return (
        <NotesList
          query={searchQuery}
          category={viewState.data?.category}
          onSelect={(note) => console.log('Note selected:', note)}
        />
      );

    case 'quiz':
      return (
        <QuizStudy
          quizId={viewState.data?.id}
          quizName={viewState.data?.name}
          onClose={onCloseView}
        />
      );

    case 'snippets':
      return (
        <SnippetsList
          query={searchQuery}
          language={viewState.data?.language}
          onSelect={(snippet) => {
            onCopySnippet(snippet.code);
            onCloseView();
            window.api?.send('hide-window');
          }}
        />
      );

    case 'todos':
      return (
        <TodoList
          query={searchQuery}
          onSelect={() => {}}
        />
      );

    case 'commit':
      return (
        <div className="commit-result">
          <div className="commit-message">{viewState.data?.message}</div>
          <div className="commit-hint">Presiona Enter para copiar</div>
          {copied && (
            <div className="commit-copied">✓ Copiado al portapapeles</div>
          )}
        </div>
      );

    case 'apps':
      if (searchQuery.trim() && filteredApps.length > 0) {
        return (
          <ResultsList
            apps={filteredApps}
            selectedIndex={selectedIndex}
            onSelect={onLaunch}
            query={searchQuery}
          />
        );
      }
      return null;

    case 'empty':
      if (!searchQuery.trim() && filteredApps.length === 0 && suggestions.length === 0) {
        return (
          <div className="empty-state">
            <p>Escribe para buscar aplicaciones</p>
            <p className="hint">Presiona Ctrl+Alt+Space para mostrar/ocultar</p>
            <p className="hint">
              Ejemplos: "calcula 25*4", "iniciar pomodoro", "todo: revisar código", "mdn: array map"
            </p>
          </div>
        );
      }
      return null;

    default:
      return null;
  }
};

export default App;