# 🔧 Configurar Múltiples Puertos para Google Sign-In

## 📋 Problema

Cuando el servidor de desarrollo corre en un puerto diferente (por ejemplo, `5174` en lugar de `3000`), Google Sign-In puede fallar porque el OAuth Client ID no tiene ese puerto configurado.

## ✅ Solución: Agregar Múltiples Puertos

Para evitar tener que reconfigurar cada vez que cambias de puerto, puedes agregar **múltiples puertos comunes** en una sola vez en Google Cloud Console.

### 🔗 Paso 1: Abrir Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu proyecto de Firebase (ej: `launcher-19cfe`)
3. Busca **"OAuth 2.0 Client IDs"**
4. Haz clic en el cliente **"Web client (auto created by Google Service)"**

### 📝 Paso 2: Agregar Múltiples Puertos

En la sección **"Authorized JavaScript origins"**, agrega estos puertos comunes:

```
http://localhost:3000
http://localhost:5173
http://localhost:5174
http://localhost:8080
http://localhost:5000
```

En la sección **"Authorized Redirect URIs"**, agrega los mismos:

```
http://localhost:3000
http://localhost:5173
http://localhost:5174
http://localhost:8080
http://localhost:5000
```

### 💾 Paso 3: Guardar

1. Haz clic en **"Guardar" (SAVE)** en la parte superior
2. Espera unos minutos para que la configuración se aplique

### 🚀 Paso 4: Reiniciar Servidor

Después de guardar, reinicia tu servidor de desarrollo:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinícialo
npm run dev
```

## 🎯 ¿Por qué funciona?

El código ahora detecta automáticamente el puerto actual usando `window.location.origin`. Si agregas múltiples puertos comunes, el servidor funcionará sin importar en qué puerto corra.

## 📌 Puertos Comunes

- **3000**: Puerto por defecto de Vite/React
- **5173**: Puerto alternativo de Vite
- **5174**: Otro puerto común de Vite
- **8080**: Puerto común para desarrollo web
- **5000**: Puerto común para desarrollo

## 🔍 Verificar Configuración

Puedes verificar que tu configuración esté correcta:

1. Abre Google Cloud Console > Credentials
2. Busca tu OAuth Client ID
3. Verifica que todos los puertos estén en ambas secciones

## ⚠️ Nota Importante

- Los cambios pueden tardar **5 minutos a varias horas** en aplicarse
- Si después de agregar los puertos sigue sin funcionar, espera unos minutos y reinicia el servidor
- El código ya tiene un fallback automático a `signInWithRedirect` si el popup falla

## 🎉 Resultado

Después de esto, el login con Google funcionará sin importar en qué puerto corra tu servidor de desarrollo.

