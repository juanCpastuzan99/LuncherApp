# 🔥 Integración con Firebase - Plan de Implementación

## 📊 Datos que Podemos Sincronizar con Firebase

### 1. **Datos Educativos** (Alta Prioridad) ⭐⭐⭐

#### **Flashcards** 
- **¿Por qué?** Sincronización entre dispositivos, estudio en cualquier lugar
- **Estructura Firebase:**
  ```javascript
  users/{userId}/flashcards/{flashcardId}
  {
    id: string,
    question: string,
    answer: string,
    category: string,
    difficulty: number,
    lastReviewed: timestamp,
    nextReview: timestamp,
    reviewCount: number,
    correctCount: number,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```

#### **Notes (Notas)**
- **¿Por qué?** Acceso desde cualquier dispositivo, backup en la nube
- **Estructura Firebase:**
  ```javascript
  users/{userId}/notes/{noteId}
  {
    id: string,
    title: string,
    content: string,
    category: string,
    tags: string[],
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```

#### **Quizzes (Cuestionarios)**
- **¿Por qué?** Compartir cuestionarios, estudiar en grupo
- **Estructura Firebase:**
  ```javascript
  users/{userId}/quizzes/{quizId}
  {
    id: string,
    name: string,
    questions: Array<{
      question: string,
      options: string[],
      correct: number
    }>,
    category: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    isPublic: boolean  // Para compartir
  }
  ```

#### **Snippets (Fragmentos de Código)**
- **¿Por qué?** Biblioteca de código compartible, sincronización entre dispositivos
- **Estructura Firebase:**
  ```javascript
  users/{userId}/snippets/{snippetId}
  {
    id: string,
    title: string,
    code: string,
    language: string,
    description: string,
    tags: string[],
    createdAt: timestamp,
    updatedAt: timestamp,
    isPublic: boolean
  }
  ```

### 2. **Productividad** (Prioridad Media) ⭐⭐

#### **Todos (Tareas)**
- **¿Por qué?** Gestión de tareas sincronizada
- **Estructura Firebase:**
  ```javascript
  users/{userId}/todos/{todoId}
  {
    id: string,
    title: string,
    completed: boolean,
    priority: 'low' | 'medium' | 'high',
    dueDate: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```

#### **Pomodoro Statistics**
- **¿Por qué?** Analytics de productividad, seguimiento de progreso
- **Estructura Firebase:**
  ```javascript
  users/{userId}/pomodoro/stats/{date}
  {
    date: string, // YYYY-MM-DD
    totalPomodoros: number,
    totalWorkTime: number, // en segundos
    sessions: Array<{
      startTime: timestamp,
      endTime: timestamp,
      duration: number,
      type: 'work' | 'shortBreak' | 'longBreak'
    }>
  }
  ```

#### **Pomodoro Config**
- **¿Por qué?** Sincronizar preferencias entre dispositivos
- **Estructura Firebase:**
  ```javascript
  users/{userId}/pomodoro/config
  {
    workDuration: number,
    shortBreakDuration: number,
    longBreakDuration: number,
    pomodorosUntilLongBreak: number,
    updatedAt: timestamp
  }
  ```

### 3. **Datos Locales** (Baja Prioridad) ⭐

#### **Favoritos y Historial**
- **Razón:** Específicos del dispositivo
- **Recomendación:** NO sincronizar (son preferencias locales)

---

## 🏗️ Arquitectura Propuesta

### Opción 1: Firebase Firestore (Recomendada)

**Ventajas:**
- ✅ Tiempo real con sincronización automática
- ✅ Escalable y fácil de usar
- ✅ Reglas de seguridad granulares
- ✅ Offline support nativo

**Estructura de Colecciones:**
```
users/
  {userId}/
    flashcards/
      {flashcardId}
    notes/
      {noteId}
    quizzes/
      {quizId}
    snippets/
      {snippetId}
    todos/
      {todoId}
    pomodoro/
      config
      stats/
        {date}
```

### Opción 2: Firebase Realtime Database

**Ventajas:**
- ✅ Sincronización en tiempo real
- ✅ Más simple para datos jerárquicos
- ✅ Menor costo para datos pequeños

**Desventajas:**
- ❌ Menos flexible que Firestore
- ❌ Sin queries complejas

---

## 🔐 Autenticación

### Opciones de Autenticación:

1. **Google Sign-In** (Recomendado)
   - Rápido y familiar
   - Integración nativa con Firebase

2. **Email/Password**
   - Clásico y confiable
   - Fácil de implementar

3. **Anónimo** (Para prueba)
   - Sin registro requerido
   - Datos vinculados al dispositivo

---

## 📦 Implementación Técnica

### 1. Instalación de Dependencias

```bash
npm install firebase
npm install --save-dev @types/firebase
```

### 2. Configuración de Firebase

```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 3. Servicio de Sincronización

```typescript
// src/firebase/sync.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { auth } from './config';

export class FirebaseSync {
  private getUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Sincronizar Flashcards
  async syncFlashcards(flashcards: Flashcard[]): Promise<void> {
    const userId = this.getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const flashcardsRef = collection(db, `users/${userId}/flashcards`);
    
    for (const flashcard of flashcards) {
      await setDoc(doc(flashcardsRef, flashcard.id), {
        ...flashcard,
        updatedAt: Date.now()
      });
    }
  }

  // Escuchar cambios en tiempo real
  subscribeToFlashcards(callback: (flashcards: Flashcard[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) return () => {};

    const flashcardsRef = collection(db, `users/${userId}/flashcards`);
    
    return onSnapshot(flashcardsRef, (snapshot) => {
      const flashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];
      callback(flashcards);
    });
  }

  // Similar para Notes, Quizzes, Snippets, Todos...
}
```

### 4. Integración con el Store Actual

```typescript
// src/renderer/store/firebaseSync.ts
import { FirebaseSync } from '../../firebase/sync';
import { useFlashcards } from './hooks';

export function useFirebaseSync() {
  const { flashcards, updateFlashcards } = useFlashcards();
  const sync = new FirebaseSync();

  useEffect(() => {
    // Sincronizar al cambiar flashcards
    sync.syncFlashcards(flashcards);
  }, [flashcards]);

  useEffect(() => {
    // Escuchar cambios en tiempo real
    const unsubscribe = sync.subscribeToFlashcards((firebaseFlashcards) => {
      updateFlashcards(firebaseFlashcards);
    });

    return unsubscribe;
  }, []);
}
```

---

## 🔄 Estrategia de Sincronización

### Modo Híbrido (Recomendado)

1. **Local First**: Los datos se guardan primero en electron-store
2. **Sync Background**: Sincronización en background con Firebase
3. **Conflicto Resolution**: Last-write-wins o merge inteligente

```
Usuario modifica → electron-store (instantáneo) → Firebase (background)
Firebase cambia → electron-store (actualiza) → UI (reactivo)
```

### Flujo de Sincronización

```typescript
// src/renderer/store/hybridPersistence.ts
export async function saveToStorage(key: string, value: any): Promise<void> {
  // 1. Guardar localmente (instantáneo)
  await saveToStorageLocal(key, value);
  
  // 2. Sincronizar con Firebase (background)
  if (isFirebaseEnabled() && isAuthenticated()) {
    syncToFirebase(key, value).catch(err => {
      console.error('Error sincronizando con Firebase:', err);
      // Continuar funcionando sin Firebase
    });
  }
}
```

---

## 📊 Reglas de Seguridad Firebase

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden acceder a sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contenido público (quizzes, snippets compartidos)
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🎯 Casos de Uso

### 1. Sincronización Multi-Dispositivo
- Usuario crea flashcards en PC
- Se sincronizan automáticamente
- Puede estudiar en móvil/tablet

### 2. Compartir Contenido
- Usuario hace público un quiz
- Otros usuarios pueden acceder
- Comunitario y colaborativo

### 3. Backup Automático
- Todos los datos respaldados en la nube
- Recuperación ante pérdida de dispositivo
- Historial completo

### 4. Analytics y Estadísticas
- Estadísticas de Pomodoro agregadas
- Progreso de estudio visualizado
- Insights de productividad

---

## 📈 Ventajas de Integrar Firebase

✅ **Sincronización Multi-Dispositivo**: Accede a tus datos desde cualquier lugar  
✅ **Backup Automático**: Tus datos seguros en la nube  
✅ **Colaboración**: Comparte flashcards, quizzes, snippets  
✅ **Analytics**: Estadísticas de uso y productividad  
✅ **Tiempo Real**: Cambios instantáneos entre dispositivos  
✅ **Offline Support**: Funciona sin conexión, sincroniza después  

---

## 🚀 Plan de Implementación

### Fase 1: Setup Básico (1-2 días)
- [ ] Instalar Firebase SDK
- [ ] Configurar proyecto Firebase
- [ ] Implementar autenticación básica
- [ ] Crear estructura de colecciones

### Fase 2: Sincronización Core (3-5 días)
- [ ] Implementar sync de Flashcards
- [ ] Implementar sync de Notes
- [ ] Integrar con sistema de persistencia actual
- [ ] Testing de sincronización

### Fase 3: Features Avanzadas (5-7 días)
- [ ] Sincronización de Quizzes y Snippets
- [ ] Estadísticas de Pomodoro
- [ ] Compartir contenido público
- [ ] Resolución de conflictos

### Fase 4: Optimización (2-3 días)
- [ ] Optimizar queries
- [ ] Implementar caché local
- [ ] Mejorar UX de sincronización
- [ ] Documentación

---

## 📝 Ejemplo de Uso

```typescript
// En un componente
import { useFirebaseSync } from '../store/firebaseSync';
import { useFlashcards } from '../store/hooks';

function MyComponent() {
  const { flashcards, addFlashcard } = useFlashcards();
  
  // Sincronización automática
  useFirebaseSync();
  
  const handleAdd = async () => {
    // Se guarda localmente (instantáneo)
    await addFlashcard(newCard);
    // Se sincroniza con Firebase automáticamente
  };
  
  return (
    // UI...
  );
}
```

---

## 🔒 Consideraciones de Seguridad

1. **API Keys**: Usar variables de entorno, nunca hardcodear
2. **Reglas de Seguridad**: Implementar reglas estrictas en Firestore
3. **Autenticación**: Requerir autenticación para todas las operaciones
4. **Validación**: Validar datos antes de guardar en Firebase
5. **Rate Limiting**: Implementar límites para prevenir abuso

---

## 💰 Costos Estimados

**Firebase Free Tier incluye:**
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 borrados/día
- 1 GB almacenamiento

**Para uso normal:** Gratis ✅  
**Para uso intensivo:** ~$25-50/mes

---

*Este documento proporciona una guía completa para integrar Firebase en la aplicación.*

