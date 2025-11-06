# 🔥 Configuración de Firebase - Sincronización Multi-Dispositivo

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa un nombre para tu proyecto
4. Sigue los pasos del asistente

### 2. Habilitar Firestore

1. En la consola de Firebase, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Modo de producción" o "Modo de prueba" (para desarrollo)
4. Elige una ubicación para tu base de datos

### 3. Habilitar Autenticación

1. Ve a "Authentication" en la consola
2. Haz clic en "Comenzar"
3. Habilita "Google" como método de autenticación
4. Habilita "Correo electrónico/Contraseña" si lo deseas

### 4. Obtener Credenciales

1. Ve a "Configuración del proyecto" (⚙️)
2. Baja hasta "Tus aplicaciones"
3. Haz clic en el ícono de Web (</>)
4. Registra tu app con un nombre
5. Copia las credenciales de configuración

### 5. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 6. Configurar Reglas de Seguridad

En Firestore, ve a "Reglas" y pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden acceder a sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Uso en la Aplicación

### Agregar Autenticación al App.tsx

```typescript
import { FirebaseAuth } from './components/FirebaseAuth';
import { useFirebaseSync } from './store/firebaseSync';

function App() {
  // Habilitar sincronización automática
  useFirebaseSync();
  
  // ... resto del código
}
```

### Comando para Abrir Autenticación

Agrega un comando en el parser para abrir la autenticación:

```typescript
// En commandParser.ts
case 'sync':
case 'sincronizar':
case 'firebase':
  return {
    type: 'firebase-auth',
    action: 'open'
  };
```

---

## ✅ Verificación

1. **Inicia la aplicación**
2. **Busca "sincronizar" o "firebase"** en la búsqueda
3. **Inicia sesión** con Google o Email
4. **Crea una flashcard o nota** en un dispositivo
5. **Verifica** que aparece en otro dispositivo (si tienes)

---

## 🔍 Estructura de Datos en Firebase

Los datos se organizan así en Firestore:

```
users/
  {userId}/
    flashcards/
      {flashcardId}
    notes/
      {noteId}
    todos/
      {todoId}
    snippets/
      {snippetId}
    quizzes/
      {quizId}
    pomodoro/
      config
      stats/
        {date}
```

---

## 🐛 Troubleshooting

### Error: "Usuario no autenticado"
- Verifica que hayas iniciado sesión
- Revisa la consola para errores de autenticación

### Error: "Permission denied"
- Verifica las reglas de seguridad en Firestore
- Asegúrate de estar autenticado

### Los datos no se sincronizan
- Verifica la conexión a internet
- Revisa la consola del navegador para errores
- Verifica que las credenciales de Firebase sean correctas

---

## 📚 Recursos

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

*¡Listo para sincronizar tus datos entre dispositivos!* 🎉

