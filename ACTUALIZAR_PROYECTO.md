# 🔄 Actualizar Proyecto Firebase

## ✅ Cambio Realizado

Tu proyecto de Firebase ha sido actualizado de `launcherwind` a `launcher-19cfe`.

## 📋 Pasos para Completar la Configuración

### 1. Obtener Credenciales del Nuevo Proyecto

1. Ve a [Firebase Console](https://console.firebase.google.com/project/launcher-19cfe)
2. Haz clic en **Configuración del proyecto** (⚙️)
3. Desplázate hasta **"Tus aplicaciones"**
4. Si no tienes una app Web, haz clic en el ícono `</>` para agregar una
5. Copia el objeto `firebaseConfig` que aparece

### 2. Actualizar el archivo .env

Edita el archivo `.env` y reemplaza los valores con los del nuevo proyecto:

```env
VITE_FIREBASE_API_KEY=tu-nueva-api-key
VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcher-19cfe
VITE_FIREBASE_STORAGE_BUCKET=launcher-19cfe.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-nuevo-sender-id
VITE_FIREBASE_APP_ID=tu-nuevo-app-id
```

### 3. Actualizar Firebase Admin SDK (si es necesario)

Si necesitas actualizar las credenciales de Admin SDK:

1. Ve a [Firebase Console - Service Accounts](https://console.firebase.google.com/project/launcher-19cfe/settings/serviceaccounts/adminsdk)
2. Haz clic en **"Generar nueva clave privada"**
3. Descarga el archivo JSON
4. Renómbralo a `serviceAccountKey.json`
5. Colócalo en la raíz del proyecto (`parcial/serviceAccountKey.json`)

### 4. Configurar Firestore

1. Ve a [Firestore Database](https://console.firebase.google.com/project/launcher-19cfe/firestore)
2. Si no está creada, haz clic en **"Crear base de datos"**
3. Configura las reglas de seguridad (usa `firestore.rules`)
4. Despliega los índices (usa `firestore.indexes.json`)

### 5. Configurar Autenticación

1. Ve a [Authentication](https://console.firebase.google.com/project/launcher-19cfe/authentication)
2. Haz clic en **"Comenzar"** si es la primera vez
3. Habilita **Google** como método de autenticación
4. Habilita **Correo electrónico/Contraseña** si lo deseas

### 6. Reiniciar el Servidor

Después de actualizar el archivo `.env`:

```powershell
# Detén el servidor (Ctrl+C)
npm run dev
```

## ✅ Archivos Actualizados

- ✅ `.firebaserc` - Proyecto actualizado a `launcher-19cfe`
- ✅ Scripts de despliegue - Actualizados con el nuevo proyecto

## 📝 Nota

El archivo `serviceAccountKey.json` que tienes actualmente es del proyecto anterior (`launcherwind`). Si necesitas usar Firebase Admin SDK, deberás generar nuevas credenciales para el nuevo proyecto.

## 🔗 Enlaces Útiles

- **Firebase Console**: https://console.firebase.google.com/project/launcher-19cfe
- **Configuración del Proyecto**: https://console.firebase.google.com/project/launcher-19cfe/settings/general
- **Firestore**: https://console.firebase.google.com/project/launcher-19cfe/firestore
- **Authentication**: https://console.firebase.google.com/project/launcher-19cfe/authentication

