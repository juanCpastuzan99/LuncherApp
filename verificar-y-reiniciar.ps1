# Script para verificar configuración y proporcionar instrucciones

Write-Host "`n🔍 Verificando configuración de Firebase...`n" -ForegroundColor Cyan

# Verificar que el archivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: El archivo .env NO existe" -ForegroundColor Red
    Write-Host "   Ejecuta: .\crear-env.ps1`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Leer y validar variables
$envContent = Get-Content ".env" -Raw
$requiredVars = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
)

$allConfigured = $true
Write-Host "`n📋 Verificando variables:" -ForegroundColor Cyan

foreach ($var in $requiredVars) {
    if ($envContent -match "$var=(.+)") {
        $value = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($value) -or $value -eq "tu-...") {
            Write-Host "   ❌ $var está vacío" -ForegroundColor Red
            $allConfigured = $false
        } else {
            Write-Host "   ✅ $var configurada" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ $var NO encontrada" -ForegroundColor Red
        $allConfigured = $false
    }
}

Write-Host ""

if ($allConfigured) {
    Write-Host "✅ TODAS las variables están configuradas correctamente`n" -ForegroundColor Green
    Write-Host "🔄 IMPORTANTE: Para que los cambios surtan efecto, necesitas:" -ForegroundColor Yellow
    Write-Host "`n   1. Detener el servidor actual (si está corriendo)" -ForegroundColor White
    Write-Host "      Presiona Ctrl+C en la terminal donde corre npm run dev`n" -ForegroundColor Gray
    Write-Host "   2. Reiniciar el servidor:" -ForegroundColor White
    Write-Host "      npm run dev`n" -ForegroundColor Cyan
    Write-Host "   3. Abrir la aplicación y hacer clic en el botón ⚙️" -ForegroundColor White
    Write-Host "   4. Ir a la pestaña 'Cuenta'`n" -ForegroundColor White
    Write-Host "💡 El error desaparecerá después de reiniciar el servidor`n" -ForegroundColor Yellow
} else {
    Write-Host "❌ Hay problemas con la configuración`n" -ForegroundColor Red
    Write-Host "💡 Ejecuta: .\actualizar-env.ps1 para configurar las variables`n" -ForegroundColor Yellow
    exit 1
}

