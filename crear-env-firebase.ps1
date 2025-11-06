# Script para crear archivo .env con configuración de Firebase
# Este script te guía paso a paso para crear el archivo .env

Write-Host "`n🔥 CREAR ARCHIVO .ENV PARA FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

# Verificar si .env ya existe
if (Test-Path $envPath) {
    Write-Host "⚠️ El archivo .env ya existe" -ForegroundColor Yellow
    Write-Host "   Ruta: $envPath`n" -ForegroundColor Gray
    
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "`n✅ Operación cancelada. El archivo .env no fue modificado." -ForegroundColor Green
        exit 0
    }
}

Write-Host "📋 INSTRUCCIONES:`n" -ForegroundColor Yellow
Write-Host "1. Ve a: https://console.firebase.google.com/project/launcher-19cfe" -ForegroundColor White
Write-Host "2. Haz clic en ⚙️ Configuración del proyecto" -ForegroundColor White
Write-Host "3. Baja hasta 'Tus aplicaciones'" -ForegroundColor White
Write-Host "4. Haz clic en el ícono Web (</>)" -ForegroundColor White
Write-Host "5. Si no tienes una app web, regístrala" -ForegroundColor White
Write-Host "6. Copia las credenciales que aparecen`n" -ForegroundColor White

Write-Host "📝 Ahora necesito que ingreses tus credenciales:`n" -ForegroundColor Cyan

# Solicitar credenciales
$apiKey = Read-Host "VITE_FIREBASE_API_KEY (debe empezar con AIza)"
$authDomain = Read-Host "VITE_FIREBASE_AUTH_DOMAIN (ej: launcher-19cfe.firebaseapp.com)"
$projectId = Read-Host "VITE_FIREBASE_PROJECT_ID (ej: launcher-19cfe)"
$storageBucket = Read-Host "VITE_FIREBASE_STORAGE_BUCKET (ej: launcher-19cfe.appspot.com)"
$messagingSenderId = Read-Host "VITE_FIREBASE_MESSAGING_SENDER_ID"
$appId = Read-Host "VITE_FIREBASE_APP_ID"

# Validar formato básico
$errors = @()

if (-not $apiKey -or -not $apiKey.StartsWith("AIza")) {
    $errors += "API Key debe empezar con 'AIza'"
}

if (-not $authDomain -or -not $authDomain.Contains(".firebaseapp.com")) {
    $errors += "Auth Domain debe contener '.firebaseapp.com'"
}

if (-not $projectId) {
    $errors += "Project ID no puede estar vacío"
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Errores encontrados:`n" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host "`n⚠️ Por favor, verifica los valores e intenta de nuevo.`n" -ForegroundColor Yellow
    exit 1
}

# Crear contenido del archivo .env
$envContent = @"
# Firebase Configuration
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Obtén las credenciales desde: Firebase Console > Configuración del proyecto > Tus aplicaciones

VITE_FIREBASE_API_KEY=$apiKey
VITE_FIREBASE_AUTH_DOMAIN=$authDomain
VITE_FIREBASE_PROJECT_ID=$projectId
VITE_FIREBASE_STORAGE_BUCKET=$storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
VITE_FIREBASE_APP_ID=$appId
"@

# Escribir archivo
try {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host "`n✅ Archivo .env creado exitosamente!" -ForegroundColor Green
    Write-Host "   Ruta: $envPath`n" -ForegroundColor Gray
    
    Write-Host "📋 Contenido del archivo:" -ForegroundColor Cyan
    Write-Host $envContent -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "💡 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow
    Write-Host "1. Verifica que el archivo .env tenga los valores correctos" -ForegroundColor White
    Write-Host "2. Reinicia el servidor: npm run dev" -ForegroundColor White
    Write-Host "3. Abre la aplicación y verifica que Firebase se inicialice correctamente`n" -ForegroundColor White
    
    Write-Host "🔍 Para verificar en la consola del navegador (F12):" -ForegroundColor Cyan
    Write-Host "   Busca: ✅ Firebase inicializado correctamente" -ForegroundColor Gray
    Write-Host "   Debería mostrar: Proyecto: $projectId`n" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error al crear el archivo .env:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

