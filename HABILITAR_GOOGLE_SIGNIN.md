# 🔐 Habilitar Google Sign-In en Firebase

Esta guía te ayudará a configurar Google Sign-In en tu proyecto Firebase.

## 📋 Pasos para Habilitar Google Sign-In

### 1. Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **launcher-19cfe**

### 2. Habilitar Google como Proveedor de Autenticación

1. En el menú lateral, haz clic en **Authentication** (Autenticación)
2. Si es la primera vez, haz clic en **Get Started** (Comenzar)
3. Ve a la pestaña **Sign-in method** (Métodos de inicio de sesión)
4. Haz clic en **Google** en la lista de proveedores

### 3. Configurar Google Sign-In

1. **Activa el toggle** para habilitar Google
2. **Selecciona un email de soporte** del proyecto (puede ser tu email)
3. Haz clic en **Save** (Guardar)

### 4. Configurar Dominios Autorizados (Importante)

Para que la autenticación funcione, necesitas agregar los dominios autorizados:

1. En **Authentication**, ve a **Settings** (Configuración)
2. Desplázate hasta **Authorized domains** (Dominios autorizados)
3. Agrega estos dominios si no están:
   - `localhost` (ya debería estar)
   - `launcher-19cfe.firebaseapp.com`
   - Tu dominio de producción (si lo tienes)

### 5. Verificar Configuración de la App Web

1. Ve a **Project Settings** (Configuración del proyecto) ⚙️
2. Desplázate hasta **Your apps** (Tus aplicaciones)
3. Verifica que tu app web tenga:
   - ✅ API Key configurada
   - ✅ Auth Domain correcto: `launcher-19cfe.firebaseapp.com`

## ✅ Verificación

Después de configurar, verifica que:

1. ✅ Google Sign-In está **Habilitado** en Authentication
2. ✅ El email de soporte está configurado
3. ✅ `localhost` está en los dominios autorizados
4. ✅ Las variables de entorno en `.env` están correctas

## 🧪 Probar la Autenticación

1. Reinicia el servidor: `npm run dev`
2. Abre la aplicación
3. Haz clic en el botón de configuración ⚙️
4. Ve a la pestaña "Cuenta"
5. Haz clic en **"Continuar con Google"**
6. Deberías ver la ventana de Google para seleccionar tu cuenta

## 🚨 Problemas Comunes

### Error: "Popup blocked"
- **Solución**: Permite popups para `localhost` en tu navegador

### Error: "Unauthorized domain"
- **Solución**: Verifica que `localhost` esté en los dominios autorizados en Firebase Console

### Error: "Google Sign-In no disponible"
- **Solución**: Verifica que Google esté habilitado en Authentication > Sign-in method

### El botón no hace nada
- **Solución**: 
  1. Verifica que las variables de entorno estén configuradas
  2. Reinicia el servidor
  3. Abre la consola del navegador (F12) para ver errores

## 📚 Más Información

- [Documentación oficial de Firebase Auth](https://firebase.google.com/docs/auth/web/google-signin)
- [Troubleshooting Firebase Auth](https://firebase.google.com/docs/auth/web/troubleshooting)

## 💡 Nota Importante

Google Sign-In funciona tanto para **iniciar sesión** como para **registrarse**. Si el usuario no existe, Firebase crea automáticamente la cuenta. No necesitas un botón separado para registro con Google.

