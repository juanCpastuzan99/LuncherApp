/**
 * Store de Zustand para gestión de estado global
 * Maneja: aplicaciones, búsqueda, favoritos, configuración
 */

import { create } from 'zustand';
import type { App, AppConfig } from '@shared/types';

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
  
  // Acciones
  setApps: (apps: App[]) => void;
  setSearchQuery: (query: string) => void;
  setFilteredApps: (apps: App[]) => void;
  setActiveIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: AppConfig) => void;
  setFavorites: (favorites: string[]) => void;
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
      
      // Acciones
      setApps: (apps) => {
        // Priorizar favoritos
        const { favorites } = get();
        const favoriteApps = favorites
          .map(favId => apps.find(a => a.id === favId))
          .filter(Boolean) as App[];
        const otherApps = apps.filter(a => !favorites.includes(a.id));
        const sortedApps = [...favoriteApps, ...otherApps];
        
        set({ apps: sortedApps });
        get().filterApps(get().searchQuery);
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query, activeIndex: 0 });
        get().filterApps(query);
      },
      
      setFilteredApps: (apps) => {
        const maxResults = get().config?.ui?.maxResults || 50;
        set({ filteredApps: apps.slice(0, maxResults) });
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
        const { apps, config } = get();
        if (!query) {
          const maxResults = config?.ui?.maxResults || 50;
          const filtered = apps.slice(0, maxResults);
          get().setFilteredApps(filtered);
          return filtered;
        }
        
        const withScore = apps.map((a) => ({
          ...a,
          score: Math.max(
            simpleScore(query, a.name),
            simpleScore(query, a.path)
          )
        }));
        
        const filtered = withScore
          .filter((a) => a.score > 0)
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
        
        get().setFilteredApps(filtered);
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

