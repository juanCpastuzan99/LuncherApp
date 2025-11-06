# 🔐 Firebase Admin SDK - Guía de Uso

## ⚠️ IMPORTANTE

**Para sincronización multi-dispositivo, NO necesitas Firebase Admin SDK.**

El **Firebase Client SDK** que ya está implementado es suficiente y es lo correcto para esta funcionalidad.

## 📋 ¿Cuándo usar Firebase Admin SDK?

Firebase Admin SDK se usa para:

1. **Operaciones administrativas** (eliminar usuarios, modificar datos)
2. **Backend/Servidor** (Cloud Functions, Node.js server)
3. **Operaciones sin autenticación de usuario** (procesos automatizados)
4. **Bypass de reglas de seguridad** (solo cuando es necesario)

## 🔄 Comparación

| Característica | Client SDK ✅ (Ya implementado) | Admin SDK ❌ (No necesario) |
|----------------|----------------------------------|------------------------------|
| **Sincronización multi-dispositivo** | ✅ Sí | ❌ No |
| **Autenticación de usuarios** | ✅ Sí | ❌ No |
| **Operaciones administrativas** | ❌ No | ✅ Sí |
| **Funciona en navegador** | ✅ Sí | ❌ No |
| **Requiere service account** | ❌ No | ✅ Sí |
| **Seguridad** | Reglas de Firestore | Permisos completos |

## 🚀 Si Realmente Necesitas Admin SDK

### 1. Obtener Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON
6. Guárdalo como `serviceAccountKey.json` en la raíz del proyecto

### 2. Instalar Firebase Admin

```bash
npm install firebase-admin
```

### 3. Usar en main.js

```javascript
const { initializeFirebaseAdmin } = require('./main/firebaseAdmin');

app.whenReady().then(() => {
  // Inicializar Admin (opcional)
  initializeFirebaseAdmin();
  
  // ... resto del código
});
```

### 4. Agregar al .gitignore

```gitignore
# Firebase Admin
serviceAccountKey.json
```

## ⚠️ Seguridad

**NUNCA** subas `serviceAccountKey.json` al repositorio. Contiene credenciales de administrador.

## 📝 Ejemplos de Uso Admin SDK

### Eliminar Datos de Usuario

```javascript
const { deleteUserData } = require('./main/firebaseAdmin');

ipcMain.handle('admin-delete-user-data', async (event, userId) => {
  try {
    await deleteUserData(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Listar Usuarios

```javascript
const { getAllUsers } = require('./main/firebaseAdmin');

ipcMain.handle('admin-get-users', async () => {
  try {
    const users = await getAllUsers();
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## ✅ Recomendación

**Para tu aplicación de sincronización multi-dispositivo:**

✅ **Usa Firebase Client SDK** (ya implementado)  
❌ **NO uses Firebase Admin SDK** (no es necesario)

El Client SDK es:
- Más seguro
- Más simple
- Adecuado para aplicaciones cliente
- Funciona con autenticación de usuarios

---

*Firebase Admin SDK solo es necesario si planeas hacer operaciones administrativas desde el servidor.*

