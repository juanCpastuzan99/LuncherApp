# Script para configurar proyecto y desplegar índices
# Proyecto: launcher-19cfe

Write-Host "🔥 Configurando Firebase para proyecto: launcher-19cfe" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Crear .firebaserc con el proyecto
Write-Host "`n[1/4] Configurando proyecto..." -ForegroundColor Yellow
$firebaserc = @{
    projects = @{
        default = "launcher-19cfe"
    }
} | ConvertTo-Json

$firebaserc | Out-File -FilePath ".firebaserc" -Encoding UTF8
Write-Host "   ✅ Proyecto configurado: launcher-19cfe" -ForegroundColor Green

# 2. Verificar firebase.json
Write-Host "`n[2/4] Verificando configuración..." -ForegroundColor Yellow
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
} else {
    Write-Host "   ✅ firebase.json existe" -ForegroundColor Green
}

# 3. Verificar archivos necesarios
Write-Host "`n[3/4] Verificando archivos..." -ForegroundColor Yellow
$filesOk = $true

if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "   ❌ firestore.indexes.json no encontrado" -ForegroundColor Red
    $filesOk = $false
} else {
    $indexCount = (Get-Content "firestore.indexes.json" | ConvertFrom-Json).indexes.Count
    Write-Host "   ✅ firestore.indexes.json ($indexCount índices)" -ForegroundColor Green
}

if (-not (Test-Path "firestore.rules")) {
    Write-Host "   📝 Creando firestore.rules..." -ForegroundColor Cyan
    @"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
"@ | Out-File -FilePath "firestore.rules" -Encoding UTF8
    Write-Host "   ✅ firestore.rules creado" -ForegroundColor Green
} else {
    Write-Host "   ✅ firestore.rules existe" -ForegroundColor Green
}

if (-not $filesOk) {
    Write-Host "`n❌ Faltan archivos necesarios" -ForegroundColor Red
    exit 1
}

# 4. Desplegar índices
Write-Host "`n[4/4] Desplegando índices..." -ForegroundColor Yellow
    Write-Host "   Proyecto: launcher-19cfe" -ForegroundColor Cyan
Write-Host "   Esto puede tardar unos minutos..." -ForegroundColor White

firebase deploy --only firestore:indexes --project launcher-19cfe

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Índices desplegados exitosamente!" -ForegroundColor Green
    Write-Host "`n📊 Verifica en:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/launcher-19cfe/firestore/indexes" -ForegroundColor White
    Write-Host "`n⏳ Los índices pueden tardar unos minutos en aparecer (Building → Enabled)" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  Puede que necesites autenticarte primero:" -ForegroundColor Yellow
    Write-Host "   firebase login" -ForegroundColor White
    Write-Host "`nLuego ejecuta este script nuevamente." -ForegroundColor Yellow
}

