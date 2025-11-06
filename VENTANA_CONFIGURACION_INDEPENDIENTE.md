# 🪟 Ventana de Configuración Independiente

## ✅ Cambios Implementados

### 1. Ventana Independiente de Electron

Se creó una ventana independiente de Electron para la configuración con las siguientes características:

- ✅ **Ventana redimensionable** (900x700px por defecto, mínimo 600x500px)
- ✅ **Barra de título completa** con controles de Windows (minimizar, maximizar, cerrar)
- ✅ **Independiente de la ventana principal** - puede abrirse sin afectar el launcher
- ✅ **Navegación cómoda** - diseño optimizado para una ventana completa

### 2. Manejo de Errores de Autenticación Mejorado

Se mejoró el manejo del error `auth/internal-error`:

- ✅ **Mensajes de error más claros** que indican qué hacer
- ✅ **Detección específica** del error `auth/internal-error`
- ✅ **Guía para solucionar** el problema (habilitar Google en Firebase Console)

### 3. Verificación de Variables de Entorno

Se agregaron herramientas para verificar que las variables de entorno se carguen correctamente:

- ✅ **Función `verifyFirebaseEnv()`** para verificar variables
- ✅ **Función `printEnvReport()`** para mostrar reporte detallado
- ✅ **Script PowerShell** `verificar-variables-env.ps1` para verificar desde terminal

## 🚀 Cómo Usar

### Abrir Ventana de Configuración

1. Haz clic en el botón ⚙️ en la barra de búsqueda
2. Se abrirá una ventana independiente de configuración
3. La ventana tiene:
   - Barra de título con controles de Windows
   - Opción de minimizar, maximizar y cerrar
   - Tamaño cómodo para navegar

### Cerrar la Ventana

- Haz clic en el botón × en la esquina superior derecha
- O presiona Alt+F4
- O usa el botón de cerrar de la barra de título de Windows

## 🔧 Características Técnicas

### Ventana de Electron

```javascript
settingsWindow = new BrowserWindow({
  width: 900,
  height: 700,
  minWidth: 600,
  minHeight: 500,
  frame: true,           // Barra de título visible
  resizable: true,       // Redimensionable
  maximizable: true,     // Puede maximizarse
  minimizable: true,     // Puede minimizarse
  closable: true         // Puede cerrarse
});
```

### Detección de Ventana Independiente

El componente `SettingsWindow` detecta automáticamente si está en una ventana independiente:

```typescript
const isStandaloneWindow = window.location.hash === '#settings';
```

### IPC Handlers

- `open-settings-window`: Abre la ventana de configuración
- `close-settings-window`: Cierra la ventana de configuración

## 🐛 Solución de Problemas

### Error: "auth/internal-error"

Este error generalmente significa que:

1. **Google Sign-In no está habilitado** en Firebase Console
   - Solución: Ve a Firebase Console > Authentication > Sign-in method > Habilita Google

2. **Dominios no autorizados**
   - Solución: Verifica que `localhost` esté en los dominios autorizados

3. **Variables de entorno no cargadas**
   - Solución: Reinicia el servidor después de modificar `.env`

### La Ventana No Se Abre

1. Verifica que el servidor esté corriendo
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que `window.api.openSettingsWindow` esté disponible

### La Ventana Se Abre pero Está Vacía

1. Verifica que el hash `#settings` esté en la URL
2. Verifica que React esté cargando correctamente
3. Abre la consola para ver errores de JavaScript

## 📚 Archivos Modificados

- `src/main.js` - Agregado handler IPC y función para crear ventana
- `src/preload.js` - Agregados métodos `openSettingsWindow` y `closeSettingsWindow`
- `src/renderer/App.tsx` - Modificado para usar ventana independiente
- `src/renderer/components/SettingsWindow.tsx` - Agregado soporte para ventana standalone
- `src/renderer/components/SettingsWindow.css` - Agregados estilos para ventana standalone
- `src/firebase/auth.ts` - Mejorado manejo de errores, especialmente `auth/internal-error`
- `src/firebase/config.ts` - Agregada verificación de variables de entorno
- `src/firebase/env-check.ts` - Nueva utilidad para verificar variables

## 🎯 Próximos Pasos

1. **Habilitar Google Sign-In en Firebase Console**
   - Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
   - Habilita Google como proveedor

2. **Reiniciar el servidor**
   ```powershell
   npm run dev
   ```

3. **Probar la ventana de configuración**
   - Haz clic en el botón ⚙️
   - Verifica que se abra la ventana independiente
   - Prueba el login con Google

## 💡 Notas

- La ventana independiente es más cómoda para configuraciones extensas
- Puedes tener la ventana de configuración abierta mientras usas el launcher
- La ventana se puede redimensionar según tus necesidades

