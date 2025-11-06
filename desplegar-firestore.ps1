# Script para desplegar reglas e índices de Firestore
# Este script verifica que Firebase CLI esté instalado y despliega la configuración

Write-Host "`n🔥 DESPLEGAR CONFIGURACIÓN DE FIRESTORE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Verificar que Firebase CLI esté instalado
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI no está instalado" -ForegroundColor Red
    Write-Host "`n📦 Instalando Firebase CLI..." -ForegroundColor Yellow
    
    $install = Read-Host "¿Deseas instalar Firebase CLI globalmente? (s/n)"
    if ($install -eq "s" -or $install -eq "S") {
        npm install -g firebase-tools
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n❌ Error al instalar Firebase CLI" -ForegroundColor Red
            Write-Host "   Intenta manualmente: npm install -g firebase-tools`n" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "`n✅ Firebase CLI instalado correctamente`n" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Necesitas Firebase CLI para continuar`n" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar que estás en el directorio correcto
if (-not (Test-Path "firestore.rules")) {
    Write-Host "❌ No se encontró firestore.rules" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio raíz del proyecto`n" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "❌ No se encontró firestore.indexes.json" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio raíz del proyecto`n" -ForegroundColor Yellow
    exit 1
}

# Verificar que estás autenticado
Write-Host "🔍 Verificando autenticación..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1 | Select-String "email"

if (-not $firebaseUser) {
    Write-Host "`n⚠️ No estás autenticado en Firebase CLI" -ForegroundColor Yellow
    Write-Host "   Iniciando sesión..." -ForegroundColor Yellow
    firebase login
}

# Verificar proyecto
Write-Host "`n🔍 Verificando proyecto..." -ForegroundColor Yellow
$projectId = firebase use 2>&1 | Select-String "launcher-19cfe"

if (-not $projectId) {
    Write-Host "`n⚠️ El proyecto no está configurado o no es 'launcher-19cfe'" -ForegroundColor Yellow
    Write-Host "   Configurando proyecto..." -ForegroundColor Yellow
    firebase use launcher-19cfe
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Error al configurar el proyecto" -ForegroundColor Red
        Write-Host "   Verifica que el proyecto 'launcher-19cfe' exista en Firebase`n" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n✅ Proyecto configurado: launcher-19cfe" -ForegroundColor Green

# Desplegar reglas e índices
Write-Host "`n🚀 Desplegando reglas e índices de Firestore..." -ForegroundColor Cyan
Write-Host ""

firebase deploy --only firestore:rules,firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Despliegue exitoso!`n" -ForegroundColor Green
    Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Ve a Firebase Console para verificar las reglas" -ForegroundColor White
    Write-Host "   2. Verifica que los índices se estén creando (puede tardar unos minutos)" -ForegroundColor White
    Write-Host "   3. Prueba la aplicación creando datos y verificando que se sincronizan`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Error durante el despliegue" -ForegroundColor Red
    Write-Host "   Revisa los mensajes de error arriba`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

