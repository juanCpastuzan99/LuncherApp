# Script para corregir la API Key de Firebase en el archivo .env

Write-Host "`n🔧 CORREGIR API KEY DE FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ El archivo .env NO existe" -ForegroundColor Red
    Write-Host "   Ejecuta .\crear-env-rapido.ps1 primero`n" -ForegroundColor Yellow
    exit 1
}

# Leer el contenido actual
$content = Get-Content $envPath -Raw

# Corregir API Key si falta la "A" al inicio
if ($content -match 'VITE_FIREBASE_API_KEY=IzaSy') {
    Write-Host "⚠️ Detectado: API Key sin 'A' al inicio" -ForegroundColor Yellow
    $content = $content -replace 'VITE_FIREBASE_API_KEY=IzaSy', 'VITE_FIREBASE_API_KEY=AIzaSy'
    
    # Guardar el archivo corregido
    $content | Set-Content $envPath -NoNewline -Encoding UTF8
    
    Write-Host "✅ API Key corregida: Agregada 'A' al inicio" -ForegroundColor Green
    Write-Host "   Antes: IzaSy..." -ForegroundColor Gray
    Write-Host "   Ahora: AIzaSy..." -ForegroundColor Green
} elseif ($content -match 'VITE_FIREBASE_API_KEY=AIzaSy') {
    Write-Host "✅ API Key ya está correcta (empieza con AIzaSy)" -ForegroundColor Green
} else {
    Write-Host "⚠️ No se pudo detectar la API Key en el formato esperado" -ForegroundColor Yellow
    Write-Host "   Verifica manualmente el archivo .env`n" -ForegroundColor White
}

Write-Host "`n📋 Verificando todas las variables...`n" -ForegroundColor Cyan

# Verificar todas las variables
$requiredVars = @(
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
)

$allPresent = $true
foreach ($varName in $requiredVars) {
    if ($content -match "$varName\s*=\s*(.+?)(\r?\n|$)") {
        $value = $Matches[1].Trim()
        if ($value -and $value -ne '' -and -not $value.StartsWith('tu-')) {
            Write-Host "  ✅ $varName : Configurado" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $varName : Vacío o con valor placeholder" -ForegroundColor Red
            $allPresent = $false
        }
    } else {
        Write-Host "  ❌ $varName : No encontrado" -ForegroundColor Red
        $allPresent = $false
    }
}

Write-Host "`n" -NoNewline

if ($allPresent) {
    Write-Host "✅ Todas las variables están configuradas correctamente" -ForegroundColor Green
    Write-Host "`n⚠️ IMPORTANTE: Reinicia el servidor ahora:" -ForegroundColor Yellow
    Write-Host "   1. Presiona Ctrl+C en la terminal donde corre npm run dev" -ForegroundColor White
    Write-Host "   2. Ejecuta: npm run dev" -ForegroundColor White
    Write-Host "`n💡 Después de reiniciar, el error debería desaparecer" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Algunas variables faltan o están incorrectas" -ForegroundColor Yellow
    Write-Host "   Completa el archivo .env con las credenciales correctas`n" -ForegroundColor White
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

