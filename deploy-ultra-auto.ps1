# Script Ultra Automático - Despliega índices sin interacción
# Ejecuta: .\deploy-ultra-auto.ps1

$PROJECT_ID = "launcherwind"

Write-Host "`n🚀 Despliegue Ultra Automático de Índices" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Verificar token existente
$tokenPath = "$env:USERPROFILE\.config\configstore\firebase-tools.json"
$hasToken = Test-Path $tokenPath

if ($hasToken) {
    Write-Host "✅ Token de Firebase encontrado" -ForegroundColor Green
    Write-Host "Desplegando índices automáticamente...`n" -ForegroundColor Yellow
    
    firebase deploy --only firestore:indexes --project $PROJECT_ID --non-interactive
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ ¡Índices desplegados exitosamente!" -ForegroundColor Green
        Write-Host "`n📊 Verifica en:" -ForegroundColor Cyan
        Write-Host "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes" -ForegroundColor White
        Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
        exit 0
    }
}

# Si no hay token o falló, intentar login programático
Write-Host "⚠️  Autenticación requerida" -ForegroundColor Yellow
Write-Host "`nIniciando autenticación..." -ForegroundColor Cyan

# Crear proceso de login en background
$loginProcess = Start-Process -FilePath "firebase" -ArgumentList "login", "--no-localhost" -PassThru -NoNewWindow

Write-Host "`n📋 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Se abrirá una ventana de PowerShell para autenticación" -ForegroundColor White
Write-Host "2. Cuando pregunte sobre Gemini, responde: N" -ForegroundColor White
Write-Host "3. Se abrirá tu navegador - autoriza Firebase CLI" -ForegroundColor White
Write-Host "4. Vuelve aquí y presiona Enter cuando termines" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

Read-Host "Presiona Enter cuando hayas completado el login"

# Esperar un momento para que se guarde el token
Start-Sleep -Seconds 2

# Verificar autenticación
Write-Host "`nVerificando autenticación..." -ForegroundColor Yellow
$authCheck = firebase projects:list 2>&1 | Out-String

if ($LASTEXITCODE -eq 0 -and -not ($authCheck -match "Failed to authenticate")) {
    Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
    Write-Host "`nDesplegando índices...`n" -ForegroundColor Yellow
    
    firebase deploy --only firestore:indexes --project $PROJECT_ID --non-interactive
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ ¡Índices desplegados!" -ForegroundColor Green
        Write-Host "`n📊 Abriendo Firebase Console..." -ForegroundColor Cyan
        Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
    } else {
        Write-Host "`n❌ Error en despliegue. Revisa los mensajes arriba." -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Autenticación no completada correctamente" -ForegroundColor Red
    Write-Host "`nEjecuta manualmente:" -ForegroundColor Yellow
    Write-Host "   firebase login" -ForegroundColor White
    Write-Host "   firebase deploy --only firestore:indexes --project $PROJECT_ID" -ForegroundColor White
}

