# Script completamente automático para desplegar índices de Firestore
# Ejecuta: .\deploy-auto-completo.ps1

$ErrorActionPreference = "Continue"

Write-Host "`n🔥 Despliegue Automático de Índices Firestore" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Configuración
$PROJECT_ID = "launcher-19cfe"

# Paso 1: Verificar Firebase CLI
Write-Host "`n[1/5] Verificando Firebase CLI..." -ForegroundColor Yellow
try {
    $version = firebase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Firebase CLI: $version" -ForegroundColor Green
    } else {
        throw "Firebase no encontrado"
    }
} catch {
    Write-Host "   ⚠️  Instalando Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Error instalando Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Paso 2: Configurar proyecto
Write-Host "`n[2/5] Configurando proyecto..." -ForegroundColor Yellow
if (-not (Test-Path ".firebaserc")) {
    $firebaserc = @{
        projects = @{
            default = $PROJECT_ID
        }
    } | ConvertTo-Json
    
    $firebaserc | Out-File -FilePath ".firebaserc" -Encoding UTF8
    Write-Host "   ✅ Proyecto configurado: $PROJECT_ID" -ForegroundColor Green
} else {
    Write-Host "   ✅ Proyecto ya configurado" -ForegroundColor Green
}

# Verificar firebase.json
if (-not (Test-Path "firebase.json")) {
    @"
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
"@ | Out-File -FilePath "firebase.json" -Encoding UTF8
    Write-Host "   ✅ firebase.json creado" -ForegroundColor Green
}

# Paso 3: Verificar archivos
Write-Host "`n[3/5] Verificando archivos..." -ForegroundColor Yellow
if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "   ❌ firestore.indexes.json no encontrado" -ForegroundColor Red
    exit 1
}

$indexCount = (Get-Content "firestore.indexes.json" | ConvertFrom-Json).indexes.Count
Write-Host "   ✅ firestore.indexes.json ($indexCount índices)" -ForegroundColor Green

# Paso 4: Verificar autenticación
Write-Host "`n[4/5] Verificando autenticación..." -ForegroundColor Yellow

# Intentar verificar autenticación sin interacción
$authCheck = firebase projects:list 2>&1 | Out-String

if ($LASTEXITCODE -ne 0 -or $authCheck -match "Failed to authenticate" -or $authCheck -match "not logged in" -or $authCheck -match "Please login") {
    Write-Host "   ⚠️  No estás autenticado" -ForegroundColor Yellow
    Write-Host "   🔐 Iniciando autenticación..." -ForegroundColor Cyan
    Write-Host "   Por favor, completa la autenticación en el navegador que se abrirá." -ForegroundColor White
    Write-Host "   (Cuando pregunte sobre Gemini, responde 'N' y presiona Enter)" -ForegroundColor Yellow
    
    # Intentar login con token o esperar
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "firebase login --no-localhost" -Wait:$false
    
    Write-Host "`n   ⏳ Esperando autenticación..." -ForegroundColor Yellow
    Write-Host "   Completa el login en la ventana que se abrió, luego presiona Enter aquí..." -ForegroundColor White
    Read-Host "   Presiona Enter cuando hayas completado el login"
    
    # Verificar nuevamente
    $authCheck2 = firebase projects:list 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Autenticación no completada" -ForegroundColor Red
        Write-Host "   Por favor, ejecuta manualmente: firebase login" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "   ✅ Autenticado correctamente" -ForegroundColor Green

# Paso 5: Desplegar índices
Write-Host "`n[5/5] Desplegando índices..." -ForegroundColor Yellow
Write-Host "   Proyecto: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "   Índices: $indexCount" -ForegroundColor Cyan
Write-Host "   Esto puede tardar unos minutos...`n" -ForegroundColor White

$deployOutput = firebase deploy --only firestore:indexes --project $PROJECT_ID 2>&1 | Tee-Object -Variable deployResult

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Índices desplegados exitosamente!" -ForegroundColor Green
    Write-Host "`n📊 Verifica en Firebase Console:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes" -ForegroundColor White
    Write-Host "`n⏳ Los índices pueden tardar unos minutos en construirse." -ForegroundColor Yellow
    Write-Host "   Estado: Building → Enabled" -ForegroundColor White
    
    # Abrir navegador automáticamente
    Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
} else {
    Write-Host "`n❌ Error en el despliegue" -ForegroundColor Red
    Write-Host "   Revisa los mensajes de error arriba" -ForegroundColor Yellow
    
    # Verificar si es error de autenticación
    if ($deployOutput -match "Failed to authenticate" -or $deployOutput -match "not logged in") {
        Write-Host "`n💡 Solución: Ejecuta manualmente:" -ForegroundColor Cyan
        Write-Host "   firebase login" -ForegroundColor White
        Write-Host "   firebase deploy --only firestore:indexes --project $PROJECT_ID" -ForegroundColor White
    }
    exit 1
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 Proceso completado" -ForegroundColor Green

