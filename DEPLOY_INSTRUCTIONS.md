# 🚀 Instrucciones para Desplegar Índices de Firestore

## ⚡ Despliegue Automático (Recomendado)

### Paso 1: Autenticarse en Firebase

Ejecuta en PowerShell:
```powershell
firebase login
```

Esto abrirá tu navegador para autenticarte. Una vez autenticado, continúa.

### Paso 2: Ejecutar Script de Despliegue

```powershell
.\deploy-firestore-indexes.ps1
```

El script hará:
- ✅ Verificar Firebase CLI
- ✅ Verificar autenticación
- ✅ Crear archivos de configuración si faltan
- ✅ Inicializar Firebase si es necesario
- ✅ Desplegar todos los índices

---

## 📋 Despliegue Manual (Alternativa)

### Paso 1: Inicializar Firebase

```bash
firebase init firestore
```

Cuando pregunte:
- **¿Usar un proyecto existente?** → Selecciona tu proyecto
- **¿Qué archivos usar?** → 
  - Para `firestore.rules`: **firestore.rules** (usar existente)
  - Para `firestore.indexes.json`: **firestore.indexes.json** (usar existente)

### Paso 2: Desplegar

```bash
firebase deploy --only firestore:indexes
```

---

## ✅ Verificar Despliegue

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Índices**
4. Verifica que todos los índices estén en estado **Enabled** o **Building**

---

## 🎯 Estado Actual

- ✅ `firestore.indexes.json` - Creado con 16 índices
- ✅ `firestore.rules` - Creado con reglas de seguridad
- ✅ `firebase.json` - Creado con configuración
- ⏳ Pendiente: Autenticación y despliegue

---

*Una vez autenticado, ejecuta el script de despliegue automático.*

