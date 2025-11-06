# Script rápido para crear archivo .env para Firebase
# Este script crea el archivo .env con las variables necesarias

$envPath = Join-Path $PSScriptRoot ".env"

Write-Host "`n🔥 CREAR ARCHIVO .ENV PARA FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

if (Test-Path $envPath) {
    Write-Host "⚠️ El archivo .env ya existe" -ForegroundColor Yellow
    Write-Host "   Ruta: $envPath`n" -ForegroundColor Gray
    
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "`n✅ Operación cancelada.`n" -ForegroundColor Green
        exit 0
    }
}

Write-Host "📋 INSTRUCCIONES RÁPIDAS:`n" -ForegroundColor Yellow
Write-Host "1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/settings/general" -ForegroundColor White
Write-Host "2. Baja hasta 'Tus aplicaciones'" -ForegroundColor White
Write-Host "3. Haz clic en el ícono Web (</>)" -ForegroundColor White
Write-Host "4. Copia las credenciales que aparecen`n" -ForegroundColor White

Write-Host "📝 Ingresa tus credenciales de Firebase:`n" -ForegroundColor Cyan

$apiKey = Read-Host "VITE_FIREBASE_API_KEY (debe empezar con AIza)"
if (-not $apiKey -or -not $apiKey.StartsWith("AIza")) {
    Write-Host "`n❌ ERROR: API Key debe empezar con 'AIza'" -ForegroundColor Red
    Write-Host "   Obtén la API Key correcta desde Firebase Console`n" -ForegroundColor Yellow
    exit 1
}

$authDomain = Read-Host "VITE_FIREBASE_AUTH_DOMAIN (ej: launcher-19cfe.firebaseapp.com)"
$projectId = Read-Host "VITE_FIREBASE_PROJECT_ID (ej: launcher-19cfe)"
$storageBucket = Read-Host "VITE_FIREBASE_STORAGE_BUCKET (ej: launcher-19cfe.appspot.com)"
$messagingSenderId = Read-Host "VITE_FIREBASE_MESSAGING_SENDER_ID"
$appId = Read-Host "VITE_FIREBASE_APP_ID"

# Crear contenido
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
    
    Write-Host "💡 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow
    Write-Host "1. Reinicia el servidor: npm run dev" -ForegroundColor White
    Write-Host "2. Abre la consola del navegador (F12)" -ForegroundColor White
    Write-Host "3. Busca: ✅ Firebase inicializado correctamente`n" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error al crear el archivo .env:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""


