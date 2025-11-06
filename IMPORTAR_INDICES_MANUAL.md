# 📥 Importar Índices Manualmente en Firebase Console

Si los índices no aparecen después del despliegue, puedes importarlos manualmente desde la consola.

## 🚀 Método 1: Importar desde Archivo (Más Rápido)

### Paso 1: Ir a Firebase Console

1. Ve a: https://console.firebase.google.com/project/launcherwind/firestore/indexes
2. Haz clic en el botón **"Crear índice"** (o busca "Importar")

### Paso 2: Importar desde firestore.indexes.json

1. En la página de Índices, busca el botón **"Importar"** o **"Upload"**
2. Selecciona el archivo `firestore.indexes.json` de tu proyecto
3. Haz clic en **"Importar"**

---

## 📝 Método 2: Crear Índices Manualmente (Uno por Uno)

Si no hay opción de importar, crea los índices uno por uno. Aquí están los más importantes:

### Índice 1: Flashcards por Categoría y Próxima Revisión

1. Haz clic en **"Crear índice"**
2. **Collection ID**: `flashcards`
3. **Campos del índice**:
   - Campo: `category` → Orden: **Ascendente**
   - Campo: `nextReview` → Orden: **Ascendente**
4. Haz clic en **"Crear"**

### Índice 2: Notes por Tags

1. **Collection ID**: `notes`
2. **Campos del índice**:
   - Campo: `tags` → Tipo: **Array**
   - Campo: `updatedAt` → Orden: **Descendente**
3. Haz clic en **"Crear"**

### Índice 3: Todos por Prioridad

1. **Collection ID**: `todos`
2. **Campos del índice**:
   - Campo: `priority` → Orden: **Ascendente**
   - Campo: `dueDate` → Orden: **Ascendente**
3. Haz clic en **"Crear"**

---

## ⚡ Método 3: Desplegar desde Terminal (Recomendado)

Una vez autenticado, ejecuta:

```powershell
# 1. Autenticarse
firebase login

# 2. Desplegar índices
firebase deploy --only firestore:indexes --project launcherwind
```

---

## 📋 Lista Completa de Índices a Crear

### Flashcards (3 índices)
1. `category` (ASC) + `nextReview` (ASC)
2. `category` (ASC) + `lastReviewed` (DESC)
3. `nextReview` (ASC) + `difficulty` (ASC)

### Notes (3 índices)
1. `category` (ASC) + `updatedAt` (DESC)
2. `category` (ASC) + `createdAt` (DESC)
3. `tags` (Array) + `updatedAt` (DESC)

### Todos (3 índices)
1. `completed` (ASC) + `createdAt` (DESC)
2. `completed` (ASC) + `dueDate` (ASC)
3. `priority` (ASC) + `dueDate` (ASC)

### Snippets (3 índices)
1. `language` (ASC) + `createdAt` (DESC)
2. `tags` (Array) + `createdAt` (DESC)
3. `isPublic` (ASC) + `language` (ASC) + `createdAt` (DESC)

### Quizzes (2 índices)
1. `category` (ASC) + `createdAt` (DESC)
2. `isPublic` (ASC) + `category` (ASC) + `createdAt` (DESC)

### Pomodoro Stats (2 índices)
1. `date` (DESC)
2. `totalPomodoros` (DESC) + `date` (DESC)

---

## ✅ Verificar

Después de crear/importar, verifica en:
https://console.firebase.google.com/project/launcherwind/firestore/indexes

Los índices aparecerán con estado:
- 🔄 **Building** → Construyendo
- ✅ **Enabled** → Listo para usar

---

*Importa el archivo firestore.indexes.json o crea los índices manualmente según esta guía.*

