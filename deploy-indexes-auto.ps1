# Script automático para desplegar índices de Firestore
# Ejecuta: .\deploy-indexes-auto.ps1

param(
    [switch]$SkipLogin = $false
)

Write-Host "`n🔥 Desplegando Índices de Firestore - Automático" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Paso 1: Verificar Firebase CLI
Write-Host "`n[1/5] Verificando Firebase CLI..." -ForegroundColor Yellow
try {
    $version = firebase --version 2>&1
    Write-Host "   ✅ Firebase CLI: $version" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Firebase CLI no encontrado. Instalando..." -ForegroundColor Red
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Error instalando Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Paso 2: Verificar autenticación
if (-not $SkipLogin) {
    Write-Host "`n[2/5] Verificando autenticación..." -ForegroundColor Yellow
    $authTest = firebase projects:list 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -or $authTest -match "not logged in" -or $authTest -match "Please login") {
        Write-Host "   ⚠️  No estás autenticado" -ForegroundColor Yellow
        Write-Host "   🔐 Abriendo autenticación..." -ForegroundColor Cyan
        Write-Host "   Por favor, autentícate en la ventana del navegador que se abrirá." -ForegroundColor White
        firebase login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Error en autenticación" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "   ✅ Autenticado correctamente" -ForegroundColor Green
}

# Paso 3: Verificar archivos de configuración
Write-Host "`n[3/5] Verificando archivos de configuración..." -ForegroundColor Yellow

if (-not (Test-Path "firebase.json")) {
    Write-Host "   📝 Creando firebase.json..." -ForegroundColor Cyan
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

if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "   ❌ firestore.indexes.json no encontrado" -ForegroundColor Red
    exit 1
} else {
    $indexCount = (Get-Content "firestore.indexes.json" | ConvertFrom-Json).indexes.Count
    Write-Host "   ✅ firestore.indexes.json existe ($indexCount índices)" -ForegroundColor Green
}

# Paso 4: Inicializar Firebase (si es necesario)
Write-Host "`n[4/5] Verificando proyecto Firebase..." -ForegroundColor Yellow
if (-not (Test-Path ".firebaserc")) {
    Write-Host "   ⚠️  .firebaserc no encontrado" -ForegroundColor Yellow
    Write-Host "   📝 Para inicializar, ejecuta manualmente:" -ForegroundColor Cyan
    Write-Host "      firebase init firestore" -ForegroundColor White
    Write-Host "   Y selecciona tu proyecto cuando se te solicite." -ForegroundColor White
    Write-Host "`n   O continúa con el despliegue si ya tienes proyecto configurado." -ForegroundColor Yellow
    $continue = Read-Host "   ¿Continuar con despliegue? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s" -and $continue -ne "Y" -and $continue -ne "y") {
        Write-Host "   ❌ Despliegue cancelado" -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "   ✅ .firebaserc existe" -ForegroundColor Green
    $project = (Get-Content ".firebaserc" | ConvertFrom-Json).projects.default
    if ($project) {
        Write-Host "   📁 Proyecto: $project" -ForegroundColor Cyan
    }
}

# Paso 5: Desplegar índices
Write-Host "`n[5/5] Desplegando índices de Firestore..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar unos minutos..." -ForegroundColor White

firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Índices desplegados exitosamente!" -ForegroundColor Green
    Write-Host "`n📊 Verifica el estado en:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/_/firestore/indexes" -ForegroundColor White
    Write-Host "`n⏳ Los índices pueden tardar unos minutos en construirse." -ForegroundColor Yellow
    Write-Host "   Estado: Building → Enabled" -ForegroundColor White
} else {
    Write-Host "`n❌ Error desplegando índices" -ForegroundColor Red
    Write-Host "   Revisa los mensajes de error arriba" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 Proceso completado" -ForegroundColor Green

