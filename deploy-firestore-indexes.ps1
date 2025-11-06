# Script para desplegar índices de Firestore automáticamente
# Ejecutar: .\deploy-firestore-indexes.ps1

Write-Host "🔥 Desplegando índices de Firestore..." -ForegroundColor Cyan

# Verificar si Firebase CLI está instalado
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI instalado: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Verificar si está autenticado
Write-Host "`n🔐 Verificando autenticación..." -ForegroundColor Cyan
$authCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No estás autenticado. Por favor, ejecuta:" -ForegroundColor Yellow
    Write-Host "   firebase login" -ForegroundColor White
    Write-Host "`nLuego ejecuta este script nuevamente." -ForegroundColor Yellow
    exit 1
}

# Verificar si firebase.json existe
if (-not (Test-Path "firebase.json")) {
    Write-Host "📝 Creando firebase.json..." -ForegroundColor Cyan
    @"
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
"@ | Out-File -FilePath "firebase.json" -Encoding UTF8
    Write-Host "✅ firebase.json creado" -ForegroundColor Green
}

# Verificar si firestore.indexes.json existe
if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "❌ firestore.indexes.json no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar si firestore.rules existe
if (-not (Test-Path "firestore.rules")) {
    Write-Host "📝 Creando firestore.rules..." -ForegroundColor Cyan
    @"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
"@ | Out-File -FilePath "firestore.rules" -Encoding UTF8
    Write-Host "✅ firestore.rules creado" -ForegroundColor Green
}

# Verificar si .firebaserc existe
if (-not (Test-Path ".firebaserc")) {
    Write-Host "⚠️  .firebaserc no encontrado. Inicializando Firebase..." -ForegroundColor Yellow
    Write-Host "   Por favor, selecciona tu proyecto cuando se te solicite." -ForegroundColor Yellow
    firebase init firestore --only firestore
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error inicializando Firebase" -ForegroundColor Red
        exit 1
    }
}

# Desplegar índices
Write-Host "`n🚀 Desplegando índices de Firestore..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Índices desplegados exitosamente!" -ForegroundColor Green
    Write-Host "`n📊 Verifica el estado en: https://console.firebase.google.com/" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Error desplegando índices" -ForegroundColor Red
    exit 1
}

