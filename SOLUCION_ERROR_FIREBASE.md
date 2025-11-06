# 🔧 Solución al Error: "Firebase no está configurado"

## ❌ Problema

Aparece el error: "Firebase no está configurado. Verifica las variables de entorno en .env y reinicia el servidor."

## 🔍 Causa

El problema es que Vite tiene `root: 'src/renderer'` en `vite.config.ts`, lo que hace que busque el archivo `.env` en `src/renderer/` en lugar de la raíz del proyecto donde está ubicado.

## ✅ Solución Aplicada

Se actualizó `vite.config.ts` para especificar explícitamente dónde buscar el archivo `.env`:

```typescript
export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  // Especificar dónde buscar el archivo .env (raíz del proyecto)
  envDir: path.resolve(__dirname),
  envPrefix: 'VITE_',
  // ... resto de la configuración
});
```

## 🔄 Pasos para Resolver

### 1. Verificar que el archivo `.env` existe

El archivo debe estar en: `parcial/.env` (raíz del proyecto, junto a `vite.config.ts`)

### 2. Verificar el contenido del archivo `.env`

Debe tener este formato (sin comillas, sin espacios extra):

```env
VITE_FIREBASE_API_KEY=AIzaSyCIKVkXQWBSHlSzoXi0-T4YhIwa5OXJ8gc
VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcher-19cfe
VITE_FIREBASE_STORAGE_BUCKET=launcher-19cfe.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1099497136710
VITE_FIREBASE_APP_ID=1:1099497136710:web:00808d964ff4999914e047
```

**⚠️ IMPORTANTE:**
- ❌ NO agregues comillas (`"` o `'`)
- ❌ NO dejes espacios antes o después del `=`
- ✅ Cada variable en una línea separada
- ✅ Sin líneas vacías entre variables

### 3. Reiniciar el servidor

**ESTE ES EL PASO MÁS IMPORTANTE:**

1. **Detén el servidor actual:**
   - Presiona `Ctrl+C` en la terminal donde corre `npm run dev`

2. **Reinicia el servidor:**
   ```powershell
   npm run dev
   ```

3. **Espera a que el servidor inicie completamente**

4. **Abre la aplicación y verifica:**
   - Haz clic en el botón ⚙️
   - Ve a la pestaña "Cuenta"
   - El error debería desaparecer

## 🧪 Verificación

Después de reiniciar, abre la consola del navegador (F12) y busca estos mensajes:

- ✅ `🔍 [DEBUG] Variables de entorno Firebase:` - Muestra que las variables están cargadas
- ✅ `✅ Firebase inicializado correctamente` - Confirma que Firebase está funcionando
- ✅ `Proyecto: launcher-19cfe` - Muestra el proyecto configurado

Si ves estos mensajes, **todo está funcionando correctamente**.

## 🚨 Si el Error Persiste

### Opción 1: Verificar que el servidor se reinició

Asegúrate de que:
- El servidor anterior se detuvo completamente (Ctrl+C)
- El nuevo servidor se inició desde cero
- No hay procesos antiguos corriendo

### Opción 2: Limpiar cache de Vite

```powershell
# Eliminar cache de Vite
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Reiniciar servidor
npm run dev
```

### Opción 3: Verificar formato del archivo .env

Abre el archivo `.env` y verifica:
- No hay BOM (Byte Order Mark) al inicio
- El encoding es UTF-8
- No hay caracteres raros
- Cada línea termina correctamente

### Opción 4: Verificar variables en tiempo de ejecución

Abre la consola del navegador (F12) y ejecuta:

```javascript
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

Si aparecen `undefined`, las variables no se están cargando.

## 📚 Más Información

- Ver `GUIA_RAPIDA_ENV.md` para configuración detallada
- Ver `CONFIGURAR_ENV.md` para pasos completos
- Ver logs en la consola del navegador para diagnóstico

## 💡 Nota Final

**El problema más común es no reiniciar el servidor después de crear o modificar el archivo `.env`.**

Vite solo carga las variables de entorno cuando se inicia. Si modificas el archivo mientras el servidor está corriendo, los cambios no se aplicarán hasta que reinicies.

