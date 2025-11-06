# 🚀 Pasos para Desplegar Índices (2 minutos)

## ⚡ Ejecución Rápida

### Paso 1: Abrir PowerShell

Abre PowerShell en la carpeta del proyecto:
```
cd "C:\Users\admin\Documents\PARCIAL ELECTIVA PROFECIONAL\parcial"
```

### Paso 2: Autenticarse

```powershell
firebase login
```

**Cuando pregunte:**
- "Enable Gemini in Firebase features?" → Responde **N** (no es necesario)

**Se abrirá tu navegador:**
1. Selecciona tu cuenta de Google
2. Autoriza Firebase CLI
3. Vuelve a PowerShell

### Paso 3: Desplegar Índices

```powershell
firebase deploy --only firestore:indexes --project launcherwind
```

**Esto desplegará los 16 índices automáticamente.**

### Paso 4: Verificar

1. Ve a: https://console.firebase.google.com/project/launcherwind/firestore/indexes
2. Recarga la página (F5)
3. Deberías ver los índices con estado **Building** o **Enabled**

---

## ✅ Comandos Completos (Copy-Paste)

```powershell
# 1. Autenticarse
firebase login

# 2. Desplegar (después de autenticarte)
firebase deploy --only firestore:indexes --project launcherwind
```

---

## 🎯 Alternativa: Crear Manualmente en Firebase Console

Si prefieres crear los índices manualmente:

1. Ve a: https://console.firebase.google.com/project/launcherwind/firestore/indexes
2. Haz clic en **"Crear índice"**
3. Sigue la guía en `IMPORTAR_INDICES_MANUAL.md`

---

*Una vez autenticado, el despliegue toma ~30 segundos*

