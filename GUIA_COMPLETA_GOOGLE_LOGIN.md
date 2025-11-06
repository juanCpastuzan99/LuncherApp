# 🔐 Guía Completa: Configurar Login con Google

Esta guía te llevará paso a paso para habilitar el login con Google en tu aplicación.

## 📋 Requisitos Previos

✅ El archivo `.env` está configurado con las credenciales de Firebase
✅ El servidor se ha reiniciado después de configurar `.env`
✅ Tienes acceso a Firebase Console

## 🚀 Paso 1: Habilitar Google en Firebase Console

### 1.1 Acceder a Firebase Console

1. Abre tu navegador y ve a:
   ```
   https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
   ```

2. Si no estás autenticado, inicia sesión con tu cuenta de Google

### 1.2 Habilitar Google como Proveedor

1. En la página de **Authentication**, haz clic en la pestaña **Sign-in method**
2. En la lista de proveedores, busca **Google** y haz clic en él
3. En la ventana que se abre:
   - **Activa el toggle** "Enable" (arriba a la derecha)
   - **Selecciona un email de soporte** del proyecto (puede ser tu email)
   - Este email se usa para comunicaciones de Firebase sobre autenticación
4. Haz clic en **Save** (Guardar)

### 1.3 Verificar Dominios Autorizados

1. En la misma página de **Authentication**, haz clic en **Settings** (Configuración)
2. Desplázate hasta la sección **Authorized domains** (Dominios autorizados)
3. Verifica que estos dominios estén en la lista:
   - ✅ `localhost` (debe estar por defecto)
   - ✅ `launcher-19cfe.firebaseapp.com` (debe estar por defecto)
4. Si `localhost` no está:
   - Haz clic en **Add domain**
   - Escribe: `localhost`
   - Haz clic en **Add**

## 🔍 Paso 2: Verificar Configuración de la App Web

1. Ve a **Project Settings** (⚙️ en el menú lateral)
2. Desplázate hasta **Your apps** (Tus aplicaciones)
3. Encuentra tu app web (o créala si no existe):
   - Si no tienes una app web, haz clic en el ícono `</>` (Web)
   - Dale un nombre a tu app (ej: "Launcher App")
   - Registra la app
4. Verifica que la configuración tenga:
   - ✅ **API Key**: Debe ser una cadena larga que empiece con `AIzaSy...`
   - ✅ **Auth Domain**: `launcher-19cfe.firebaseapp.com`
   - ✅ **Project ID**: `launcher-19cfe`

## 🧪 Paso 3: Probar el Login

### 3.1 Reiniciar el Servidor

1. **Detén el servidor** si está corriendo (Ctrl+C)
2. **Reinicia el servidor**:
   ```powershell
   npm run dev
   ```

### 3.2 Probar en la Aplicación

1. Abre la aplicación
2. Haz clic en el botón de configuración ⚙️ (en la barra de búsqueda)
3. Ve a la pestaña **"Cuenta"**
4. Deberías ver el botón **"Continuar con Google"**
5. Haz clic en el botón
6. Deberías ver:
   - Una ventana emergente de Google para seleccionar tu cuenta
   - O una redirección a la página de Google (dependiendo del navegador)

### 3.3 Verificar en la Consola

Abre la consola del navegador (F12) y busca estos mensajes:

✅ **Si todo está bien:**
```
🔵 Iniciando autenticación con Google...
   Auth Domain: launcher-19cfe.firebaseapp.com
✅ Autenticación con Google exitosa: { uid: "...", email: "...", ... }
✅ Usuario autenticado: tu-email@gmail.com
```

❌ **Si hay errores:**
```
❌ Error al autenticar con Google: [mensaje de error]
```

## 🚨 Solución de Problemas

### Error: "Popup blocked"

**Causa:** El navegador bloqueó la ventana emergente.

**Solución:**
1. Busca el icono de popup bloqueado en la barra de direcciones
2. Haz clic y permite popups para `localhost`
3. Intenta de nuevo

### Error: "Unauthorized domain"

**Causa:** El dominio no está autorizado en Firebase.

**Solución:**
1. Ve a Firebase Console > Authentication > Settings
2. Verifica que `localhost` esté en "Authorized domains"
3. Si no está, agrégalo y guarda

### Error: "Google Sign-In no disponible"

**Causa:** Google no está habilitado como proveedor.

**Solución:**
1. Ve a Firebase Console > Authentication > Sign-in method
2. Verifica que Google esté **Habilitado** (toggle activado)
3. Guarda los cambios

### El botón no hace nada

**Causa:** Firebase no está inicializado correctamente.

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca mensajes de error
3. Verifica que las variables de entorno estén cargadas:
   ```javascript
   console.log(import.meta.env.VITE_FIREBASE_API_KEY);
   console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
   ```
4. Si son `undefined`, reinicia el servidor

### Error: "Firebase Auth no está configurado"

**Causa:** Las variables de entorno no se están cargando.

**Solución:**
1. Verifica que el archivo `.env` existe en `parcial/.env`
2. Verifica que tiene las variables correctas (sin comillas, sin espacios)
3. **Reinicia el servidor** (muy importante)
4. Verifica en la consola que las variables se carguen

## ✅ Verificación Final

Después de configurar, deberías poder:

1. ✅ Ver el botón "Continuar con Google" en la pantalla de autenticación
2. ✅ Hacer clic y ver la ventana de Google
3. ✅ Seleccionar tu cuenta y autenticarte
4. ✅ Ver tu información de usuario en la pantalla de configuración
5. ✅ Ver "Sincronización activa" cuando estés autenticado

## 📚 Enlaces Útiles

- **Firebase Console**: https://console.firebase.google.com/project/launcher-19cfe
- **Authentication Providers**: https://console.firebase.google.com/project/launcher-19cfe/authentication/providers
- **Project Settings**: https://console.firebase.google.com/project/launcher-19cfe/settings/general
- **Documentación Firebase Auth**: https://firebase.google.com/docs/auth/web/google-signin

## 💡 Notas Importantes

1. **Google Sign-In funciona para login Y registro**: Si el usuario no existe, Firebase crea la cuenta automáticamente.

2. **No necesitas un botón separado para registro**: El mismo botón funciona para ambos casos.

3. **El servidor debe reiniciarse**: Después de cualquier cambio en `.env` o en Firebase Console, reinicia el servidor.

4. **Permite popups**: Asegúrate de que tu navegador permita popups para `localhost`.

## 🎉 ¡Listo!

Una vez completados estos pasos, el login con Google debería funcionar perfectamente. Si encuentras algún problema, revisa la sección de "Solución de Problemas" arriba.

