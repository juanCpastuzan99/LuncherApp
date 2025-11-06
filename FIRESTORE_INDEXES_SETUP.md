# 📊 Configuración de Índices de Firestore

## 🎯 ¿Qué son los Índices?

Los índices de Firestore mejoran el rendimiento de las consultas complejas. Firebase crea automáticamente índices simples, pero para consultas con múltiples campos o filtros, necesitas crear índices compuestos.

## 📋 Índices Incluidos

El archivo `firestore.indexes.json` contiene índices optimizados para:

### 1. **Flashcards**
- ✅ Por categoría y fecha de próxima revisión
- ✅ Por categoría y última revisión
- ✅ Por próxima revisión y dificultad

### 2. **Notes**
- ✅ Por categoría y fecha de actualización
- ✅ Por categoría y fecha de creación
- ✅ Por tags y fecha de actualización

### 3. **Todos**
- ✅ Por estado (completado) y fecha de creación
- ✅ Por estado y fecha de vencimiento
- ✅ Por prioridad y fecha de vencimiento

### 4. **Snippets**
- ✅ Por lenguaje y fecha de creación
- ✅ Por tags y fecha de creación
- ✅ Por público, lenguaje y fecha

### 5. **Quizzes**
- ✅ Por categoría y fecha de creación
- ✅ Por público, categoría y fecha

### 6. **Pomodoro Stats**
- ✅ Por fecha (descendente)
- ✅ Por total de pomodoros y fecha

## 🚀 Cómo Configurar los Índices

### Opción 1: Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Índices**
4. Haz clic en **Agregar índice**
5. Para cada índice:
   - Selecciona la colección (ej: `flashcards`)
   - Agrega los campos en el orden especificado
   - Selecciona el orden (ASCENDING/DESCENDING)
   - Haz clic en **Crear**

### Opción 2: Firebase CLI (Automático) ⭐ RECOMENDADO

1. **Instalar Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Iniciar sesión**:
   ```bash
   firebase login
   ```

3. **Inicializar Firebase en tu proyecto**:
   ```bash
   firebase init firestore
   ```
   - Selecciona tu proyecto
   - Cuando pregunte sobre `firestore.indexes.json`, selecciona **usar el existente**
   - El archivo `firestore.indexes.json` ya está en la raíz del proyecto

4. **Desplegar índices**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Opción 3: Crear Manualmente en Firebase Console

Para cada índice en `firestore.indexes.json`:

1. Ve a Firebase Console → Firestore → Índices
2. Haz clic en **Agregar índice**
3. Configura según el índice:

**Ejemplo: Flashcards por categoría y próxima revisión**
- Collection ID: `flashcards`
- Fields:
  - `category` → Ascending
  - `nextReview` → Ascending
- Query scope: Collection
- Haz clic en **Crear**

## 📝 Estructura de Índices

Cada índice tiene esta estructura:

```json
{
  "collectionGroup": "flashcards",  // Nombre de la colección
  "queryScope": "COLLECTION",       // Alcance de la consulta
  "fields": [
    {
      "fieldPath": "category",       // Campo a indexar
      "order": "ASCENDING"           // Orden (ASCENDING/DESCENDING)
    },
    {
      "fieldPath": "nextReview",
      "order": "ASCENDING"
    }
  ]
}
```

## 🔍 Consultas que Usan estos Índices

### Ejemplo 1: Flashcards por Categoría y Próxima Revisión
```typescript
// Usa: src/firebase/queries.ts
import { getFlashcardsByCategory } from './firebase/queries';

const flashcards = await getFlashcardsByCategory('matemáticas');
// Índice usado: category (ASC) + nextReview (ASC)
```

### Ejemplo 2: Notes por Tags
```typescript
import { getNotesByTag } from './firebase/queries';

const notes = await getNotesByTag('importante');
// Índice usado: tags (array-contains) + updatedAt (DESC)
```

### Ejemplo 3: Todos Pendientes por Prioridad
```typescript
import { getTodosByPriority } from './firebase/queries';

const highPriorityTodos = await getTodosByPriority('high');
// Índice usado: priority (ASC) + dueDate (ASC)
```

## ⚠️ Errores Comunes y Soluciones

### Error: "The query requires an index"
- **Causa**: Firebase detectó que necesitas un índice para la consulta
- **Solución**: Firebase te dará un enlace directo para crear el índice
- Haz clic en el enlace y crea el índice automáticamente

### Error: "Index is building"
- **Causa**: El índice está en construcción
- **Solución**: Espera a que Firebase termine de construir el índice
- Puede tardar unos minutos dependiendo del tamaño de la colección
- Verifica en Firebase Console → Firestore → Índices

### Error: "Index not found"
- **Causa**: El índice no existe o no está completamente desplegado
- **Solución**: 
  1. Verifica que el índice esté en `firestore.indexes.json`
  2. Despliega con: `firebase deploy --only firestore:indexes`
  3. Espera a que termine de construir

## ✅ Verificar Índices

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Índices**
4. Verifica que todos los índices estén en estado **Enabled**

## 📊 Estados de Índices

- ✅ **Enabled**: Índice listo para usar
- 🔄 **Building**: Índice en construcción (puede tardar minutos)
- ❌ **Error**: Error en la creación del índice (revisa la configuración)
- ⏸️ **Disabled**: Índice deshabilitado

## 🎯 Índices Críticos (Crear Primero)

Estos son los más importantes para el funcionamiento básico:

1. **Flashcards por categoría** - Para filtrar por materia
2. **Notes por tags** - Para búsqueda avanzada  
3. **Todos por prioridad** - Para ordenar tareas
4. **Snippets por lenguaje** - Para filtrar código

## 🚀 Comandos Rápidos

```bash
# Ver índices actuales
firebase firestore:indexes

# Desplegar solo índices
firebase deploy --only firestore:indexes

# Desplegar reglas e índices
firebase deploy --only firestore

# Ver estado de índices
firebase firestore:indexes --status
```

## 📁 Archivos de Configuración

- `firestore.indexes.json` - Configuración de índices (ya creado)
- `firestore.rules` - Reglas de seguridad (crear si no existe)

## 🔐 Crear firestore.rules

Si no existe, crea `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden acceder a sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contenido público (snippets, quizzes compartidos)
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📈 Mejores Prácticas

1. **Crear índices antes de usar consultas complejas**
2. **Usar límites en consultas** para evitar cargar demasiados datos
3. **Monitorear el uso de índices** en Firebase Console
4. **Eliminar índices no utilizados** para ahorrar recursos

---

## 🎓 Ejemplo Completo de Configuración

### Paso 1: Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### Paso 2: Iniciar sesión
```bash
firebase login
```

### Paso 3: Inicializar proyecto
```bash
cd parcial
firebase init firestore
```
- Selecciona tu proyecto
- Usa el archivo `firestore.indexes.json` existente
- Crea `firestore.rules` si no existe

### Paso 4: Desplegar
```bash
firebase deploy --only firestore
```

### Paso 5: Verificar
- Ve a Firebase Console → Firestore → Índices
- Todos los índices deben estar en estado **Enabled**

---

*Los índices mejoran significativamente el rendimiento de las consultas en Firestore. ¡Configúralos antes de usar las consultas avanzadas!*
