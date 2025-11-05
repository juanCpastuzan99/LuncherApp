# Script de instalación para Win11 Dev Launcher
# Ejecuta este script en PowerShell para instalar el launcher globalmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Win11 Dev Launcher - Instalador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando Win11 Dev Launcher globalmente..." -ForegroundColor Yellow
Write-Host ""

# Instalar globalmente
try {
    npm install -g .
    Write-Host ""
    Write-Host "✓ Instalación completada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para ejecutar el launcher, usa:" -ForegroundColor Cyan
    Write-Host "  win11-launcher" -ForegroundColor White
    Write-Host ""
    Write-Host "O presiona Alt+Space después de iniciarlo." -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "✗ Error durante la instalación" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta ejecutar como administrador:" -ForegroundColor Yellow
    Write-Host "  npm install -g ." -ForegroundColor White
    exit 1
}

