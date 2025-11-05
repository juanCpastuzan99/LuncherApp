import React, { useState, useEffect } from 'react';
import type { App } from '@shared/types';
import { useAppStore } from '../store/useAppStore';
import './ResultsList.css';

interface ResultsListProps {
  apps: App[];
  activeIndex: number;
  isLoading: boolean;
  onLaunch: (app: App) => void;
}

// Función para obtener nombre corto
function getShortName(app: App): string {
  if (app.name && app.name.length < 50) {
    return app.name;
  }
  
  if (app.path.length > 60) {
    const pathParts = app.path.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    return fileName.replace(/\.(lnk|exe|appref-ms)$/i, '');
  }
  
  const parts = app.path.split(/[/\\]/);
  if (parts.length > 3) {
    return '...' + parts.slice(-3).join('\\');
  }
  
  return app.path;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  apps,
  activeIndex,
  isLoading,
  onLaunch
}) => {
  const { favorites, addFavorite, removeFavorite } = useAppStore();
  const [iconCache, setIconCache] = useState<Map<string, string>>(new Map());
  
  // Cargar iconos para las aplicaciones visibles
  useEffect(() => {
    if (apps.length === 0) return;
    
    let cancelled = false;
    
    const loadIcons = async () => {
      const newCache = new Map(iconCache);
      let hasNewIcons = false;
      
      // Cargar iconos para las primeras 30 aplicaciones (las más visibles)
      const appsToLoad = apps.slice(0, 30);
      
      // Cargar iconos en paralelo
      const loadPromises = appsToLoad.map(async (app) => {
        if (cancelled) return;
        
        const cacheKey = `${app.path}-${app.type}`;
        
        // Si ya está en cache, saltar
        if (newCache.has(cacheKey)) return;
        
        try {
          const iconDataUrl = await window.api.getAppIcon(app.path, app.type);
          if (!cancelled && iconDataUrl && iconDataUrl.startsWith('data:image')) {
            newCache.set(cacheKey, iconDataUrl);
            hasNewIcons = true;
          }
        } catch (error) {
          // Silenciar errores - simplemente no mostrar icono
          console.debug(`Icono no disponible para ${app.name}`);
        }
      });
      
      // Esperar a que todos los iconos se carguen
      await Promise.allSettled(loadPromises);
      
      if (!cancelled && hasNewIcons) {
        setIconCache(newCache);
      }
    };
    
    loadIcons();
    
    return () => {
      cancelled = true;
    };
  }, [apps, iconCache]);
  
  const handleContextMenu = async (e: React.MouseEvent, app: App) => {
    e.preventDefault();
    const isFavorite = favorites.includes(app.id);
    const action = isFavorite ? 
      `¿Eliminar "${app.name}" de favoritos?` : 
      `¿Agregar "${app.name}" a favoritos?`;
    
    if (confirm(action)) {
      if (isFavorite) {
        await window.api.removeFavorite(app.id);
        removeFavorite(app.id);
      } else {
        await window.api.addFavorite(app.id);
        addFavorite(app.id);
      }
    }
  };
  
  // No mostrar nada si está cargando o no hay resultados
  if (isLoading || apps.length === 0) {
    return <ul className="results"></ul>;
  }
  
  return (
    <ul className="results">
      {apps.map((app, idx) => {
        const cacheKey = `${app.path}-${app.type}`;
        const iconUrl = iconCache.get(cacheKey);
        const shortName = getShortName(app);
        
        return (
          <li
            key={app.id}
            className={`item ${idx === activeIndex ? 'active' : ''}`}
            tabIndex={0}
            onClick={() => onLaunch(app)}
            onContextMenu={(e) => handleContextMenu(e, app)}
          >
            {iconUrl ? (
              <img src={iconUrl} className="app-icon" alt="" />
            ) : (
              <div className="app-icon-placeholder">📱</div>
            )}
            <div className="item-content">
              <div className="name">{shortName}</div>
              {app.path.length > 60 && (
                <div className="path">{app.path.substring(0, 60)}...</div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

