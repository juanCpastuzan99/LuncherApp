# 🔑 Cómo Obtener Service Account Key para Firebase Admin

## 📋 Pasos para Obtener el Archivo serviceAccountKey.json

### 1. Ir a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto

### 2. Ir a Configuración del Proyecto

1. Haz clic en el ícono de **⚙️ Configuración** (arriba a la izquierda)
2. Selecciona **Configuración del proyecto**

### 3. Ir a Cuentas de Servicio

1. En el menú lateral, busca **Cuentas de servicio**
2. O navega directamente a: **Configuración del proyecto** → **Cuentas de servicio**

### 4. Generar Nueva Clave Privada

1. Haz clic en **Generar nueva clave privada**
2. Aparecerá un diálogo de advertencia
3. Haz clic en **Generar clave**
4. Se descargará automáticamente un archivo JSON

### 5. Guardar el Archivo

1. El archivo descargado tendrá un nombre como: `tu-proyecto-firebase-adminsdk-xxxxx.json`
2. **Renómbralo** a: `serviceAccountKey.json`
3. **Muévelo** a la raíz del proyecto (donde está `package.json`)

### 6. Verificar Ubicación

El archivo debe estar en:
```
parcial/
├── package.json
├── serviceAccountKey.json  ← Aquí
├── src/
└── ...
```

## ⚠️ IMPORTANTE: Seguridad

### ❌ NUNCA hagas esto:
- ❌ Subir `serviceAccountKey.json` al repositorio Git
- ❌ Compartir el archivo públicamente
- ❌ Incluirlo en builds públicos

### ✅ SÍ haz esto:
- ✅ Agregar a `.gitignore` (ya está agregado)
- ✅ Guardar en lugar seguro
- ✅ Usar variables de entorno en producción

## 🔍 Verificar que Funciona

Una vez que tengas el archivo en la ubicación correcta:

1. **Inicia la aplicación**
2. **Revisa la consola** (terminal donde ejecutas `npm run dev`)
3. Deberías ver: `✅ Firebase Admin inicializado correctamente`

Si ves: `⚠️ Firebase Admin: serviceAccountKey.json no encontrado`
- Verifica que el archivo esté en la raíz del proyecto
- Verifica que el nombre sea exactamente `serviceAccountKey.json`

## 📝 Estructura del Archivo

El archivo `serviceAccountKey.json` tiene esta estructura:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🎯 Uso en la Aplicación

Una vez configurado, puedes usar Firebase Admin desde el proceso principal:

```javascript
// En main.js (ya está integrado)
const firebaseAdmin = require('./main/firebaseAdmin');

// Obtener Firestore Admin
const db = firebaseAdmin.getAdminFirestore();

// Obtener Auth Admin
const auth = firebaseAdmin.getAdminAuth();
```

## 🚨 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "serviceAccountKey.json no encontrado"
- Verifica que el archivo esté en la raíz del proyecto
- Verifica el nombre exacto del archivo
- Verifica la ruta en `firebaseAdmin.js`

### Error: "Invalid service account"
- Verifica que el archivo JSON esté completo
- Regenera la clave si es necesario
- Verifica que el proyecto de Firebase sea correcto

---

*Una vez configurado, Firebase Admin SDK estará disponible para operaciones administrativas.*

