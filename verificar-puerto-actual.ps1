# Script para verificar el puerto actual y mostrar instrucciones

Write-Host "`n🔍 VERIFICADOR DE PUERTO ACTUAL`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Obtener el puerto por defecto de Vite
$viteConfigPath = Join-Path $PSScriptRoot "vite.config.ts"
$defaultPort = "3000"

if (Test-Path $viteConfigPath) {
    $viteConfig = Get-Content $viteConfigPath -Raw
    if ($viteConfig -match "port:\s*(\d+)") {
        $defaultPort = $matches[1]
    }
}

Write-Host "`n📋 Configuración actual:`n" -ForegroundColor Yellow
Write-Host "Puerto por defecto en vite.config.ts: $defaultPort" -ForegroundColor White
Write-Host "`nPuertos comunes que puedes agregar en OAuth Client ID:`n" -ForegroundColor Yellow

$commonPorts = @("3000", "5173", "5174", "8080", "5000")
foreach ($port in $commonPorts) {
    $marker = if ($port -eq $defaultPort) { "⭐ (actual)" } else { "  " }
    Write-Host "   $marker http://localhost:$port" -ForegroundColor Green
}

Write-Host "`n🔧 INSTRUCCIONES:`n" -ForegroundColor Cyan
Write-Host "1. Abre Google Cloud Console:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials`n" -ForegroundColor Cyan

Write-Host "2. Busca 'OAuth 2.0 Client IDs' y haz clic en:" -ForegroundColor White
Write-Host "   'Web client (auto created by Google Service)'`n" -ForegroundColor Gray

Write-Host "3. En 'Authorized Redirect URIs', agrega todos estos puertos:" -ForegroundColor White
foreach ($port in $commonPorts) {
    Write-Host "   + http://localhost:$port" -ForegroundColor Green
}

Write-Host "`n4. Haz clic en 'Guardar' (SAVE) en la parte superior`n" -ForegroundColor White

Write-Host "💡 Después de guardar:" -ForegroundColor Yellow
Write-Host "   - Espera 2-5 minutos para que se apliquen los cambios" -ForegroundColor White
Write-Host "   - Reinicia tu servidor (Ctrl+C, luego npm run dev)" -ForegroundColor White
Write-Host "   - Prueba el login con Google`n" -ForegroundColor White

Write-Host "📄 Guía completa: CONFIGURAR_MULTIPLES_PUERTOS.md`n" -ForegroundColor Cyan

