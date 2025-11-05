# Script de instalación usando winget - Win11 Dev Launcher
# Instala Node.js con winget y luego instala la aplicación desde GitHub
# 
# Uso:
#   irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-with-winget.ps1 | iex

param(
    [string]$RepoUrl = "https://github.com/juanCpastuzan99/easyappWin11.git",
    [string]$Branch = "main"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Win11 Dev Launcher - Instalador" -ForegroundColor Cyan
Write-Host "  Instalación con winget" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar winget
Write-Host "Verificando winget..." -ForegroundColor Yellow
try {
    $wingetVersion = winget --version
    Write-Host "✓ winget encontrado: $wingetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ winget no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "winget viene con Windows 11 y Windows 10 (versión 1809 o superior)" -ForegroundColor Yellow
    Write-Host "Si no lo tienes, instálalo desde:" -ForegroundColor Yellow
    Write-Host "  https://aka.ms/getwinget" -ForegroundColor White
    Write-Host ""
    Write-Host "O usa el instalador alternativo:" -ForegroundColor Yellow
    Write-Host "  irm https://raw.githubusercontent.com/juanCpastuzan99/easyappWin11/main/install-from-github.ps1 | iex" -ForegroundColor White
    exit 1
}

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js ya está instalado: $nodeVersion" -ForegroundColor Green
    $nodeInstalled = $true
} catch {
    Write-Host "⚠ Node.js no está instalado" -ForegroundColor Yellow
}

# Instalar Node.js con winget si no está instalado
if (-not $nodeInstalled) {
    Write-Host ""
    Write-Host "Instalando Node.js con winget..." -ForegroundColor Yellow
    try {
        winget install --id OpenJS.NodeJS --silent --accept-package-agreements --accept-source-agreements
        Write-Host "✓ Node.js instalado exitosamente" -ForegroundColor Green
        
        # Refrescar PATH
        Write-Host "Actualizando PATH..." -ForegroundColor Yellow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verificar instalación
        Start-Sleep -Seconds 2
        $nodeVersion = node --version
        Write-Host "✓ Node.js verificado: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al instalar Node.js con winget" -ForegroundColor Red
        Write-Host "Intenta instalarlo manualmente:" -ForegroundColor Yellow
        Write-Host "  winget install OpenJS.NodeJS" -ForegroundColor White
        exit 1
    }
}

# Verificar npm
Write-Host "Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm no está disponible" -ForegroundColor Red
    Write-Host "Reinicia la terminal y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Crear directorio temporal
$tempDir = Join-Path $env:TEMP "win11-launcher-install"
$projectDir = Join-Path $tempDir "easyappWin11"

# Limpiar instalaciones anteriores
if (Test-Path $tempDir) {
    Write-Host "Limpiando instalaciones anteriores..." -ForegroundColor Yellow
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Descargando desde GitHub..." -ForegroundColor Yellow

# Verificar Git o usar descarga directa
$useGit = $false
try {
    $gitVersion = git --version
    $useGit = $true
    Write-Host "✓ Git encontrado, usando clonación" -ForegroundColor Green
} catch {
    Write-Host "⚠ Git no encontrado, usando descarga directa" -ForegroundColor Yellow
}

# Descargar desde GitHub
if ($useGit) {
    try {
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
        Set-Location $tempDir
        Write-Host "Clonando repositorio..." -ForegroundColor Yellow
        git clone --depth 1 -b $Branch $RepoUrl easyappWin11 2>&1 | Out-Null
        if (-not (Test-Path $projectDir)) {
            throw "No se pudo clonar el repositorio"
        }
        Write-Host "✓ Repositorio clonado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al clonar, intentando descarga directa..." -ForegroundColor Yellow
        $useGit = $false
    }
}

# Si Git falla, usar descarga directa (ZIP)
if (-not $useGit) {
    try {
        $zipUrl = "https://github.com/juanCpastuzan99/easyappWin11/archive/refs/heads/$Branch.zip"
        
        Write-Host "Descargando ZIP desde GitHub..." -ForegroundColor Yellow
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
        $zipPath = Join-Path $tempDir "repo.zip"
        
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
        
        Write-Host "Extrayendo archivos..." -ForegroundColor Yellow
        Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
        Remove-Item $zipPath
        
        # Buscar carpeta extraída
        $extractedDir = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "*easyappWin11*" } | Select-Object -First 1
        if ($extractedDir) {
            Rename-Item -Path $extractedDir.FullName -NewName "easyappWin11" -ErrorAction SilentlyContinue
        }
        
        if (-not (Test-Path $projectDir)) {
            throw "No se pudo extraer el archivo"
        }
        Write-Host "✓ Archivos descargados exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error al descargar: $_" -ForegroundColor Red
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
} catch {
    Write-Host ""
    Write-Host "✗ Error durante la instalación global" -ForegroundColor Red
    Write-Host "Intenta ejecutar como administrador:" -ForegroundColor Yellow
    Write-Host "  npm install -g ." -ForegroundColor White
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

