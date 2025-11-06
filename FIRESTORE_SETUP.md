# 🔥 Configuración Completa de Firestore

## 📋 Archivos de Configuración

Este proyecto incluye una configuración completa de Firestore con:
- ✅ Reglas de seguridad (`firestore.rules`)
- ✅ Índices optimizados (`firestore.indexes.json`)
- ✅ Configuración de Firebase (`firebase.json`)

## 🚀 Despliegue de la Configuración

### Opción 1: Firebase CLI (Recomendado)

1. **Instalar Firebase CLI** (si no lo tienes):
   ```bash
   npm install -g firebase-tools
   ```

2. **Iniciar sesión**:
   ```bash
   firebase login
   ```

3. **Verificar que estás en el proyecto correcto**:
   ```bash
   firebase projects:list
   firebase use launcher-19cfe
   ```

4. **Desplegar reglas e índices**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Opción 2: Firebase Console (Manual)

#### Desplegar Reglas:

1. Ve a [Firebase Console](https://console.firebase.google.com/project/launcher-19cfe)
2. Selecciona **Firestore Database** → **Reglas**
3. Copia el contenido de `firestore.rules`
4. Pega en el editor de reglas
5. Haz clic en **Publicar**

#### Desplegar Índices:

1. Ve a **Firestore Database** → **Índices**
2. Haz clic en **Agregar índice**
3. Para cada índice en `firestore.indexes.json`:
   - Selecciona la colección
   - Agrega los campos en el orden especificado
   - Selecciona el orden (ASCENDING/DESCENDING)
   - Haz clic en **Crear**

## 🔒 Reglas de Seguridad

Las reglas están diseñadas para:

### ✅ Seguridad
- Solo usuarios autenticados pueden acceder a sus datos
- Cada usuario solo puede leer/escribir sus propios documentos
- Validación de campos requeridos y tamaños máximos
- Protección contra escrituras no autorizadas

### 📊 Estructura de Datos Protegida

```
users/
  {userId}/
    flashcards/      ✅ Solo el propietario
    notes/           ✅ Solo el propietario
    todos/           ✅ Solo el propietario
    snippets/        ✅ Propietario + Lectura pública si isPublic=true
    quizzes/         ✅ Propietario + Lectura pública si isPublic=true
    pomodoro/
      config/        ✅ Solo el propietario
      stats/          ✅ Solo el propietario
```

### 🌐 Contenido Público (Opcional)

Para futuro uso, hay una colección pública:
- `public/snippets/` - Snippets compartidos públicamente
- `public/quizzes/` - Quizzes compartidos públicamente

## 📈 Índices Optimizados

Los índices están configurados para optimizar consultas comunes:

### Flashcards
- Por categoría y próxima revisión
- Por categoría y última revisión
- Por próxima revisión y dificultad

### Notes
- Por categoría y fecha de actualización
- Por categoría y fecha de creación
- Por tags y fecha de actualización

### Todos
- Por estado (completado) y fecha de creación
- Por estado y fecha de vencimiento
- Por prioridad y fecha de vencimiento

### Snippets
- Por lenguaje y fecha de creación
- Por tags y fecha de creación
- Por público, lenguaje y fecha

### Quizzes
- Por categoría y fecha de creación
- Por público, categoría y fecha

### Pomodoro
- Por fecha (descendente)
- Por total de pomodoros y fecha

## ✅ Verificación

Después de desplegar:

1. **Verifica las reglas**:
   - Ve a Firestore Database → Reglas
   - Usa el Simulador de reglas para probar

2. **Verifica los índices**:
   - Ve a Firestore Database → Índices
   - Asegúrate de que todos los índices estén "Habilitados"

3. **Prueba la aplicación**:
   - Inicia sesión
   - Crea una flashcard, nota o todo
   - Verifica que se sincroniza correctamente

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"
- Verifica que las reglas estén desplegadas correctamente
- Asegúrate de que el usuario esté autenticado
- Revisa que el userId coincida con el propietario del documento

### Error: "The query requires an index"
- Firebase mostrará un enlace para crear el índice automáticamente
- O despliega los índices manualmente desde `firestore.indexes.json`

### Los índices no se crean
- Verifica que `firestore.indexes.json` esté en el formato correcto
- Asegúrate de usar `firebase deploy --only firestore:indexes`
- Espera unos minutos, los índices pueden tardar en crearse

## 📚 Recursos

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexes)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

**✅ Configuración lista para usar!** 🎉

