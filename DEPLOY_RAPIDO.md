# ⚡ Despliegue Rápido de Índices

## 🚀 Pasos Rápidos (2 minutos)

### 1. Autenticarse (una sola vez)

```powershell
firebase login
```

Cuando pregunte sobre Gemini, puedes responder **N** (no es necesario).

### 2. Inicializar Proyecto (si no lo has hecho)

```powershell
firebase init firestore
```

**Opciones a seleccionar:**
- ✅ Usar un proyecto existente → Selecciona tu proyecto
- ✅ Para `firestore.rules` → **firestore.rules** (usar existente)
- ✅ Para `firestore.indexes.json` → **firestore.indexes.json** (usar existente)

### 3. Desplegar Índices

```powershell
firebase deploy --only firestore:indexes
```

¡Listo! Los índices se están desplegando.

---

## 📊 Verificar Despliegue

Los índices pueden tardar unos minutos en construirse. Verifica en:

https://console.firebase.google.com/project/_/firestore/indexes

Estado esperado:
- 🔄 **Building** → Construyendo (espera)
- ✅ **Enabled** → Listo para usar

---

## ✅ Comandos Completos (Copy-Paste)

```powershell
# 1. Autenticarse
firebase login

# 2. Inicializar (si es primera vez)
firebase init firestore

# 3. Desplegar
firebase deploy --only firestore:indexes
```

---

*Total: ~2 minutos de ejecución + tiempo de construcción de índices*

