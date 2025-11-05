# Diagrama UML de Componentes - Win11 Dev Launcher

## Arquitectura del Sistema

Este documento describe la arquitectura del frontend (React) y su relación con el proceso Main de Electron.

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                        │
│                    (Node.js + TypeScript)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │   Main Process   │      │  Window Manager   │             │
│  │   (main.ts)      │◄─────►│  (windowManager) │             │
│  └────────┬─────────┘      └──────────────────┘             │
│           │                                                  │
│           │ IPC                                              │
│           │                                                  │
│  ┌────────▼─────────┐      ┌──────────────────┐             │
│  │  Config Manager  │      │  App Scanner     │             │
│  │  (config.js)     │      │  (scanUWPApps)   │             │
│  │                  │      │  (scanRegistry)  │             │
│  │ - Favorites      │      └──────────────────┘             │
│  │ - History        │                                        │
│  │ - Settings       │                                        │
│  └──────────────────┘                                        │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ Context Bridge (Preload)
            │
┌───────────▼──────────────────────────────────────────────────┐
│              PRELOAD SCRIPT (preload.ts)                      │
│              Tipado con TypeScript                            │
│              Seguridad IPC                                    │
└───────────┬──────────────────────────────────────────────────┘
            │
            │ window.api (exposed)
            │
┌───────────▼──────────────────────────────────────────────────┐
│                    RENDERER PROCESS                           │
│                    (React + TypeScript)                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              STATE MANAGEMENT (Zustand)               │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │         useAppStore                          │    │   │
│  │  │  - apps: App[]                              │    │   │
│  │  │  - filteredApps: App[]                      │    │   │
│  │  │  - searchQuery: string                       │    │   │
│  │  │  - favorites: string[]                       │    │   │
│  │  │  - config: AppConfig                         │    │   │
│  │  │  - isLoading: boolean                         │    │   │
│  │  │  - launchHistory: LaunchHistoryItem[]         │    │   │
│  │  │  - smartSuggestions: Suggestion[]            │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MÓDULOS DE IA (TypeScript)              │   │
│  │                                                        │   │
│  │  ┌─────────────────┐  ┌──────────────────┐         │   │
│  │  │ fuzzySearch.ts  │  │smartSuggestions  │         │   │
│  │  │                 │  │      .ts         │         │   │
│  │  │ - intelligent   │  │                  │         │   │
│  │  │   Search()      │  │ - analyzeUsage   │         │   │
│  │  │ - similarity()  │  │   Patterns()     │         │   │
│  │  │ - getSuggestions│  │ - getSmart()     │         │   │
│  │  └─────────────────┘  └──────────────────┘         │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │      commandParser.ts                        │    │   │
│  │  │  - parseCommand()                            │    │   │
│  │  │  - evaluateMath()                            │    │   │
│  │  │  - formatCalcResult()                        │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              COMPONENTES REACT                        │   │
│  │                                                        │   │
│  │  ┌──────────────┐    ┌──────────────┐                │   │
│  │  │   Launcher   │    │  SearchBar  │                │   │
│  │  │              │◄───┤              │                │   │
│  │  │ - useAppStore│    │ - Input      │                │   │
│  │  │ - IPC calls  │    │ - Settings   │                │   │
│  │  └──────┬───────┘    └──────────────┘                │   │
│  │         │                                            │   │
│  │         │                                            │   │
│  │  ┌──────▼───────┐    ┌──────────────┐                │   │
│  │  │ ResultsList  │    │   Footer     │                │   │
│  │  │              │    │              │                │   │
│  │  │ - Render apps│    │ - Help text  │                │   │
│  │  │ - ContextMenu│    └──────────────┘                │   │
│  │  │ - Selection  │                                    │   │
│  │  └──────────────┘                                    │   │
│  │         │                                            │   │
│  │  ┌──────▼──────────┐  ┌──────────────────────┐     │   │
│  │  │ CalcResult      │  │ SmartSuggestions     │     │   │
│  │  │ (IA - Cálculos) │  │ (IA - Sugerencias)   │     │   │
│  │  └─────────────────┘  └──────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Inicialización
```
Main Process → scanAllApps() → AppIndex[]
             → IPC: 'apps-updated' → Renderer
             → useAppStore.setApps() → State
```

### 2. Búsqueda
```
User Input → SearchBar → useAppStore.setSearchQuery()
          → useAppStore.filterApps() → filteredApps[]
          → ResultsList render
```

### 3. Lanzamiento de Aplicación
```
User Click → ResultsList → window.api.launch()
          → IPC: 'launch' → Main Process
          → launchItem() → shell.openPath()
          → configManager.addLaunchHistory()
```

### 4. Configuración
```
User Click Settings → window.api.openSettings()
                  → IPC: 'open-settings' → Main
                  → createSettingsWindow() → Settings Window
```

### 5. Comandos de IA (Cálculos)
```
User Input "calcula 2+2" → commandParser.parseCommand()
                       → evaluateMath() → CalcResult render
                       → Resultado mostrado
```

### 6. Sugerencias Inteligentes
```
Launcher Open (sin query) → getSmartSuggestions()
                        → analyzeUsagePatterns()
                        → SmartSuggestions render
                        → Sugerencias basadas en historial
```

## Tipos TypeScript (Shared)

```
src/shared/types.ts
├── App
├── AppConfig
├── UIConfig
├── HotkeysConfig
├── ScanConfig
├── WindowManagementConfig
└── IPCChannel (tipos de IPC)
```

## Persistencia de Datos

```
┌─────────────────────┐
│   electron-store    │
│   (configManager)   │
├─────────────────────┤
│ - Favorites         │
│ - Search History    │
│ - Launch History    │
│ - UI Preferences    │
│ - Hotkeys           │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   UserData Folder   │
│   win11-launcher-   │
│   config.json       │
└─────────────────────┘
```

## Seguridad IPC

1. **Preload Script**: Bridge seguro entre Main y Renderer
2. **Context Isolation**: Activado (contextIsolation: true)
3. **Node Integration**: Desactivado (nodeIntegration: false)
4. **TypeScript**: Tipado estricto en toda la comunicación IPC

## Componentes React

### Launcher (Componente Principal)
- **Props**: Ninguna (usa store)
- **Estado**: Global (Zustand)
- **Responsabilidades**:
  - Orquestar componentes hijos
  - Manejar eventos de teclado
  - Inicializar carga de datos

### SearchBar
- **Props**: `query`, `onQueryChange`
- **Estado**: Local (query)
- **Responsabilidades**:
  - Capturar input del usuario
  - Abrir configuración

### ResultsList
- **Props**: `apps`, `activeIndex`, `isLoading`, `onLaunch`
- **Estado**: Derivado del store
- **Responsabilidades**:
  - Renderizar lista de aplicaciones
  - Manejar selección
  - Context menu (favoritos)

### Footer
- **Props**: Ninguna
- **Estado**: Ninguno
- **Responsabilidades**:
  - Mostrar ayuda al usuario

### CalcResult (Componente de IA)
- **Props**: `query: string`, `result: string`
- **Estado**: Ninguno (presentacional)
- **Responsabilidades**:
  - Mostrar resultados de cálculos
  - Interfaz visual para comandos de cálculo

### SmartSuggestions (Componente de IA)
- **Props**: `suggestions`, `activeIndex`, `onSelect`
- **Estado**: Derivado del store
- **Responsabilidades**:
  - Mostrar sugerencias inteligentes
  - Mostrar razón de la sugerencia
  - Indicador de confianza

## State Management (Zustand)

```typescript
useAppStore {
  // Estado
  apps: App[]
  filteredApps: App[]
  searchQuery: string
  activeIndex: number
  favorites: string[]
  config: AppConfig
  
  // Acciones
  setApps()
  setSearchQuery()
  filterApps()
  addFavorite()
  removeFavorite()
}
```

## Comunicación IPC Tipada

Todos los canales IPC están tipados en `src/shared/types.ts`:

```typescript
interface IPCChannel {
  'get-apps': () => Promise<App[]>;
  'launch': (path: string, type?: AppType) => Promise<void>;
  'get-config': () => Promise<AppConfig>;
  // ... más canales
}
```

## Relación Main ↔ Renderer

```
Main Process (Node.js)
    │
    │ IPC (ipcMain.handle)
    │
    ▼
Preload (Bridge) [preload.ts]
    │
    │ contextBridge.exposeInMainWorld('api')
    │ Tipado con TypeScript
    │
    ▼
Renderer (React)
    │
    │ window.api.* (API tipada)
    │
    ▼
useAppStore (Zustand)
    │
    │ filterApps()
    │
    ├──► intelligentSearch() [fuzzySearch.ts]
    ├──► getSmartSuggestions() [smartSuggestions.ts]
    └──► parseCommand() [commandParser.ts]
```

## Flujo Completo con IA

```
Usuario escribe "visul studio"
    │
    ▼
SearchBar.tsx → setSearchQuery()
    │
    ▼
useAppStore.filterApps()
    │
    ▼
fuzzySearch.intelligentSearch()
    ├──► Corrección de errores (Levenshtein)
    ├──► Búsqueda por sinónimos
    └──► Fuzzy matching
    │
    ▼
ResultsList.tsx → Muestra "Visual Studio Code"
```

```
Usuario abre launcher (sin escribir)
    │
    ▼
Launcher.tsx → filterApps('')
    │
    ▼
smartSuggestions.getSmartSuggestions()
    ├──► analyzeUsagePatterns()
    ├──► Considera hora del día
    └──► Analiza historial
    │
    ▼
SmartSuggestions.tsx → Muestra sugerencias
```

```
Usuario escribe "calcula 25*4"
    │
    ▼
commandParser.parseCommand()
    │
    ▼
commandParser.evaluateMath()
    │
    ▼
CalcResult.tsx → Muestra "100"
```

## Módulos de Inteligencia Artificial

```
src/ai/
├── fuzzySearch.ts          # Búsqueda inteligente con fuzzy matching
│   ├── intelligentSearch() # Búsqueda con corrección de errores
│   ├── getSearchSuggestions() # Sugerencias de búsqueda
│   └── similarityScore()   # Algoritmo de similitud
├── smartSuggestions.ts     # Sugerencias basadas en patrones
│   ├── analyzeUsagePatterns() # Análisis de historial
│   ├── getSmartSuggestions() # Sugerencias contextuales
│   └── getTimeBasedSuggestions() # Sugerencias por hora
└── commandParser.ts        # Parser de comandos naturales
    ├── parseCommand()      # Detección de comandos
    ├── evaluateMath()      # Evaluación de expresiones
    └── formatCalcResult()  # Formateo de resultados
```

## Relación con Componentes React

```
Launcher.tsx
├── Usa: fuzzySearch.intelligentSearch()
├── Usa: smartSuggestions.getSmartSuggestions()
├── Usa: commandParser.parseCommand()
├── Renderiza: CalcResult (cuando hay cálculo)
└── Renderiza: SmartSuggestions (cuando no hay query)

SearchBar.tsx
└── Input → trigger → intelligentSearch()

ResultsList.tsx
└── Muestra resultados de intelligentSearch()
```

## Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Build Tool**: Vite + electron-vite
- **Backend**: Electron (Main Process)
- **Persistencia**: electron-store v8.2.0
- **Tipado**: TypeScript (strict mode)
- **IPC**: Tipado con interfaces compartidas
- **IA**: Módulos locales (sin dependencias externas)
  - Fuzzy matching
  - Análisis de patrones
  - Procesamiento de lenguaje natural básico

