# 🚀 Instalación Rápida desde GitHub

Instala Win11 Dev Launcher con un solo comando directamente desde GitHub.

## Instalación en un Solo Comando

### Opción 1: Ejecutar Directamente (Recomendado)

Abre PowerShell y ejecuta:

```powershell
irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1 | iex
```

### Opción 2: Descargar y Ejecutar

Si prefieres ver el script antes de ejecutarlo:

```powershell
# Descargar el script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1" -OutFile install.ps1

# Revisar el script (opcional)
notepad install.ps1

# Ejecutar el script
.\install.ps1
```

## ¿Qué hace el script?

El script de instalación automáticamente:

1. ✅ Verifica que Node.js y npm estén instalados
2. ✅ Descarga el código desde GitHub (usando Git o descarga directa)
3. ✅ Instala todas las dependencias (`npm install`)
4. ✅ Instala la aplicación globalmente (`npm install -g`)
5. ✅ Limpia archivos temporales
6. ✅ Te indica cómo ejecutar la aplicación

## Requisitos Previos

Antes de ejecutar el script, asegúrate de tener:

- **Node.js** (versión 16 o superior)
  - Descarga desde: https://nodejs.org/
  - O instala con winget: `winget install OpenJS.NodeJS`
  
- **npm** (viene con Node.js)

- **PowerShell** (incluido en Windows 10/11)

- **Git** (opcional, pero recomendado)
  - Si no tienes Git, el script usará descarga directa

## Después de la Instalación

Una vez completada la instalación, puedes ejecutar la aplicación con:

```powershell
win11-launcher
```

O simplemente:

```powershell
win-launcher
```

La aplicación se ejecutará en segundo plano y responderá al hotkey `Ctrl+Space` (configurable).

## Solución de Problemas

### Error: "No se puede ejecutar scripts en este sistema"

Si PowerShell bloquea la ejecución de scripts:

```powershell
# Ejecutar como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Luego ejecuta el script de instalación nuevamente.

### Error: "Node.js no está instalado"

Instala Node.js desde https://nodejs.org/ o ejecuta:

```powershell
winget install OpenJS.NodeJS
```

### Error: "No se pudo clonar el repositorio"

El script intentará usar descarga directa (ZIP) como alternativa. Si ambos métodos fallan:

1. Descarga manualmente el código desde GitHub
2. Extrae los archivos
3. Navega a la carpeta y ejecuta: `npm install -g .`

### Error: "Permission denied" durante instalación global

Ejecuta PowerShell como administrador:

1. Clic derecho en PowerShell
2. Selecciona "Ejecutar como administrador"
3. Ejecuta el script nuevamente

## Instalación Manual

Si prefieres instalar manualmente:

```powershell
# Clonar repositorio
git clone https://github.com/juanCpastuzan99/easyappWin11.git
cd easyappWin11

# Instalar dependencias
npm install

# Instalar globalmente
npm install -g .
```

## Verificar Instalación

Para verificar que la instalación fue exitosa:

```powershell
# Verificar que el comando está disponible
where win11-launcher

# Verificar versión instalada
npm list -g win11-dev-launcher
```

## Desinstalar

Para desinstalar la aplicación:

```powershell
npm uninstall -g win11-dev-launcher
```

---

**¡Listo!** Ahora puedes usar `win11-launcher` desde cualquier terminal. 🎉

