# Script de instalación desde GitHub - Win11 Dev Launcher
# Instala la aplicación con un solo comando desde GitHub
# 
# Uso directo desde GitHub:
#   irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1 | iex
#
# O descarga y ejecuta localmente:
#   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1" -OutFile install.ps1
#   .\install.ps1

param(
    [string]$RepoUrl = "https://github.com/juanCpastuzan99/easyappWin11.git",
    [string]$Branch = "main"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Win11 Dev Launcher - Instalador" -ForegroundColor Cyan
Write-Host "  Instalación desde GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "O ejecuta este comando para instalar con winget:" -ForegroundColor Yellow
    Write-Host "  winget install OpenJS.NodeJS" -ForegroundColor White
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

# Crear directorio temporal
$tempDir = Join-Path $env:TEMP "win11-launcher-install"
$projectDir = Join-Path $tempDir "win11-dev-launcher"

# Limpiar instalaciones anteriores
if (Test-Path $tempDir) {
    Write-Host "Limpiando instalaciones anteriores..." -ForegroundColor Yellow
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Verificar Git
Write-Host "Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git encontrado" -ForegroundColor Green
    $useGit = $true
} catch {
    Write-Host "⚠ Git no está disponible, usando descarga directa..." -ForegroundColor Yellow
    $useGit = $false
}

Write-Host ""
Write-Host "Descargando desde GitHub..." -ForegroundColor Yellow

# Descargar desde GitHub
if ($useGit) {
    try {
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
        Set-Location $tempDir
        Write-Host "Clonando repositorio..." -ForegroundColor Yellow
        git clone --depth 1 -b $Branch $RepoUrl win11-dev-launcher 2>&1 | Out-Null
        if (-not (Test-Path $projectDir)) {
            throw "No se pudo clonar el repositorio"
        }
        Write-Host "✓ Repositorio clonado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al clonar repositorio: $_" -ForegroundColor Red
        Write-Host "Intentando descarga directa..." -ForegroundColor Yellow
        $useGit = $false
    }
}

# Si Git falla, usar descarga directa (ZIP)
if (-not $useGit) {
    try {
        $zipUrl = $RepoUrl -replace "\.git$", "" -replace "github\.com", "github.com" -replace "tree/.*", ""
        $zipUrl = "$zipUrl/archive/refs/heads/$Branch.zip"
        
        Write-Host "Descargando ZIP desde GitHub..." -ForegroundColor Yellow
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
        $zipPath = Join-Path $tempDir "repo.zip"
        
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
        
        Write-Host "Extrayendo archivos..." -ForegroundColor Yellow
        Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
        Remove-Item $zipPath
        
        # Renombrar carpeta extraída
        $extractedDir = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "*win11*" -or $_.Name -like "*launcher*" } | Select-Object -First 1
        if ($extractedDir) {
            Rename-Item -Path $extractedDir.FullName -NewName "win11-dev-launcher"
        }
        
        if (-not (Test-Path $projectDir)) {
            throw "No se pudo extraer el archivo"
        }
        Write-Host "✓ Archivos descargados exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al descargar: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Instalación manual:" -ForegroundColor Yellow
        Write-Host "  1. Descarga el repositorio desde GitHub" -ForegroundColor White
        Write-Host "  2. Extrae los archivos" -ForegroundColor White
        Write-Host "  3. Ejecuta: npm install -g ." -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
Set-Location $projectDir

try {
    npm install --silent
    Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando Win11 Dev Launcher globalmente..." -ForegroundColor Yellow

try {
    npm install -g . --silent
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Instalación completada exitosamente!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para ejecutar el launcher, usa:" -ForegroundColor Cyan
    Write-Host "  win11-launcher" -ForegroundColor White
    Write-Host ""
    Write-Host "O presiona Ctrl+Space después de iniciarlo." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para iniciar ahora, ejecuta:" -ForegroundColor Yellow
    Write-Host "  win11-launcher" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "✗ Error durante la instalación global" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta ejecutar como administrador:" -ForegroundColor Yellow
    Write-Host "  npm install -g ." -ForegroundColor White
    Write-Host ""
    Write-Host "O instala localmente:" -ForegroundColor Yellow
    Write-Host "  cd $projectDir" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    exit 1
} finally {
    # Limpiar archivos temporales
    Write-Host "Limpiando archivos temporales..." -ForegroundColor Gray
    Set-Location $env:USERPROFILE
    Start-Sleep -Seconds 1
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "¡Listo! La aplicación está instalada." -ForegroundColor Green
Write-Host ""

