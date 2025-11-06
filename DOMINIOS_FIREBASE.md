# 🌐 Dominios para Firebase Console

## 📋 Dominios que debes agregar en Firebase Console

### Dominios esenciales:

1. **`localhost`** ⭐ (MÁS IMPORTANTE)
   - Es el dominio que usa tu aplicación durante el desarrollo
   - Sin este dominio, Google Sign-In no funcionará en desarrollo

2. **`127.0.0.1`** (Opcional pero recomendado)
   - Algunas configuraciones usan la IP en lugar del nombre
   - Agregarlo no hace daño y puede prevenir problemas

3. **`tu-proyecto.firebaseapp.com`** (Ya debería estar)
   - Este dominio se agrega automáticamente cuando creas el proyecto
   - Ejemplo: `launcher-19cfe.firebaseapp.com`

## 📝 Cómo agregar dominios en Firebase Console

### Paso 1: Ir a la configuración de Authentication

1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
2. O navega manualmente:
   - Firebase Console > Tu Proyecto > Authentication > Settings (Configuración)

### Paso 2: Agregar `localhost`

1. Desplázate hasta la sección **"Authorized domains"** (Dominios autorizados)
2. Haz clic en **"Add domain"** (Agregar dominio)
3. En el campo que aparece, escribe: `localhost`
4. Haz clic en **"Add"** (Agregar)
5. Verifica que `localhost` aparezca en la lista con un check verde ✅

### Paso 3: Agregar `127.0.0.1` (Opcional)

1. Haz clic nuevamente en **"Add domain"**
2. Escribe: `127.0.0.1`
3. Haz clic en **"Add"**

### Paso 4: Verificar la lista

La lista de dominios autorizados debería mostrar:

- ✅ `localhost` (si lo agregaste)
- ✅ `127.0.0.1` (si lo agregaste)
- ✅ `launcher-19cfe.firebaseapp.com` (automático)
- ✅ `launcher-19cfe.web.app` (automático, si aplica)

## 🔍 Verificación rápida

Después de agregar los dominios:

1. ✅ Verifica que `localhost` esté en la lista
2. ✅ Guarda cualquier cambio (si Firebase lo requiere)
3. ✅ **REINICIA el servidor** (`npm run dev`)
4. ✅ Prueba iniciar sesión con Google

## ⚠️ Notas importantes

- **NO agregues `http://localhost:5174`** - Solo agrega `localhost` (sin protocolo ni puerto)
- **NO agregues dominios de producción** a menos que estés desplegando la app
- **Reinicia el servidor** después de agregar dominios
- Los cambios en Firebase Console pueden tardar unos segundos en propagarse

## 🚨 Problemas comunes

### "El dominio ya existe"
- Si ves este mensaje, significa que el dominio ya está agregado
- No necesitas hacer nada más

### "No puedo agregar localhost"
- Asegúrate de escribir solo `localhost` (sin espacios, sin http://, sin puerto)
- Verifica que no haya un dominio similar ya agregado

### "Sigue sin funcionar después de agregar"
- **Reinicia el servidor** (esto es crítico)
- Espera 10-30 segundos después de agregar el dominio
- Verifica que Google Sign-In esté habilitado en Authentication > Sign-in method

## 📚 Enlaces directos

- **Authentication Settings:** https://console.firebase.google.com/project/launcher-19cfe/authentication/settings
- **Sign-in Methods:** https://console.firebase.google.com/project/launcher-19cfe/authentication/providers

