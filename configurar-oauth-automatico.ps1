# Script para abrir todas las URLs necesarias para configurar OAuth
Write-Host "`n🔧 Configurando OAuth para Google Sign-In...`n" -ForegroundColor Cyan

$projectId = "launcher-19cfe"
$port = "3000"

Write-Host "📋 Abriendo las siguientes URLs en tu navegador:`n" -ForegroundColor Yellow

# URL 1: Firebase Console - Sign-in Methods
Write-Host "1️⃣ Verificando Google Sign-In en Firebase Console..." -ForegroundColor Cyan
$firebaseProviders = "https://console.firebase.google.com/project/$projectId/authentication/providers"
Write-Host "   $firebaseProviders" -ForegroundColor Gray
Start-Process $firebaseProviders
Start-Sleep -Seconds 2

# URL 2: Firebase Console - Authorized Domains
Write-Host "`n2️⃣ Verificando Authorized Domains en Firebase Console..." -ForegroundColor Cyan
$firebaseSettings = "https://console.firebase.google.com/project/$projectId/authentication/settings"
Write-Host "   $firebaseSettings" -ForegroundColor Gray
Start-Process $firebaseSettings
Start-Sleep -Seconds 2

# URL 3: Google Cloud Console - OAuth Credentials
Write-Host "`n3️⃣ Configurando OAuth Client ID en Google Cloud Console..." -ForegroundColor Cyan
$googleCloudCredentials = "https://console.cloud.google.com/apis/credentials?project=$projectId"
Write-Host "   $googleCloudCredentials" -ForegroundColor Gray
Start-Process $googleCloudCredentials

Write-Host "`n✅ URLs abiertas`n" -ForegroundColor Green

Write-Host "📝 INSTRUCCIONES PASO A PASO:`n" -ForegroundColor Yellow

Write-Host "PASO 1: En Firebase Console (primera pestaña)" -ForegroundColor Cyan
Write-Host "   ✓ Verifica que Google esté 'Habilitado'`n" -ForegroundColor White

Write-Host "PASO 2: En Firebase Console - Settings (segunda pestaña)" -ForegroundColor Cyan
Write-Host "   ✓ Verifica que 'localhost' esté en 'Authorized domains'" -ForegroundColor White
Write-Host "   ✓ Si NO está, agrégalo (sin http://, sin puerto)`n" -ForegroundColor White

Write-Host "PASO 3: En Google Cloud Console (tercera pestaña) - IMPORTANTE" -ForegroundColor Cyan
Write-Host "   1. Busca 'OAuth 2.0 Client IDs' en la lista" -ForegroundColor White
Write-Host "   2. Haz clic en el que dice 'Web application' (o el que Firebase creó)" -ForegroundColor White
Write-Host "   3. En 'Authorized JavaScript origins':" -ForegroundColor White
Write-Host "      - Haz clic en '+ ADD URI'" -ForegroundColor Gray
Write-Host "      - Agrega: http://localhost:$port" -ForegroundColor Green
Write-Host "   4. En 'Authorized redirect URIs':" -ForegroundColor White
Write-Host "      - Haz clic en '+ ADD URI'" -ForegroundColor Gray
Write-Host "      - Agrega: http://localhost:$port" -ForegroundColor Green
Write-Host "   5. Haz clic en 'SAVE' (Guardar)`n" -ForegroundColor White

Write-Host "PASO 4: Reiniciar el servidor" -ForegroundColor Cyan
Write-Host "   - Detén el servidor (Ctrl+C)" -ForegroundColor White
Write-Host "   - Ejecuta: npm run dev" -ForegroundColor Cyan
Write-Host "   - Espera a que inicie completamente`n" -ForegroundColor White

Write-Host "PASO 5: Probar login con Google" -ForegroundColor Cyan
Write-Host "   - Abre la aplicación" -ForegroundColor White
Write-Host "   - Ve a Configuración > Cuenta" -ForegroundColor White
Write-Host "   - Haz clic en 'Continuar con Google'`n" -ForegroundColor White

Write-Host "💡 IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Google Cloud Console usa el mismo login que Firebase Console" -ForegroundColor White
Write-Host "   - Es GRATIS y no requiere tarjeta de crédito" -ForegroundColor White
Write-Host "   - El PASO 3 es el más importante y frecuentemente se olvida`n" -ForegroundColor White

Write-Host "`n" -ForegroundColor White

