# Script para verificar la configuración de variables de entorno

Write-Host "`n🔍 Verificando configuración de Firebase...`n" -ForegroundColor Cyan

# Verificar que el archivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: El archivo .env NO existe" -ForegroundColor Red
    Write-Host "   Ejecuta: .\crear-env.ps1 o .\actualizar-env.ps1`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Leer el archivo .env
$envContent = Get-Content ".env" -Raw

# Variables requeridas
$requiredVars = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
)

$missingVars = @()
$emptyVars = @()

foreach ($var in $requiredVars) {
    if ($envContent -match "$var=(.+)") {
        $value = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($value) -or $value -eq "tu-...") {
            $emptyVars += $var
            Write-Host "⚠️  $var está vacío o no configurado" -ForegroundColor Yellow
        } else {
            # Ocultar el valor completo por seguridad, mostrar solo los primeros caracteres
            $displayValue = if ($value.Length -gt 20) { $value.Substring(0, 20) + "..." } else { $value }
            Write-Host "✅ $var = $displayValue" -ForegroundColor Green
        }
    } else {
        $missingVars += $var
        Write-Host "❌ $var NO encontrada" -ForegroundColor Red
    }
}

Write-Host ""

# Resumen
if ($missingVars.Count -eq 0 -and $emptyVars.Count -eq 0) {
    Write-Host "✅ TODAS las variables están configuradas correctamente`n" -ForegroundColor Green
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Reinicia el servidor: npm run dev" -ForegroundColor White
    Write-Host "   2. Abre la aplicación" -ForegroundColor White
    Write-Host "   3. Haz clic en el botón de configuración ⚙️" -ForegroundColor White
    Write-Host "   4. Ve a la pestaña 'Cuenta'" -ForegroundColor White
    Write-Host "   5. Deberías ver los botones de login sin errores`n" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ Hay problemas con la configuración:`n" -ForegroundColor Red
    if ($missingVars.Count -gt 0) {
        Write-Host "   Variables faltantes:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "   - $var" -ForegroundColor White
        }
        Write-Host ""
    }
    if ($emptyVars.Count -gt 0) {
        Write-Host "   Variables vacías:" -ForegroundColor Yellow
        foreach ($var in $emptyVars) {
            Write-Host "   - $var" -ForegroundColor White
        }
        Write-Host ""
    }
    Write-Host "💡 Solución:" -ForegroundColor Cyan
    Write-Host "   Ejecuta: .\actualizar-env.ps1`n" -ForegroundColor White
    exit 1
}

