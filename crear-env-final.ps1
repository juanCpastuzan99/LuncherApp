# Script simple para crear archivo .env con credenciales de Firebase

$envPath = "$PSScriptRoot\.env"

$content = @"
# Configuracion de Firebase
# Generado automaticamente

VITE_FIREBASE_API_KEY=AIzaSyCIKVkXQWBSHlSzoXi0-T4YhIwa5OXJ8gc
VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcher-19cfe
VITE_FIREBASE_STORAGE_BUCKET=launcher-19cfe.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1099497136710
VITE_FIREBASE_APP_ID=1:1099497136710:web:00808d964ff4999914e047
measurementId=G-R8V8Q99073
"@

if (Test-Path $envPath) {
    $backup = "$envPath.backup"
    Copy-Item $envPath $backup -Force
    Write-Host "Backup creado: $backup"
}

$content | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "Archivo .env creado/actualizado correctamente!"
Write-Host "Ruta: $envPath"
Write-Host ""
Write-Host "IMPORTANTE: Reinicia el servidor ahora (Ctrl+C y luego npm run dev)"

