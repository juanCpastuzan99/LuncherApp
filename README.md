# Win11 Dev Launcher

Un launcher de aplicaciones para Windows 11 con funciones avanzadas de gestión de ventanas inspiradas en Hyprland. Perfecto para desarrolladores que quieren mejorar su productividad.

## ✨ Características

- 🚀 **Launcher rápido**: Busca y abre aplicaciones instaladas instantáneamente
- 📱 **Detección completa**: Encuentra aplicaciones desde Menú de Inicio, Microsoft Store, y registro de Windows
- 🪟 **Window Management estilo Hyprland**: Organiza ventanas automáticamente
- ⌨️ **Hotkeys personalizables**: Atajos de teclado para todas las funciones
- 🎨 **Interfaz moderna**: Diseño oscuro con efecto acrílico tipo Windows 11
- 🔧 **Configurable**: Personaliza hotkeys, temas y comportamiento

## 📦 Instalación

### 🚀 Instalación Rápida desde GitHub (Un Solo Comando)

**Opción 1: Con winget (Recomendado para Windows 11/10)**

Instala automáticamente Node.js con winget y luego la aplicación:

```powershell
# PowerShell (Windows) - Un solo comando con winget
irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-with-winget.ps1 | iex
```

**Opción 2: Instalación directa desde GitHub**

Si ya tienes Node.js instalado:

```powershell
# PowerShell (Windows) - Un solo comando
irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1 | iex
```

O si prefieres descargar el script primero:

```powershell
# Descargar y ejecutar
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-with-winget.ps1" -OutFile install.ps1
.\install.ps1
```

Estos scripts:
- ✅ Instalan Node.js automáticamente (con winget) si no está instalado
- ✅ Descargar automáticamente el código desde GitHub
- ✅ Instalan todas las dependencias
- ✅ Instalan la aplicación globalmente
- ✅ Todo en un solo comando

### Opción 1: Instalación Global (Recomendado)

Si ya tienes el código localmente:

```bash
npm install -g .
```

O desde npm (si está publicado):

```bash
npm install -g win11-dev-launcher
```

Después de la instalación, puedes ejecutar la aplicación desde cualquier lugar con:

```bash
win11-launcher
```

o

```bash
win-launcher
```

### Opción 2: Instalación Local

```bash
npm install
npm start
```

### Opción 3: Instalación desde Git

```bash
git clone <tu-repo>
cd win11-dev-launcher
npm install
npm start
```

## 🚀 Uso

### Launcher de Aplicaciones

1. Presiona `Alt + Space` para abrir el launcher
2. Escribe el nombre de la aplicación que buscas
3. Usa las flechas ↑↓ para navegar
4. Presiona `Enter` para abrir o `Esc` para cerrar

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
git clone <repo-url>
cd win11-dev-launcher

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Crear instalador
npm run build-installer
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

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🙏 Agradecimientos

- Inspirado en [Hyprland](https://hyprland.org/) - Compositor de ventanas para Linux
- Construido con [Electron](https://www.electronjs.org/)

---

**Hecho con ❤️ para desarrolladores de Windows**

# LuncherApp
