# 🔧 Solución: Error Interno de Firebase con Google Sign-In

Este error (`auth/internal-error`) generalmente ocurre cuando Google Sign-In no está correctamente configurado en Firebase Console.

## ✅ Solución Rápida (5 minutos)

### Paso 1: Habilitar Google Sign-In en Firebase Console

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
   ```

2. **Habilita Google:**
   - Haz clic en **"Google"** en la lista de proveedores
   - **Activa el toggle** "Enable" (arriba a la derecha)
   - **Selecciona un email de soporte** (puede ser tu email)
   - Haz clic en **"Save"** (Guardar)

3. **Espera 10-30 segundos** para que los cambios se propaguen

### Paso 2: Verificar Dominios Autorizados

1. En Firebase Console, ve a: **Authentication > Settings**
2. Desplázate hasta **"Authorized domains"**
3. Verifica que estos dominios estén en la lista:
   - ✅ `localhost`
   - ✅ `launcher-19cfe.firebaseapp.com`
4. Si `localhost` NO está:
   - Haz clic en **"Add domain"**
   - Escribe: `localhost`
   - Haz clic en **"Add"**

### Paso 3: Reiniciar el Servidor

**MUY IMPORTANTE:** Después de hacer cambios en Firebase Console, siempre reinicia el servidor:

```powershell
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

### Paso 4: Probar Nuevamente

1. Abre la aplicación
2. Ve a Configuración > Cuenta
3. Haz clic en **"Continuar con Google"**
4. Deberías ver la ventana de Google para seleccionar tu cuenta

## 🔍 Verificación Detallada

### Verificar que Google está Habilitado

1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
2. Busca **"Google"** en la lista
3. Debe mostrar: **"Enabled"** (Habilitado) con un check verde ✅
4. Si muestra **"Disabled"** (Deshabilitado), haz clic y habilítalo

### Verificar Variables de Entorno

Abre la consola del navegador (F12) y verifica que veas:

```
✅ Firebase inicializado correctamente
   Proyecto: launcher-19cfe
   Auth Domain: launcher-19cfe.firebaseapp.com
```

Si ves errores sobre variables de entorno:
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que las variables NO tienen comillas
3. Reinicia el servidor

### Verificar Dominios Autorizados

1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
2. En **"Authorized domains"**, debe estar:
   - `localhost` ✅
   - `launcher-19cfe.firebaseapp.com` ✅

## 🚨 Si el Error Persiste

### Solución 1: Deshabilitar y Rehabilitar Google

1. Ve a Firebase Console > Authentication > Sign-in method
2. Haz clic en **"Google"**
3. **Desactiva** el toggle "Enable"
4. Haz clic en **"Save"**
5. Espera 10 segundos
6. Vuelve a **activar** el toggle "Enable"
7. Haz clic en **"Save"**
8. Reinicia el servidor

### Solución 2: Verificar Configuración de OAuth

1. Ve a: https://console.cloud.google.com
2. Selecciona tu proyecto: **launcher-19cfe**
3. Ve a: **APIs & Services > Credentials**
4. Busca un **"OAuth 2.0 Client ID"** para tu app web
5. Si NO existe, Firebase debería haberlo creado automáticamente
6. Si hay problemas, puedes crear uno manualmente:
   - Tipo: "Web application"
   - Authorized JavaScript origins: `http://localhost:5174`
   - Authorized redirect URIs: `http://localhost:5174`

### Solución 3: Verificar Proyecto Correcto

1. Verifica que el `PROJECT_ID` en `.env` sea correcto:
   ```
   VITE_FIREBASE_PROJECT_ID=launcher-19cfe
   ```
2. Verifica que el `AUTH_DOMAIN` sea correcto:
   ```
   VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
   ```

### Solución 4: Limpiar Cache y Reintentar

1. Cierra completamente la aplicación Electron
2. Limpia la caché del navegador (si estás usando Electron con DevTools)
3. Reinicia el servidor
4. Intenta de nuevo

## 📝 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Google Sign-In está **Habilitado** en Firebase Console
- [ ] El email de soporte está configurado
- [ ] `localhost` está en **Authorized domains**
- [ ] Las variables de entorno en `.env` están correctas (sin comillas)
- [ ] El servidor se reinició después de modificar `.env`
- [ ] El servidor se reinició después de habilitar Google en Firebase Console
- [ ] No hay errores en la consola del navegador (F12)
- [ ] El proyecto de Firebase es el correcto (`launcher-19cfe`)

## 🆘 Si Nada Funciona

1. **Ejecuta el script de diagnóstico:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "diagnosticar-google-signin.ps1"
   ```

2. **Abre la consola del navegador (F12)** y copia todos los errores

3. **Verifica los logs en la terminal** donde corre `npm run dev`

4. **Comparte:**
   - Los errores de la consola del navegador
   - Los errores de la terminal
   - Una captura de pantalla de Firebase Console > Authentication > Sign-in method mostrando Google

## 📚 Enlaces Útiles

- **Firebase Console:** https://console.firebase.google.com/project/launcher-19cfe
- **Authentication Settings:** https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
- **Sign-in Methods:** https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=launcher-19cfe

## 💡 Nota Importante

**Después de cualquier cambio en Firebase Console, SIEMPRE reinicia el servidor de desarrollo.** Los cambios en Firebase Console pueden tardar unos segundos en propagarse, pero el código de tu aplicación necesita reiniciarse para detectar los cambios.

