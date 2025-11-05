/**
 * Store de Zustand para gestión de estado global
 * Maneja: aplicaciones, búsqueda, favoritos, configuración
 */

import { create } from 'zustand';
import type { App, AppConfig, LaunchHistoryItem } from '@shared/types';
import { intelligentSearch } from '../../ai/fuzzySearch';
import { getSmartSuggestions } from '../../ai/smartSuggestions';

interface AppState {
  // Estado de aplicaciones
  apps: App[];
  filteredApps: App[];
  searchQuery: string;
  activeIndex: number;
  isLoading: boolean;
  
  // Configuración
  config: AppConfig | null;
  favorites: string[];
  launchHistory: LaunchHistoryItem[];
  smartSuggestions: Array<{ app: App; reason: string; confidence: number }>;
  
  // Acciones
  setApps: (apps: App[]) => void;
  setSearchQuery: (query: string) => void;
  setFilteredApps: (apps: App[]) => void;
  setActiveIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: AppConfig) => void;
  setFavorites: (favorites: string[]) => void;
  setLaunchHistory: (history: LaunchHistoryItem[]) => void;
  addFavorite: (appId: string) => void;
  removeFavorite: (appId: string) => void;
  
  // Helpers
  filterApps: (query: string) => App[];
  moveActive: (delta: number) => void;
}

function simpleScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800;
  if (t.includes(q)) return 500;
  const parts = q.split(/\s+/);
  let sum = 0;
  for (const p of parts) {
    if (t.includes(p)) sum += 120;
  }
  return sum;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
      // Estado inicial
      apps: [],
      filteredApps: [],
      searchQuery: '',
      activeIndex: 0,
      isLoading: true,
      config: null,
      favorites: [],
      launchHistory: [],
      smartSuggestions: [],
      
      // Acciones
      setApps: (apps) => {
        // Priorizar favoritos
        const { favorites, isLoading } = get();
        const favoriteApps = favorites
          .map(favId => apps.find(a => a.id === favId))
          .filter(Boolean) as App[];
        const otherApps = apps.filter(a => !favorites.includes(a.id));
        const sortedApps = [...favoriteApps, ...otherApps];
        
        set({ apps: sortedApps });
        // Solo filtrar si no está cargando (para evitar mostrar resultados durante escaneo)
        if (!isLoading) {
          get().filterApps(get().searchQuery);
        }
      },
      
      setSearchQuery: (query) => {
        // Solo actualizar el query, no filtrar inmediatamente
        // El filtrado se hará con debounce en el componente
        set({ searchQuery: query, activeIndex: 0 });
      },
      
      setFilteredApps: (apps) => {
        const maxResults = get().config?.ui?.maxResults || 50;
        const sliced = apps.slice(0, maxResults);
        // Zustand hace shallow comparison, así que solo actualizar si es diferente
        set({ filteredApps: sliced });
      },
      
      setActiveIndex: (index) => {
        const { filteredApps } = get();
        if (filteredApps.length === 0) return;
        const newIndex = (index + filteredApps.length) % filteredApps.length;
        set({ activeIndex: newIndex });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setConfig: (config) => set({ config }),
      
      setFavorites: (favorites) => set({ favorites }),
      
      setLaunchHistory: (history) => {
        set({ launchHistory: history });
        // Actualizar sugerencias cuando cambia el historial
        if (!get().searchQuery) {
          get().filterApps('');
        }
      },
      
      addFavorite: (appId) => {
        const { favorites } = get();
        if (!favorites.includes(appId)) {
          set({ favorites: [...favorites, appId] });
        }
      },
      
      removeFavorite: (appId) => {
        const { favorites } = get();
        set({ favorites: favorites.filter(id => id !== appId) });
      },
      
      // Helpers
      filterApps: (query) => {
        const { apps, config, launchHistory, favorites, isLoading } = get();
        
        // No actualizar resultados si está cargando (durante escaneo)
        if (isLoading) {
          return [];
        }
        
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) {
          // Mostrar sugerencias inteligentes cuando no hay query
          const smartSuggestions = getSmartSuggestions(
            apps,
            launchHistory || [],
            favorites || []
          );
          
          const maxResults = config?.ui?.maxResults || 50;
          // Si hay sugerencias, usarlas; si no, apps normales
          const filtered = smartSuggestions.length > 0
            ? smartSuggestions.map(s => s.app).slice(0, maxResults)
            : apps.slice(0, maxResults);
          
          // Actualizar ambos estados en una sola operación para evitar parpadeo
          set({ 
            smartSuggestions,
            filteredApps: filtered
          });
          return filtered;
        }
        
        // Usar búsqueda inteligente mejorada
        const searchResults = intelligentSearch(trimmedQuery, apps, {
          maxResults: config?.ui?.maxResults || 50,
          fuzzyThreshold: 0.3
        });
        
        const filtered = searchResults.map(r => r.app);
        
        // Actualizar ambos estados en una sola operación para evitar parpadeo
        set({ 
          smartSuggestions: [],
          filteredApps: filtered
        });
        return filtered;
      },
      
      moveActive: (delta) => {
        const { filteredApps, activeIndex } = get();
        if (filteredApps.length === 0) return;
        const newIndex = (activeIndex + delta + filteredApps.length) % filteredApps.length;
        set({ activeIndex: newIndex });
      }
    })
);

