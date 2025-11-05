# Win11 Dev Launcher

Un launcher de aplicaciones para Windows 11 con funciones avanzadas de gestión de ventanas inspiradas en Hyprland y **inteligencia artificial integrada**. Perfecto para desarrolladores que quieren mejorar su productividad.

## ✨ Características

- 🚀 **Launcher rápido**: Busca y abre aplicaciones instaladas instantáneamente
- 📱 **Detección completa**: Encuentra aplicaciones desde Menú de Inicio, Microsoft Store, y registro de Windows
- 🤖 **Búsqueda Inteligente con IA**: Corrección automática de errores tipográficos y búsqueda por sinónimos
- 💡 **Sugerencias Inteligentes**: Predice aplicaciones basándose en tu historial y patrones de uso
- 🗣️ **Comandos de Lenguaje Natural**: Ejecuta acciones hablando en español ("calcula 2+2", "organiza ventanas")
- 🪟 **Window Management estilo Hyprland**: Organiza ventanas automáticamente
- ⌨️ **Hotkeys personalizables**: Atajos de teclado para todas las funciones
- 🎨 **Interfaz moderna**: Diseño oscuro con efecto acrílico tipo Windows 11
- 🔧 **Configurable**: Personaliza hotkeys, temas y comportamiento

## 📦 Instalación

### Opción 1: Instalación desde Git (Recomendado)

```bash
git clone https://github.com/juanCpastuzan99/LuncherApp.git
cd LuncherApp/parcial
npm install
npm start
```

### Opción 2: Instalación Global

Si ya tienes el código clonado:

```bash
cd LuncherApp/parcial
npm install -g .
```

Después de la instalación, puedes ejecutar la aplicación desde cualquier lugar con:

```bash
win11-launcher
```

o

```bash
win-launcher
```

### Opción 3: Instalación Local (Desarrollo)

```bash
git clone https://github.com/juanCpastuzan99/LuncherApp.git
cd LuncherApp/parcial
npm install
npm run dev
```

## 🚀 Uso

### Launcher de Aplicaciones

1. Presiona `Alt + Space` para abrir el launcher
2. Escribe el nombre de la aplicación que buscas (o usa comandos de lenguaje natural)
3. Usa las flechas ↑↓ para navegar
4. Presiona `Enter` para abrir o ejecutar, `Esc` para cerrar

### 🧠 Funciones de IA

#### Búsqueda Inteligente
- **Corrección de errores**: Escribe "visul studio" → encuentra "Visual Studio Code"
- **Búsqueda por sinónimos**: Escribe "editor" → encuentra todos los editores de código
- **Fuzzy matching**: Encuentra aplicaciones aunque no recuerdes el nombre exacto

#### Sugerencias Inteligentes
- Abre el launcher sin escribir nada → Ve sugerencias basadas en:
  - Tu historial de uso
  - Hora del día
  - Aplicaciones frecuentemente usadas juntas
  - Patrones de uso

#### Comandos de Lenguaje Natural

**Calculadora:**
```
calcula 25 * 4
2 + 2
10% de 200
```

**Gestión de Ventanas:**
```
organiza ventanas
maximiza ventana
centra ventana
mueve ventana izquierda
workspace siguiente
```

**Búsqueda Web:**
```
buscar en google: electron tutorial
search: react hooks
```

**Lanzamiento:**
```
abre chrome
open visual studio code
```

### Window Management

#### Organización de Ventanas

- **`Ctrl + Alt + T`** - Organizar todas las ventanas en grid
- **`Ctrl + Alt + Shift + T`** - Organizar verticalmente
- **`Ctrl + Alt + H`** - Organizar horizontalmente

#### Movimiento de Ventanas

- **`Ctrl + Alt + Left`** - Mover ventana a la izquierda (o cambiar workspace si está en el borde)
- **`Ctrl + Alt + Right`** - Mover ventana a la derecha (o cambiar workspace si está en el borde)
- **`Ctrl + Alt + C`** - Centrar ventana activa

#### Maximizar/Minimizar

- **`Ctrl + Alt + Up`** - Maximizar ventana
- **`Ctrl + Alt + Down`** - Minimizar ventana

## 🔧 Configuración

La configuración se guarda en:
- Windows: `%APPDATA%\win11-dev-launcher\config.json`

Puedes editar este archivo para personalizar:
- Hotkeys
- Patrones de exclusión
- Tema
- Transparencia

### Ejemplo de configuración

```json
{
  "hotkey": "Alt+Space",
  "theme": "dark",
  "transparency": true,
  "excludePatterns": ["uninstall", "help", "documentation"],
  "windowHotkeys": {
    "tileGrid": "Ctrl+Alt+T",
    "tileVertical": "Ctrl+Alt+Shift+T",
    "tileHorizontal": "Ctrl+Alt+H",
    "moveLeft": "Ctrl+Alt+Left",
    "moveRight": "Ctrl+Alt+Right",
    "center": "Ctrl+Alt+C",
    "maximize": "Ctrl+Alt+Up",
    "minimize": "Ctrl+Alt+Down"
  }
}
```

## 📋 Requisitos

- Windows 10/11
- Node.js 16 o superior
- PowerShell (incluido en Windows)

## 🛠️ Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/juanCpastuzan99/LuncherApp.git
cd LuncherApp/parcial

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
# o
npm run dev

# Crear instalador
npm run build-installer
```

### Estructura del Proyecto

```
parcial/
├── src/
│   ├── ai/                    # Funciones de IA
│   │   ├── fuzzySearch.ts     # Búsqueda inteligente
│   │   ├── smartSuggestions.ts # Sugerencias inteligentes
│   │   └── commandParser.ts   # Parser de comandos
│   ├── main/                  # Proceso principal (Electron)
│   ├── preload/               # Preload scripts
│   ├── renderer/               # Interfaz React
│   │   ├── components/        # Componentes React
│   │   └── store/             # Estado global (Zustand)
│   └── shared/                # Tipos compartidos
└── package.json
```

## 📦 Crear Instalador Windows

Para crear un instalador `.exe` para distribución:

```bash
npm run build-installer
```

El instalador se generará en la carpeta `dist/`.

## 🎯 Funcionalidades Avanzadas

### Window Management

El sistema incluye funciones avanzadas de gestión de ventanas:

- **Tiling Automático**: Organiza ventanas en diferentes layouts
- **Split Screen**: Divide la pantalla entre dos aplicaciones
- **Workspaces**: Integración con Virtual Desktops de Windows
- **Centrado Inteligente**: Centra ventanas automáticamente

Ver [WINDOW_MANAGEMENT.md](WINDOW_MANAGEMENT.md) para más detalles.

### Inteligencia Artificial

El launcher incluye funciones de IA implementadas localmente (sin necesidad de API externa):

- **Búsqueda Semántica**: Entiende sinónimos y contexto
- **Corrección de Errores**: Algoritmo de Levenshtein para typos
- **Análisis de Patrones**: Aprende de tus hábitos de uso
- **Comandos Naturales**: Procesamiento de lenguaje natural básico

Ver [IMPLEMENTACION_IA_COMPLETADA.md](IMPLEMENTACION_IA_COMPLETADA.md) para más detalles sobre las funciones de IA.

## 🐛 Solución de Problemas

### La aplicación no se inicia después de instalar globalmente

1. Asegúrate de que Node.js esté en tu PATH
2. Verifica que Electron esté instalado: `npm list -g electron`
3. Si no está, instálalo: `npm install -g electron`

### Los hotkeys no funcionan

- Algunos hotkeys pueden estar en conflicto con otras aplicaciones
- Prueba cambiarlos en la configuración
- Nota: Electron no puede interceptar la tecla `Win` directamente

### No encuentra aplicaciones instaladas

- El escaneo puede tardar unos segundos al iniciar
- Verifica que PowerShell esté disponible
- Revisa la consola para ver mensajes de error

## 📝 Notas

- Los hotkeys funcionan globalmente, incluso cuando la app está en segundo plano
- La aplicación se ejecuta en segundo plano después de iniciar
- El primer escaneo de aplicaciones puede tardar varios segundos

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Este proyecto usa Git Flow:

1. Fork el proyecto
2. Crea una feature branch desde `develop`:
   ```bash
   git flow feature start nombre-feature
   ```
3. Realiza tus cambios y haz commit
4. Finaliza la feature:
   ```bash
   git flow feature finish nombre-feature
   ```
5. Push a `develop` y abre un Pull Request

**Ramas:**
- `main`: Producción (solo releases)
- `develop`: Desarrollo (integración continua)
- `feature/*`: Nuevas características
- `bugfix/*`: Correcciones de bugs
- `release/*`: Preparación de releases

## 🙏 Agradecimientos

- Inspirado en [Hyprland](https://hyprland.org/) - Compositor de ventanas para Linux
- Construido con [Electron](https://www.electronjs.org/)

## 📚 Documentación Adicional

- [IMPLEMENTACION_IA_COMPLETADA.md](IMPLEMENTACION_IA_COMPLETADA.md) - Documentación de funciones de IA
- [WINDOW_MANAGEMENT.md](WINDOW_MANAGEMENT.md) - Guía de gestión de ventanas
- [DIAGRAMA_UML.md](DIAGRAMA_UML.md) - Diagrama de arquitectura

## 📝 Changelog

### Versión Actual (Develop)

**Nuevas Funciones:**
- ✅ Búsqueda inteligente con corrección de errores
- ✅ Sugerencias basadas en patrones de uso
- ✅ Comandos de lenguaje natural
- ✅ Calculadora integrada
- ✅ Optimizaciones de rendimiento (debouncing, reducción de re-renders)

**Mejoras:**
- 🚀 Búsqueda más rápida con debouncing
- 🎨 UI mejorada con transiciones suaves
- 🔧 Mejor manejo de estados durante escaneo

---

**Hecho con ❤️ para desarrolladores de Windows**

**Repositorio:** https://github.com/juanCpastuzan99/LuncherApp
