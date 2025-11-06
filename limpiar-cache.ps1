# Script para limpiar todos los cachés relacionados con el proyecto

Write-Host "`n🧹 LIMPIANDO TODOS LOS CACHÉS`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Obtener el nombre del proyecto desde package.json
$projectName = "launcher"
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.name) {
        $projectName = $packageJson.name
    }
}

Write-Host "`n📋 Limpiando cachés del proyecto:`n" -ForegroundColor Yellow

# 1. Caché de Vite
Write-Host "1. Caché de Vite..." -ForegroundColor White
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "   ✅ Eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No existe" -ForegroundColor Gray
}

# 2. Directorio dist-electron
Write-Host "2. Directorio dist-electron..." -ForegroundColor White
if (Test-Path "dist-electron") {
    Remove-Item -Recurse -Force "dist-electron"
    Write-Host "   ✅ Eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No existe" -ForegroundColor Gray
}

# 3. Caché de Electron (userData)
Write-Host "3. Caché de Electron (userData)..." -ForegroundColor White
$electronCachePath = "$env:APPDATA\$projectName"
$electronCachePathLocal = "$env:LOCALAPPDATA\$projectName"
$electronCachePathRoaming = "$env:APPDATA\$projectName"

$pathsToCheck = @($electronCachePath, $electronCachePathLocal, $electronCachePathRoaming)
$found = $false

foreach ($path in $pathsToCheck) {
    if (Test-Path $path) {
        Write-Host "   📁 Encontrado: $path" -ForegroundColor Yellow
        Write-Host "   ⚠️  Para eliminarlo manualmente:" -ForegroundColor Gray
        Write-Host "      Remove-Item -Recurse -Force '$path'" -ForegroundColor DarkGray
        $found = $true
    }
}

if (-not $found) {
    Write-Host "   ℹ️  No se encontró caché de Electron" -ForegroundColor Gray
}

# 4. Caché de npm (opcional)
Write-Host "4. Caché de npm (opcional)..." -ForegroundColor White
Write-Host "   💡 Para limpiar: npm cache clean --force" -ForegroundColor Gray

# 5. node_modules (opcional, más agresivo)
Write-Host "`n5. node_modules (opcional, solo si hay problemas)..." -ForegroundColor White
Write-Host "   💡 Para reinstalar: npm install" -ForegroundColor Gray

Write-Host "`n✅ Cachés principales limpiados`n" -ForegroundColor Green

Write-Host "📋 PRÓXIMOS PASOS:`n" -ForegroundColor Cyan
Write-Host "1. Cierra COMPLETAMENTE la aplicación (Electron)" -ForegroundColor White
Write-Host "2. Elimina el caché del navegador en la app:" -ForegroundColor White
Write-Host "   - Presiona Ctrl+Shift+Delete" -ForegroundColor Gray
Write-Host "   - O: Menu > Developer Tools > Application > Clear storage" -ForegroundColor Gray
Write-Host "3. Reinicia el servidor:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host "4. Vuelve a intentar el login con Google`n" -ForegroundColor White

Write-Host "💡 NOTA: Los cambios en Google Cloud Console aún pueden estar propagándose." -ForegroundColor Yellow
Write-Host "   Espera 5-30 minutos desde que guardaste los Redirect URIs.`n" -ForegroundColor Yellow

