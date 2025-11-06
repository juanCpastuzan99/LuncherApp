# 🔧 Configuración de Variables de Entorno

## 📋 Pasos Rápidos

### 1. Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Configuración del proyecto** (⚙️)
4. Desplázate hasta **"Tus aplicaciones"**
5. Haz clic en el ícono de **Web** (`</>`)
6. Si no tienes una app web, regístrala con un nombre
7. Copia las credenciales que aparecen

### 2. Crear Archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto (`parcial/.env`)

**Ubicación:** `parcial/.env`

### 3. Copiar las Variables

Abre el archivo `.env.example` y copia su contenido al archivo `.env`, luego reemplaza los valores:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcherwind
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. Ejemplo Completo

Basado en tu proyecto `launcherwind`, debería verse así:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=launcherwind.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcherwind
VITE_FIREBASE_STORAGE_BUCKET=launcherwind.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 5. Reiniciar el Servidor

Después de crear el archivo `.env`, **debes reiniciar el servidor de desarrollo**:

```powershell
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

## 🔍 Dónde Encontrar Cada Variable

### En Firebase Console:

1. **API Key**: `apiKey` en la configuración
2. **Auth Domain**: `authDomain` (generalmente `proyecto.firebaseapp.com`)
3. **Project ID**: `projectId` (tu ID de proyecto)
4. **Storage Bucket**: `storageBucket` (generalmente `proyecto.appspot.com`)
5. **Messaging Sender ID**: `messagingSenderId` (número)
6. **App ID**: `appId` (formato: `1:xxxxx:web:xxxxx`)

## ✅ Verificación

Después de configurar, la ventana de configuración debería mostrar:
- ✅ Sin mensaje de error
- ✅ Botones de login funcionales
- ✅ Opción de Google Sign-In visible

## 🚨 Solución de Problemas

### Error: "Firebase no está configurado"
- Verifica que el archivo `.env` existe en `parcial/.env`
- Verifica que todas las variables empiezan con `VITE_`
- Reinicia el servidor después de crear/modificar `.env`

### Error: "Invalid API Key"
- Verifica que copiaste correctamente la API Key
- No debe tener comillas adicionales
- Debe ser una cadena larga que empiece con `AIzaSy`

### Variables no se cargan
- El archivo debe llamarse exactamente `.env` (con el punto)
- Debe estar en la raíz del proyecto (`parcial/`)
- Reinicia el servidor de desarrollo

