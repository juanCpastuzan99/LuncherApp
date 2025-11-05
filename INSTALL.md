# Guía de Instalación - Win11 Dev Launcher

## 📦 Instalación desde Terminal

### Opción 1: Instalación Global (Recomendado)

La forma más fácil de instalar y usar el launcher es instalarlo globalmente con npm:

```bash
npm install -g win11-dev-launcher
```

Después de la instalación, puedes ejecutar la aplicación desde cualquier lugar con:

```bash
win11-launcher
```

o simplemente:

```bash
win-launcher
```

### Opción 2: Instalación Local (Desarrollo)

Si quieres desarrollar o modificar el código:

```bash
# Clonar o descargar el proyecto
cd win11-dev-launcher

# Instalar dependencias
npm install

# Ejecutar
npm start
```

### Opción 3: Instalación desde un Repositorio Git

Si tienes el proyecto en un repositorio Git:

```bash
git clone <url-del-repositorio>
cd win11-dev-launcher
npm install
npm start
```

## 🔧 Requisitos Previos

Antes de instalar, asegúrate de tener:

1. **Node.js** (versión 16 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación: `node --version`

2. **npm** (viene con Node.js)
   - Verifica: `npm --version`

3. **PowerShell** (incluido en Windows 10/11)

4. **Electron** (se instalará automáticamente con `npm install`)

## 📝 Pasos Detallados

### Instalación Global Paso a Paso

1. **Abre PowerShell o CMD como administrador** (opcional, pero recomendado)

2. **Navega a la carpeta del proyecto**:
   ```bash
   cd "C:\Users\admin\Documents\PARCIAL ELECTIVA PROFECIONAL"
   ```

3. **Instala globalmente**:
   ```bash
   npm install -g .
   ```

   O si estás en la raíz del proyecto:
   ```bash
   npm install -g win11-dev-launcher
   ```

4. **Verifica la instalación**:
   ```bash
   win11-launcher --version
   ```

5. **Ejecuta la aplicación**:
   ```bash
   win11-launcher
   ```

### Verificar la Instalación

Después de instalar, verifica que todo esté correcto:

```bash
# Verificar que el comando está disponible
where win11-launcher

# Verificar que Node.js puede encontrar el módulo
npm list -g win11-dev-launcher
```

## 🚀 Uso Después de la Instalación

Una vez instalado, la aplicación:

1. **Se ejecuta en segundo plano** automáticamente
2. **Responde al hotkey** `Alt+Space` para abrir el launcher
3. **Funciona globalmente** - los hotkeys funcionan desde cualquier aplicación

### Comandos Disponibles

- `win11-launcher` - Inicia la aplicación
- `win-launcher` - Alias para `win11-launcher`

### Detener la Aplicación

Para detener la aplicación que está corriendo en segundo plano:

1. Abre el Administrador de Tareas (`Ctrl+Shift+Esc`)
2. Busca "Win11 Dev Launcher" o "Electron"
3. Finaliza el proceso

O desde la terminal:

```bash
# En Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process
```

## 🔍 Solución de Problemas

### Error: "win11-launcher no se reconoce como comando"

**Solución:**
1. Verifica que npm esté en tu PATH
2. Reinicia la terminal después de instalar
3. Verifica la instalación: `npm list -g win11-dev-launcher`

### Error: "Cannot find module 'electron'"

**Solución:**
```bash
npm install -g electron
```

O reinstala las dependencias:
```bash
cd "C:\Users\admin\Documents\PARCIAL ELECTIVA PROFECIONAL"
npm install
```

### Error: "Permission denied" o "Access denied"

**Solución:**
1. Ejecuta PowerShell o CMD como administrador
2. O instala localmente sin `-g`:
   ```bash
   npm install
   npm start
   ```

### La aplicación no inicia

**Verifica:**
1. Que Node.js esté instalado: `node --version`
2. Que las dependencias estén instaladas: `npm install`
3. Revisa la consola para mensajes de error

## 📦 Crear Instalador Windows (.exe)

Para crear un instalador ejecutable que otros usuarios puedan instalar sin Node.js:

```bash
npm run build-installer
```

El instalador se generará en la carpeta `dist/` con el nombre:
- `Win11-Dev-Launcher-Setup-0.1.0-x64.exe`

## 🎯 Configuración Post-Instalación

Después de la primera ejecución, la configuración se guarda en:
- `%APPDATA%\win11-dev-launcher\config.json`

Puedes editar este archivo para personalizar:
- Hotkeys
- Tema
- Comportamiento

## 📚 Más Información

- Ver [README.md](README.md) para documentación completa
- Ver [WINDOW_MANAGEMENT.md](WINDOW_MANAGEMENT.md) para funciones de window management

---

**¡Listo!** Ahora puedes usar `win11-launcher` desde cualquier terminal. 🚀

