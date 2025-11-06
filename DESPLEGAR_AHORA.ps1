# Script simple para desplegar índices
# Ejecuta: .\DESPLEGAR_AHORA.ps1

Write-Host "🔥 Desplegando índices de Firestore..." -ForegroundColor Cyan
Write-Host "Proyecto: launcher-19cfe`n" -ForegroundColor Yellow

# Verificar autenticación
$authCheck = firebase projects:list 2>&1 | Out-String
if ($LASTEXITCODE -ne 0 -or $authCheck -match "Failed to authenticate") {
    Write-Host "⚠️  Necesitas autenticarte primero." -ForegroundColor Yellow
    Write-Host "`nEjecuta este comando:" -ForegroundColor White
    Write-Host "   firebase login" -ForegroundColor Cyan
    Write-Host "`nLuego ejecuta este script nuevamente.`n" -ForegroundColor Yellow
    exit 1
}

# Desplegar
Write-Host "Desplegando índices..." -ForegroundColor Green
firebase deploy --only firestore:indexes --project launcher-19cfe

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Índices desplegados!" -ForegroundColor Green
    Write-Host "`nRecarga la página de Firebase Console para ver los índices." -ForegroundColor Cyan
    Write-Host "URL: https://console.firebase.google.com/project/launcher-19cfe/firestore/indexes`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Error en el despliegue" -ForegroundColor Red
}

