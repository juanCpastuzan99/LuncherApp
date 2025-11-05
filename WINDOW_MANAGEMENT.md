# Window Management estilo Hyprland para Windows

Este launcher incluye funciones avanzadas de gestión de ventanas inspiradas en Hyprland, el compositor de ventanas para Linux.

## 🎹 Hotkeys Disponibles

### Organización de Ventanas (Tiling)

- **`Ctrl + Alt + T`** - Organizar todas las ventanas visibles en grid (mosaico)
- **`Ctrl + Alt + Shift + T`** - Organizar ventanas verticalmente (una columna)
- **`Ctrl + Alt + H`** - Organizar ventanas horizontalmente (una fila)

### Movimiento de Ventanas

- **`Ctrl + Alt + Left`** - Mover ventana activa al lado izquierdo (50% pantalla) / Workspace anterior
- **`Ctrl + Alt + Right`** - Mover ventana activa al lado derecho (50% pantalla) / Workspace siguiente
- **`Ctrl + Alt + C`** - Centrar ventana activa

### Maximizar/Minimizar

- **`Ctrl + Alt + Up`** - Maximizar ventana activa
- **`Ctrl + Alt + Down`** - Minimizar ventana activa

### Workspaces (Virtual Desktops)

- **`Ctrl + Alt + Right`** - Cambiar al workspace siguiente (mismo que mover a derecha)
- **`Ctrl + Alt + Left`** - Cambiar al workspace anterior (mismo que mover a izquierda)

> **Nota**: Los hotkeys usan `Ctrl+Alt` en lugar de `Win` porque Electron no puede interceptar la tecla Windows directamente. Puedes personalizar estos hotkeys en la configuración.

## 🔧 Funcionalidades

### Tiling (Organización automática)

El sistema puede organizar todas las ventanas visibles en diferentes layouts:
- **Grid**: Distribución en cuadrícula (similar a Hyprland)
- **Vertical**: Todas las ventanas en una columna
- **Horizontal**: Todas las ventanas en una fila

### Split Screen

Puedes dividir la pantalla rápidamente moviendo ventanas a los lados, ideal para trabajar con dos aplicaciones lado a lado.

### Workspaces

Integración con los Virtual Desktops nativos de Windows 10/11 para cambiar entre espacios de trabajo.

## ⚙️ Configuración

Los hotkeys se pueden personalizar en el archivo de configuración. El sistema guarda la configuración en:
- Windows: `%APPDATA%\win11-dev-launcher\config.json`

Puedes modificar los hotkeys en `config.windowHotkeys` dentro del archivo de configuración.

## 🚀 Uso

1. Abre varias ventanas en tu escritorio
2. Presiona `Ctrl + Alt + T` para organizarlas automáticamente en grid
3. Usa `Ctrl + Alt + Left/Right` para dividir la pantalla o cambiar workspaces
4. Centra ventanas con `Ctrl + Alt + C`

## 📝 Notas

- Los hotkeys funcionan globalmente, incluso cuando la aplicación está en segundo plano
- El sistema respeta el gap (espaciado) configurado entre ventanas
- Las ventanas se organizan automáticamente respetando el área de trabajo de Windows

## 🎯 Próximas Funcionalidades

- [ ] Floating windows (ventanas flotantes)
- [ ] Window rules (reglas por aplicación)
- [ ] Animaciones suaves
- [ ] Overlay de gestión de ventanas
- [ ] Scratchpad (terminal flotante)

