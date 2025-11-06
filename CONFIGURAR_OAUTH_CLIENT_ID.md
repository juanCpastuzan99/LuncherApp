# 🔧 Configurar OAuth Client ID en Google Cloud Console

## ⚠️ IMPORTANTE: Dos Configuraciones Diferentes

### 1️⃣ Firebase Console - Authorized Domains
- **Ubicación:** Firebase Console > Authentication > Settings > Authorized domains
- **Formato:** Solo nombre de dominio (SIN protocolo, SIN puerto)
- **Ejemplo:** `localhost` ✅
- **NO acepta:** `localhost:5174` ❌ o `http://localhost:5174` ❌

### 2️⃣ Google Cloud Console - OAuth Client ID
- **Ubicación:** Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs
- **Formato:** URL completa (CON protocolo, CON puerto)
- **Ejemplo:** `http://localhost:5174` ✅
- **Esto es lo que probablemente falta**

## 📋 Pasos para Configurar OAuth Client ID

### Paso 1: Abrir Google Cloud Console

Ve a:
```
https://console.cloud.google.com/apis/credentials?project=launcher-19cfe
```

O navega manualmente:
1. Ve a: https://console.cloud.google.com
2. Selecciona el proyecto: `launcher-19cfe`
3. Ve a: **APIs & Services** > **Credentials**

### Paso 2: Buscar OAuth 2.0 Client ID

1. En la lista de credenciales, busca **"OAuth 2.0 Client IDs"**
2. Debe haber al menos uno para **"Web application"**
3. Si **NO existe**, Firebase debería crearlo automáticamente cuando habilitas Google Sign-In
4. Si **NO existe**, puedes crearlo manualmente (ver más abajo)

### Paso 3: Abrir el OAuth Client ID

1. Haz clic en el **OAuth Client ID** (debe tener un nombre como "Web client (auto created by Google Service)" o similar)
2. Se abrirá una página con los detalles

### Paso 4: Agregar Authorized JavaScript Origins

1. Busca la sección **"Authorized JavaScript origins"**
2. Haz clic en **"+ ADD URI"** (o el botón similar)
3. En el campo que aparece, escribe:
   ```
   http://localhost:5174
   ```
   - **IMPORTANTE:** Con `http://` y con el puerto `:5174`
4. Haz clic en **"Add"** o presiona Enter

### Paso 5: Agregar Authorized Redirect URIs

1. Busca la sección **"Authorized redirect URIs"**
2. Haz clic en **"+ ADD URI"**
3. En el campo que aparece, escribe:
   ```
   http://localhost:5174
   ```
   - **IMPORTANTE:** Con `http://` y con el puerto `:5174`
4. Haz clic en **"Add"** o presiona Enter

### Paso 6: Guardar los Cambios

1. Haz clic en **"SAVE"** (o "Guardar") en la parte superior de la página
2. Espera a que se guarde (verás un mensaje de confirmación)

### Paso 7: Reiniciar el Servidor

**MUY IMPORTANTE:** Después de hacer cambios en Google Cloud Console:

1. Detén el servidor (Ctrl+C)
2. Reinicia:
   ```powershell
   npm run dev
   ```
3. Espera a que inicie completamente

## 🆘 Si NO Existe OAuth Client ID

Si no encuentras un OAuth Client ID para "Web application", créalo manualmente:

### Crear OAuth Client ID Manualmente

1. En Google Cloud Console > Credentials, haz clic en **"+ CREATE CREDENTIALS"**
2. Selecciona **"OAuth client ID"**
3. Si te pide configurar el OAuth consent screen:
   - Selecciona **"External"** (o el tipo que prefieras)
   - Completa la información básica requerida
   - Haz clic en **"Save and Continue"** hasta completar
4. En "Application type", selecciona **"Web application"**
5. Dale un nombre: **"Launcher App Web"**
6. En **"Authorized JavaScript origins"**, agrega:
   - `http://localhost:5174`
7. En **"Authorized redirect URIs"**, agrega:
   - `http://localhost:5174`
8. Haz clic en **"CREATE"**

## ✅ Verificación Final

Después de configurar, verifica:

- [ ] OAuth Client ID existe en Google Cloud Console
- [ ] `http://localhost:5174` está en Authorized JavaScript origins
- [ ] `http://localhost:5174` está en Authorized redirect URIs
- [ ] Los cambios se guardaron correctamente
- [ ] El servidor se reinició después de los cambios

## 🔍 Diferencias Clave

| Configuración | Ubicación | Formato | Ejemplo |
|--------------|-----------|---------|---------|
| **Authorized Domains** | Firebase Console | Solo dominio | `localhost` |
| **JavaScript Origins** | Google Cloud Console | URL completa | `http://localhost:5174` |
| **Redirect URIs** | Google Cloud Console | URL completa | `http://localhost:5174` |

## 📚 Enlaces Directos

- **Google Cloud Credentials:** https://console.cloud.google.com/apis/credentials?project=launcher-19cfe
- **Firebase Auth Settings:** https://console.firebase.google.com/project/launcher-19cfe/authentication/settings

## 💡 Nota Importante

El error `auth/internal-error` frecuentemente ocurre porque:
- ✅ Google Sign-In está habilitado en Firebase Console
- ✅ `localhost` está en Authorized domains
- ❌ **PERO falta agregar `http://localhost:5174` en Google Cloud Console OAuth Client ID**

Este último paso es el más comúnmente olvidado y es crítico para que funcione.

