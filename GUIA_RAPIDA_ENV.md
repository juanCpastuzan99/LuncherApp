# 🚀 Guía Rápida: Configurar Variables de Entorno

## ✅ Paso 1: El archivo .env ya está creado

El archivo `.env` ya existe en la raíz del proyecto.

## 📋 Paso 2: Obtener Credenciales de Firebase

### Opción A: Desde Firebase Console (Recomendado)

1. **Abre Firebase Console**: https://console.firebase.google.com/
2. **Selecciona tu proyecto**: `launcherwind`
3. **Ve a Configuración**: Haz clic en el ícono ⚙️ (Configuración del proyecto)
4. **Desplázate hacia abajo** hasta "Tus aplicaciones"
5. **Busca la app Web** o haz clic en el ícono `</>` para agregar una
6. **Copia las credenciales** del objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // ← Copia esto
  authDomain: "launcherwind.firebaseapp.com",     // ← Copia esto
  projectId: "launcherwind",                      // ← Copia esto
  storageBucket: "launcherwind.appspot.com",      // ← Copia esto
  messagingSenderId: "123456789012",               // ← Copia esto
  appId: "1:123456789012:web:abcdef123456"         // ← Copia esto
};
```

### Opción B: Si ya tienes las credenciales

Si ya tienes las credenciales guardadas, solo cópialas al archivo `.env`.

## ✏️ Paso 3: Editar el archivo .env

Abre el archivo `parcial/.env` y reemplaza los valores:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=launcherwind.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcherwind
VITE_FIREBASE_STORAGE_BUCKET=launcherwind.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**⚠️ IMPORTANTE:**
- No agregues comillas (`"` o `'`) alrededor de los valores
- No dejes espacios antes o después del `=`
- Reemplaza TODOS los valores que dicen `tu-...`

## 🔄 Paso 4: Reiniciar el Servidor

Después de guardar el archivo `.env`:

1. **Detén el servidor** (Ctrl+C en la terminal)
2. **Reinicia el servidor**:
   ```powershell
   npm run dev
   ```

## ✅ Paso 5: Verificar

1. Abre la aplicación
2. Haz clic en el botón de configuración ⚙️
3. Ve a la pestaña "Cuenta"
4. **No deberías ver el error rojo** de "Firebase no está configurado"
5. Deberías ver los botones de login funcionando

## 🆘 Si Algo Sale Mal

### Error: "Firebase no está configurado"
- ✅ Verifica que el archivo `.env` existe en `parcial/.env`
- ✅ Verifica que todas las variables empiezan con `VITE_`
- ✅ Reinicia el servidor después de modificar `.env`
- ✅ Verifica que no hay espacios extra en el archivo

### Error: "Invalid API Key"
- ✅ Verifica que copiaste correctamente la API Key
- ✅ No debe tener comillas
- ✅ Debe ser una cadena larga

### Variables no se cargan
- ✅ El archivo debe llamarse exactamente `.env` (con el punto al inicio)
- ✅ Debe estar en la raíz del proyecto (`parcial/`)
- ✅ Reinicia el servidor después de crear/modificar

## 📚 Más Información

- Ver `CONFIGURAR_ENV.md` para guía detallada
- Ver `FIREBASE_SETUP.md` para configuración completa de Firebase

