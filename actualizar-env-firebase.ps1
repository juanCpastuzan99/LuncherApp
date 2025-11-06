# Script para actualizar el archivo .env con las credenciales de Firebase

Write-Host "`n🔥 ACTUALIZANDO ARCHIVO .ENV CON CREDENCIALES DE FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

# Credenciales de Firebase
$firebaseConfig = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyCIKVkXQWBSHlSzoXi0-T4YhIwa5OXJ8gc"
    "VITE_FIREBASE_AUTH_DOMAIN" = "launcher-19cfe.firebaseapp.com"
    "VITE_FIREBASE_PROJECT_ID" = "launcher-19cfe"
    "VITE_FIREBASE_STORAGE_BUCKET" = "launcher-19cfe.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "1099497136710"
    "VITE_FIREBASE_APP_ID" = "1:1099497136710:web:00808d964ff4999914e047"
    "measurementId" = "G-R8V8Q99073"
}

# Crear contenido del archivo .env
$envContent = @"
# ============================================
# Configuración de Firebase
# ============================================
# Credenciales de Firebase para la aplicación
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

VITE_FIREBASE_API_KEY=$($firebaseConfig["VITE_FIREBASE_API_KEY"])
VITE_FIREBASE_AUTH_DOMAIN=$($firebaseConfig["VITE_FIREBASE_AUTH_DOMAIN"])
VITE_FIREBASE_PROJECT_ID=$($firebaseConfig["VITE_FIREBASE_PROJECT_ID"])
VITE_FIREBASE_STORAGE_BUCKET=$($firebaseConfig["VITE_FIREBASE_STORAGE_BUCKET"])
VITE_FIREBASE_MESSAGING_SENDER_ID=$($firebaseConfig["VITE_FIREBASE_MESSAGING_SENDER_ID"])
VITE_FIREBASE_APP_ID=$($firebaseConfig["VITE_FIREBASE_APP_ID"])
measurementId=$($firebaseConfig["measurementId"])

# ============================================
# Opcional: Firebase Emulator (Solo desarrollo)
# ============================================
# VITE_USE_FIREBASE_EMULATOR=false
"@

# Verificar si el archivo existe
if (Test-Path $envPath) {
    Write-Host "⚠️ El archivo .env ya existe" -ForegroundColor Yellow
    $backupPath = "$envPath.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item $envPath $backupPath
    Write-Host "   Backup creado: $backupPath" -ForegroundColor Gray
}

# Escribir el archivo
try {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host "`n✅ Archivo .env actualizado correctamente!" -ForegroundColor Green
    Write-Host "   Ruta: $envPath`n" -ForegroundColor Gray
    
    Write-Host "📋 Variables configuradas:" -ForegroundColor Cyan
    foreach ($key in $firebaseConfig.Keys) {
        if ($key -like "VITE_*") {
            $value = $firebaseConfig[$key]
            if ($key -eq "VITE_FIREBASE_API_KEY") {
                Write-Host "  ✅ $key : $($value.Substring(0, 10))...$($value.Substring($value.Length - 4))" -ForegroundColor Green
            } else {
                Write-Host "  ✅ $key : $value" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "`n⚠️ IMPORTANTE: Reinicia el servidor ahora:" -ForegroundColor Yellow
    Write-Host "   1. Presiona Ctrl+C en la terminal donde corre npm run dev" -ForegroundColor White
    Write-Host "   2. Ejecuta: npm run dev" -ForegroundColor White
    Write-Host "   3. Abre la consola del navegador (F12)" -ForegroundColor White
    Write-Host "   4. Busca: ✅ FIREBASE INICIALIZADO`n" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error al actualizar el archivo .env:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

