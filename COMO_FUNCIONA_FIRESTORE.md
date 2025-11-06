# 🔥 Cómo Funciona la Sincronización con Firestore

## 📋 Resumen General

La aplicación sincroniza automáticamente tus datos entre dispositivos usando Firebase Firestore. Cuando inicias sesión, todos tus datos (flashcards, notas, tareas, etc.) se sincronizan en tiempo real.

## 🔄 Flujo de Funcionamiento

### 1. **Autenticación** 
```
Usuario inicia sesión → Firebase Auth verifica → Usuario autenticado
```

### 2. **Inicialización de Sincronización**
```
Usuario autenticado → Hook detecta autenticación → Carga datos desde Firebase
```

### 3. **Sincronización Bidireccional**
```
Cambios locales → Se envían a Firebase automáticamente
Cambios en Firebase → Se reciben en tiempo real → Se actualizan localmente
```

## 🏗️ Arquitectura

### Componentes Principales

#### 1. **Firebase Config** (`src/firebase/config.ts`)
- Inicializa Firebase con las credenciales del `.env`
- Exporta `db` (Firestore) y `auth` (Autenticación)
- Verifica que todas las variables estén configuradas

#### 2. **Firebase Auth** (`src/firebase/auth.ts`)
- Maneja autenticación (Google, Email/Password)
- Proporciona métodos: `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`
- Escucha cambios de estado de autenticación

#### 3. **Firebase Sync** (`src/firebase/sync.ts`)
- Clase `FirebaseSync` con métodos para cada tipo de dato:
  - `syncFlashcards()` - Sincronizar flashcards
  - `syncNotes()` - Sincronizar notas
  - `syncTodos()` - Sincronizar tareas
  - `syncSnippets()` - Sincronizar snippets
  - `syncQuizzes()` - Sincronizar quizzes
  - `subscribeToFlashcards()` - Escuchar cambios en tiempo real

#### 4. **Hook de Sincronización** (`src/renderer/store/firebaseSync.ts`)
- Hook React `useFirebaseSync()` que:
  - Detecta cuando el usuario se autentica
  - Carga datos desde Firebase al iniciar sesión
  - Sincroniza cambios locales automáticamente
  - Escucha cambios en tiempo real desde otros dispositivos

## 📊 Estructura de Datos en Firestore

```
users/
  {userId}/
    ├── flashcards/
    │   └── {flashcardId}
    │       ├── id: string
    │       ├── question: string
    │       ├── answer: string
    │       ├── category: string
    │       ├── difficulty: number
    │       ├── lastReviewed: timestamp
    │       ├── nextReview: timestamp
    │       ├── createdAt: timestamp
    │       └── updatedAt: timestamp
    │
    ├── notes/
    │   └── {noteId}
    │       ├── id: string
    │       ├── title: string
    │       ├── content: string
    │       ├── category: string
    │       ├── tags: string[]
    │       ├── createdAt: timestamp
    │       └── updatedAt: timestamp
    │
    ├── todos/
    │   └── {todoId}
    │       ├── id: string
    │       ├── title: string
    │       ├── completed: boolean
    │       ├── priority: 'low' | 'medium' | 'high'
    │       ├── dueDate: timestamp (opcional)
    │       ├── createdAt: timestamp
    │       └── updatedAt: timestamp
    │
    ├── snippets/
    │   └── {snippetId}
    │       ├── id: string
    │       ├── title: string
    │       ├── code: string
    │       ├── language: string
    │       ├── description: string
    │       ├── tags: string[]
    │       ├── isPublic: boolean
    │       ├── createdAt: timestamp
    │       └── updatedAt: timestamp
    │
    ├── quizzes/
    │   └── {quizId}
    │       ├── id: string
    │       ├── name: string
    │       ├── questions: Array<{...}>
    │       ├── category: string
    │       ├── isPublic: boolean
    │       ├── createdAt: timestamp
    │       └── updatedAt: timestamp
    │
    └── pomodoro/
        ├── config/
        │   ├── workDuration: number
        │   ├── shortBreakDuration: number
        │   ├── longBreakDuration: number
        │   └── pomodorosUntilLongBreak: number
        │
        └── stats/
            └── {date} (YYYY-MM-DD)
                ├── date: string
                ├── totalPomodoros: number
                ├── totalWorkTime: number
                └── sessions: Array<{...}>
```

## 🔐 Seguridad (Reglas de Firestore)

### Reglas Implementadas:

1. **Solo usuarios autenticados** pueden acceder a sus datos
2. **Cada usuario solo puede leer/escribir** sus propios documentos
3. **Validación de campos** requeridos y tamaños máximos
4. **Contenido público**: Snippets y quizzes con `isPublic=true` pueden ser leídos por cualquier usuario autenticado

### Ejemplo de Regla:
```javascript
match /users/{userId}/flashcards/{flashcardId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## 🚀 Cómo Activar la Sincronización

### Opción 1: Automática (Recomendado)

El hook `useFirebaseSync()` debe estar activo en `App.tsx`:

```typescript
import { useFirebaseSync } from './store/firebaseSync';

function App() {
  // Activar sincronización automática
  useFirebaseSync();
  
  // ... resto del código
}
```

### Opción 2: Manual

Si no está activo automáticamente, puedes activarlo manualmente:

1. Agrega el import en `App.tsx`:
```typescript
import { useFirebaseSync } from './store/firebaseSync';
```

2. Llama al hook dentro del componente:
```typescript
function App() {
  useFirebaseSync(); // Esto activa la sincronización
  
  // ... resto del código
}
```

## 🔄 Flujo Completo de Sincronización

### Al Iniciar Sesión:

1. **Usuario hace login** → `FirebaseAuth.signInWithGoogle()` o `signInWithEmail()`
2. **Auth cambia** → `onAuthStateChange` detecta el usuario
3. **Hook se activa** → `useFirebaseSync()` detecta que hay un usuario
4. **Carga inicial** → Carga todos los datos desde Firebase
5. **Merge inteligente** → Combina datos locales con datos de Firebase
6. **Sincronización** → Envía datos locales a Firebase

### Durante el Uso:

1. **Usuario crea/modifica datos** → Se guarda localmente (Jotai state)
2. **Hook detecta cambio** → Automáticamente sincroniza con Firebase
3. **Firebase actualiza** → Los cambios se guardan en la nube
4. **Otros dispositivos** → Reciben los cambios en tiempo real

### Tiempo Real:

1. **Cambio en Dispositivo A** → Se guarda en Firebase
2. **Firebase notifica** → Dispositivo B recibe el cambio
3. **Hook actualiza** → El estado local se actualiza automáticamente
4. **UI se actualiza** → El usuario ve los cambios inmediatamente

## 📝 Ejemplo de Uso

### Crear una Flashcard y Sincronizar:

```typescript
// 1. Usuario crea una flashcard localmente
const newFlashcard = {
  id: '123',
  question: '¿Qué es React?',
  answer: 'Una biblioteca de JavaScript',
  category: 'Programación'
};

// 2. Se guarda en el estado local (Jotai)
updateFlashcards([...flashcards, newFlashcard]);

// 3. El hook detecta el cambio y sincroniza automáticamente
// useFirebaseSync() detecta que flashcards cambió
// → Llama a firebaseSync.syncFlashcards()
// → Se guarda en Firebase: users/{userId}/flashcards/123

// 4. Otros dispositivos reciben el cambio en tiempo real
// → onSnapshot detecta el nuevo documento
// → Actualiza el estado local
// → La UI se actualiza
```

## ✅ Verificación de Funcionamiento

### 1. Verificar que Firebase está configurado:
- Abre la consola del navegador (F12)
- Busca: `✅ Firebase inicializado correctamente`

### 2. Inicia sesión:
- Ve a Configuración → Cuenta
- Inicia sesión con Google o Email/Password
- Busca en consola: `✅ Usuario autenticado: tu@email.com`

### 3. Verifica sincronización:
- Crea una flashcard o nota
- Busca en consola: `✅ Flashcard sincronizada` o `✅ Note sincronizada`
- Ve a Firebase Console → Firestore Database
- Verifica que aparezca en `users/{tuUserId}/flashcards/` o `users/{tuUserId}/notes/`

### 4. Prueba tiempo real:
- Abre la app en otro dispositivo/navegador
- Inicia sesión con la misma cuenta
- Crea/modifica algo en el primer dispositivo
- Deberías ver el cambio en el segundo dispositivo automáticamente

## 🐛 Troubleshooting

### Los datos no se sincronizan:

1. **Verifica autenticación:**
   - ¿Estás iniciado sesión?
   - Busca en consola: `✅ Usuario autenticado`

2. **Verifica Firebase:**
   - ¿Firebase está inicializado?
   - Busca en consola: `✅ Firebase inicializado correctamente`

3. **Verifica reglas:**
   - ¿Las reglas de Firestore están desplegadas?
   - Ve a Firebase Console → Firestore → Reglas

4. **Verifica conexión:**
   - ¿Tienes internet?
   - ¿Hay errores en la consola?

### Error: "Missing or insufficient permissions"

- Las reglas de Firestore no están desplegadas o son incorrectas
- Ejecuta: `firebase deploy --only firestore:rules`

### Error: "The query requires an index"

- Falta un índice compuesto
- Ejecuta: `firebase deploy --only firestore:indexes`
- O usa el enlace que Firebase proporciona en el error

## 📚 Archivos Importantes

- `src/firebase/config.ts` - Configuración de Firebase
- `src/firebase/auth.ts` - Autenticación
- `src/firebase/sync.ts` - Servicio de sincronización
- `src/renderer/store/firebaseSync.ts` - Hook de sincronización
- `firestore.rules` - Reglas de seguridad
- `firestore.indexes.json` - Índices optimizados

---

**✅ Sistema de sincronización listo para usar!** 🎉

