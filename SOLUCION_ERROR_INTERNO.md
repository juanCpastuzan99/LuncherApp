# 🔧 Solución: Error Interno de Firebase (auth/internal-error)

Este error persiste incluso después de habilitar Google Sign-In. Sigue estos pasos en orden:

## ⚠️ Causas Comunes

1. **OAuth Client ID no configurado correctamente** en Google Cloud Console
2. **Dominio `localhost` no agregado** en Firebase Console
3. **Variables de entorno no coinciden** con el proyecto
4. **Servidor no reiniciado** después de cambios

## 📋 Solución Completa (Paso a Paso)

### PASO 1: Verificar OAuth en Google Cloud Console

Este es el paso más importante y frecuentemente olvidado:

1. **Abre Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=launcher-19cfe
   ```

2. **Busca "OAuth 2.0 Client IDs"**
   - Debe haber al menos uno para "Web application"
   - Si NO existe, Firebase debería crearlo automáticamente cuando habilitas Google Sign-In

3. **Haz clic en el OAuth Client ID** (si existe)

4. **Verifica "Authorized JavaScript origins":**
   - Debe incluir: `http://localhost:5174`
   - Si NO está, haz clic en "+ ADD URI" y agrégalo

5. **Verifica "Authorized redirect URIs":**
   - Debe incluir: `http://localhost:5174`
   - Si NO está, haz clic en "+ ADD URI" y agrégalo

6. **Guarda los cambios**

### PASO 2: Verificar Dominios en Firebase Console

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
   ```

2. **Desplázate hasta "Authorized domains"**

3. **Verifica que incluya:**
   - ✅ `localhost` (EXACTO, sin http://, sin puerto)
   - ✅ `127.0.0.1` (opcional pero recomendado)

4. **Si `localhost` NO está:**
   - Haz clic en "Add domain"
   - Escribe: `localhost` (solo el texto, nada más)
   - Haz clic en "Add"

### PASO 3: Deshabilitar y Rehabilitar Google Sign-In

A veces ayuda "refrescar" la configuración:

1. **Ve a:**
   ```
   https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
   ```

2. **Haz clic en "Google"**

3. **DESACTIVA el toggle "Enable"**

4. **Haz clic en "Save"**

5. **Espera 10 segundos**

6. **Vuelve a ACTIVAR el toggle "Enable"**

7. **Haz clic en "Save"**

### PASO 4: Verificar Variables de Entorno

1. **Abre el archivo `.env`** en la raíz del proyecto

2. **Verifica que tenga:**
   ```env
   VITE_FIREBASE_PROJECT_ID=launcher-19cfe
   VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
   VITE_FIREBASE_API_KEY=AIzaSy... (tu API Key)
   ```

3. **IMPORTANTE:** Las variables NO deben tener comillas:
   ```env
   # ❌ INCORRECTO:
   VITE_FIREBASE_PROJECT_ID="launcher-19cfe"
   
   # ✅ CORRECTO:
   VITE_FIREBASE_PROJECT_ID=launcher-19cfe
   ```

### PASO 5: Reiniciar el Servidor

**MUY IMPORTANTE:** Después de cualquier cambio en Firebase Console o Google Cloud Console:

1. **Detén el servidor** (Ctrl+C en la terminal)

2. **Reinicia:**
   ```powershell
   npm run dev
   ```

3. **Espera a que inicie completamente** (verás mensajes de Vite y Electron)

### PASO 6: Verificar en Consola del Navegador

1. **Abre la aplicación**

2. **Abre la consola del navegador** (F12)

3. **Busca estos mensajes:**
   ```
   ✅ Firebase inicializado correctamente
   ✅ Proyecto: launcher-19cfe
   ✅ Auth Domain: launcher-19cfe.firebaseapp.com
   ```

4. **Intenta iniciar sesión con Google**

5. **Si hay error, copia:**
   - El código de error completo
   - El mensaje de error
   - Cualquier mensaje adicional en la consola

## 🔍 Verificación Rápida

Después de seguir todos los pasos, verifica:

- [ ] Google Sign-In está habilitado en Firebase Console
- [ ] `localhost` está en Authorized domains en Firebase Console
- [ ] OAuth Client ID existe en Google Cloud Console
- [ ] `http://localhost:5174` está en Authorized JavaScript origins
- [ ] `http://localhost:5174` está en Authorized redirect URIs
- [ ] Variables de entorno en `.env` están correctas (sin comillas)
- [ ] El servidor se reinició después de los cambios

## 🚨 Si el Error Persiste

### Opción 1: Crear OAuth Client ID Manualmente

Si no existe un OAuth Client ID para tu app web:

1. Ve a: https://console.cloud.google.com/apis/credentials?project=launcher-19cfe
2. Haz clic en "+ CREATE CREDENTIALS"
3. Selecciona "OAuth client ID"
4. Si te pide configurar OAuth consent screen, hazlo
5. Application type: "Web application"
6. Name: "Launcher App Web"
7. Authorized JavaScript origins: `http://localhost:5174`
8. Authorized redirect URIs: `http://localhost:5174`
9. Haz clic en "CREATE"

### Opción 2: Verificar Proyecto Correcto

Asegúrate de que todas las configuraciones apunten al mismo proyecto:

- Firebase Console: `launcher-19cfe`
- Google Cloud Console: `launcher-19cfe`
- `.env` file: `VITE_FIREBASE_PROJECT_ID=launcher-19cfe`

### Opción 3: Limpiar Cache

1. Cierra completamente la aplicación Electron
2. Elimina la caché del navegador (si Electron usa caché)
3. Reinicia el servidor
4. Intenta de nuevo

## 📚 Enlaces Directos

- **Firebase Auth Settings:** https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
- **Firebase Sign-in Methods:** https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
- **Google Cloud Credentials:** https://console.cloud.google.com/apis/credentials?project=launcher-19cfe

## 💡 Nota Final

El error `auth/internal-error` es genérico y puede tener múltiples causas. El paso más común que falta es verificar/agregar los dominios y URIs en Google Cloud Console OAuth Client ID. Asegúrate de seguir TODOS los pasos en orden.

