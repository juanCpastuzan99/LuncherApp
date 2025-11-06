# Script silencioso que intenta desplegar sin interacción
# Usa tokens guardados si están disponibles

param(
    [string]$ProjectId = "launcher-19cfe"
)

Write-Host "🔥 Despliegue Silencioso de Índices" -ForegroundColor Cyan

# Verificar si hay token guardado
$firebaseConfigPath = "$env:USERPROFILE\.config\configstore\firebase-tools.json"
if (Test-Path $firebaseConfigPath) {
    Write-Host "✅ Token de Firebase encontrado" -ForegroundColor Green
    
    # Intentar desplegar directamente
    Write-Host "Desplegando índices..." -ForegroundColor Yellow
    firebase deploy --only firestore:indexes --project $ProjectId --non-interactive
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Índices desplegados" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Necesitas autenticarte primero" -ForegroundColor Yellow
        Write-Host "Ejecuta: firebase login" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  No hay token guardado" -ForegroundColor Yellow
    Write-Host "Ejecuta: firebase login" -ForegroundColor White
    Write-Host "Luego ejecuta este script nuevamente" -ForegroundColor White
}

