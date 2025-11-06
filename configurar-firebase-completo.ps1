# Script de Configuración Completa de Firebase
# Este script ayuda a configurar Firebase paso a paso

Write-Host "`n🔥 CONFIGURACIÓN COMPLETA DE FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si existe .env
$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

Write-Host "📋 PASO 1: Verificar archivo .env`n" -ForegroundColor Yellow

if (Test-Path $envPath) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    Write-Host "   Ruta: $envPath`n" -ForegroundColor Gray
    
    # Leer y mostrar variables (sin mostrar valores completos)
    $envContent = Get-Content $envPath -Raw
    $requiredVars = @(
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_STORAGE_BUCKET",
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "VITE_FIREBASE_APP_ID"
    )
    
    Write-Host "   Variables encontradas:" -ForegroundColor Gray
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var\s*=") {
            $value = ($envContent -split "`n" | Where-Object { $_ -match "^$var\s*=" } | ForEach-Object { ($_ -split "=", 2)[1].Trim() })
            if ($value -and $value -notmatch "^(tu-|TU-|$|'')") {
                if ($var -eq "VITE_FIREBASE_API_KEY") {
                    $displayValue = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..." + $value.Substring($value.Length - 4)
                } else {
                    $displayValue = $value
                }
                Write-Host "   ✅ $var = $displayValue" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $var = (vacío o placeholder)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ $var (no encontrada)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Archivo .env NO encontrado" -ForegroundColor Red
    Write-Host "   Ruta esperada: $envPath`n" -ForegroundColor Gray
    
    Write-Host "💡 Creando archivo .env desde plantilla...`n" -ForegroundColor Yellow
    
    $envTemplate = @"
# Firebase Configuration
# Obtén estos valores desde Firebase Console: https://console.firebase.google.com/
# 1. Ve a Configuración del proyecto (⚙️)
# 2. Baja hasta "Tus aplicaciones"
# 3. Haz clic en el ícono de Web (</>)
# 4. Copia las credenciales

VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
"@
    
    $envTemplate | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
    Write-Host "   Edita el archivo y agrega tus credenciales de Firebase`n" -ForegroundColor Gray
}

Write-Host "`n📋 PASO 2: Verificar configuración de Firebase Console`n" -ForegroundColor Yellow

Write-Host "🔗 Enlaces importantes:" -ForegroundColor Cyan
Write-Host "   1. Firebase Console: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "   2. Google Cloud Console: https://console.cloud.google.com/" -ForegroundColor White
Write-Host ""

# Mostrar instrucciones para Google Sign-In
Write-Host "📋 PASO 3: Configurar Google Sign-In`n" -ForegroundColor Yellow

Write-Host "🔧 En Firebase Console:" -ForegroundColor Cyan
Write-Host "   1. Ve a Authentication > Sign-in method" -ForegroundColor White
Write-Host "   2. Habilita 'Google' como proveedor" -ForegroundColor White
Write-Host "   3. Configura el email de soporte (opcional)" -ForegroundColor White
Write-Host "   4. Guarda los cambios`n" -ForegroundColor White

Write-Host "🔧 En Google Cloud Console (OAuth Client ID):" -ForegroundColor Cyan
Write-Host "   1. Ve a: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "   2. Busca el OAuth 2.0 Client ID de tu proyecto Firebase" -ForegroundColor White
Write-Host "   3. O crea uno nuevo:" -ForegroundColor White
Write-Host "      - Tipo: Aplicación web" -ForegroundColor Gray
Write-Host "      - Nombre: Firebase Web Client`n" -ForegroundColor Gray

Write-Host "   4. Configura Authorized JavaScript origins:" -ForegroundColor White
Write-Host "      ✅ http://localhost:3000" -ForegroundColor Green
Write-Host "      ✅ http://localhost:5173" -ForegroundColor Green
Write-Host "      ✅ http://localhost:5174" -ForegroundColor Green
Write-Host "      (Agrega todos los puertos que uses)`n" -ForegroundColor Gray

Write-Host "   5. Configura Authorized redirect URIs:" -ForegroundColor White
Write-Host "      ✅ http://localhost:3000" -ForegroundColor Green
Write-Host "      ✅ http://localhost:5173" -ForegroundColor Green
Write-Host "      ✅ http://localhost:5174" -ForegroundColor Green
Write-Host "      (Agrega todos los puertos que uses)`n" -ForegroundColor Gray

Write-Host "   6. Guarda los cambios" -ForegroundColor White
Write-Host "   ⚠️ Los cambios pueden tardar 5-10 minutos en aplicarse`n" -ForegroundColor Yellow

# Verificar puerto actual
Write-Host "📋 PASO 4: Verificar puerto de desarrollo`n" -ForegroundColor Yellow

$viteConfigPath = Join-Path $PSScriptRoot "vite.config.ts"
if (Test-Path $viteConfigPath) {
    $viteConfig = Get-Content $viteConfigPath -Raw
    if ($viteConfig -match "port:\s*(\d+)") {
        $port = $matches[1]
        Write-Host "✅ Puerto configurado en vite.config.ts: $port" -ForegroundColor Green
        Write-Host "   Asegúrate de agregar http://localhost:$port en OAuth Client ID`n" -ForegroundColor Gray
    }
}

Write-Host "📋 PASO 5: Verificar dominios autorizados en Firebase`n" -ForegroundColor Yellow

Write-Host "🔧 En Firebase Console:" -ForegroundColor Cyan
Write-Host "   1. Ve a Authentication > Settings" -ForegroundColor White
Write-Host "   2. Baja hasta 'Authorized domains'" -ForegroundColor White
Write-Host "   3. Verifica que 'localhost' esté en la lista" -ForegroundColor White
Write-Host "   4. Si no está, haz clic en 'Add domain' y agrega 'localhost'`n" -ForegroundColor White

Write-Host "📋 PASO 6: Probar la configuración`n" -ForegroundColor Yellow

Write-Host "💡 Después de configurar todo:" -ForegroundColor Cyan
Write-Host "   1. Reinicia el servidor (Ctrl+C y luego: npm run dev)" -ForegroundColor White
Write-Host "   2. Abre la aplicación en el navegador" -ForegroundColor White
Write-Host "   3. Abre la consola del navegador (F12)" -ForegroundColor White
Write-Host "   4. Intenta iniciar sesión con Google" -ForegroundColor White
Write-Host "   5. Revisa los logs en la consola para diagnosticar problemas`n" -ForegroundColor White

Write-Host "🔍 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   - Verificar variables de entorno: .\verificar-variables-env.ps1" -ForegroundColor White
Write-Host "   - Diagnosticar Google Sign-In: .\diagnosticar-google-signin.ps1" -ForegroundColor White
Write-Host "   - Verificar configuración: .\verificar-configuracion-firebase.ps1`n" -ForegroundColor White

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ Configuración completada. Sigue los pasos arriba para configurar Firebase.`n" -ForegroundColor Green

