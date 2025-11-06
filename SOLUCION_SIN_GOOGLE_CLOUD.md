# 🔧 Solución: Usar Firebase sin acceder a Google Cloud Console

## 💡 Aclaración Importante

**Firebase ES parte de Google Cloud Platform** (son el mismo servicio):
- ✅ Acceder a Google Cloud Console es **GRATIS**
- ✅ No requiere tarjeta de crédito
- ✅ Usa el mismo login que Firebase Console
- ✅ Cuando habilitas Google Sign-In en Firebase, automáticamente crea un OAuth Client ID

**Pero si prefieres NO acceder a Google Cloud Console**, aquí tienes alternativas:

## 🔄 Opción 1: Usar el Puerto 80 (localhost sin puerto)

El OAuth Client ID que Firebase crea automáticamente suele incluir `http://localhost` (puerto 80).

### Cambiar el puerto del servidor

1. **Modifica `vite.config.ts`:**
   ```typescript
   server: {
     port: 80,  // Cambiar de 5174 a 80
     // ...
   }
   ```

2. **O usa el puerto 3000** (más común):
   ```typescript
   server: {
     port: 3000,  // Cambiar de 5174 a 3000
     // ...
   }
   ```

3. **Actualiza `package.json`:**
   ```json
   "dev": "set NODE_ENV=development&& concurrently -k -s first \"vite --port 80\" \"wait-on http://localhost:80 && electron .\""
   ```

4. **Reinicia el servidor**

### ⚠️ Nota sobre el puerto 80

- En Windows, el puerto 80 puede requerir permisos de administrador
- Si no funciona, usa el puerto 3000 o 8080

## 🔄 Opción 2: Usar el OAuth Client ID Predeterminado

Firebase crea automáticamente un OAuth Client ID cuando habilitas Google Sign-In. Este puede funcionar sin configuración adicional si:

1. ✅ Google Sign-In está habilitado en Firebase Console
2. ✅ `localhost` está en Authorized domains
3. ✅ Usas el puerto que Firebase configuró por defecto (generalmente 80 o sin puerto)

### Verificar si funciona

1. **Intenta iniciar sesión con Google**
2. **Si funciona** → No necesitas hacer nada más
3. **Si NO funciona** → Necesitas agregar el puerto en Google Cloud Console

## 🔄 Opción 3: Acceder a Google Cloud Console (Recomendado)

Esta es la solución más confiable:

### ¿Por qué necesitas Google Cloud Console?

Cuando habilitas Google Sign-In en Firebase, Firebase automáticamente crea un OAuth Client ID en Google Cloud Console. Pero este OAuth Client ID puede no incluir `localhost:5174` en los orígenes autorizados.

### Acceso GRATIS

- **Google Cloud Console** es el panel de administración de Firebase
- Es **GRATIS** acceder (no requiere pago)
- Usa el **mismo login** que Firebase Console
- No necesitas tarjeta de crédito

### Pasos Rápidos

1. Ve a: https://console.cloud.google.com
2. Inicia sesión con la misma cuenta que usas en Firebase Console
3. Selecciona el proyecto: `launcher-19cfe`
4. Ve a: **APIs & Services** > **Credentials**
5. Busca "OAuth 2.0 Client IDs"
6. Haz clic en el OAuth Client ID (el que Firebase creó automáticamente)
7. Agrega `http://localhost:5174` en:
   - Authorized JavaScript origins
   - Authorized redirect URIs
8. Guarda

## 🔄 Opción 4: Usar Firebase Hosting (Para Producción)

Si estás desplegando la app, puedes usar Firebase Hosting:

1. Configura Firebase Hosting
2. Despliega la app
3. Firebase automáticamente configura los dominios correctos

## ✅ Verificación Rápida

Después de elegir una opción:

- [ ] Google Sign-In habilitado en Firebase Console
- [ ] `localhost` en Authorized domains
- [ ] Servidor reiniciado
- [ ] Intenta iniciar sesión con Google

## 💡 Recomendación

**La opción más fácil es usar el puerto 80 o 3000** (opción 1), ya que Firebase suele configurarlos automáticamente. Si prefieres mantener el puerto 5174, entonces necesitas acceder a Google Cloud Console (opción 3), pero recuerda que es **GRATIS** y usa el mismo login que Firebase.

## 🚨 Si Nada Funciona

Si ninguna opción funciona, verifica:

1. Variables de entorno correctas en `.env`
2. Servidor reiniciado después de cambios
3. Google Sign-In habilitado en Firebase Console
4. `localhost` en Authorized domains
5. Consola del navegador (F12) para ver errores específicos

