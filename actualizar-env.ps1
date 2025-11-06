# Script para actualizar .env con las credenciales de Firebase

$envContent = @"
# ============================================
# Configuración de Firebase
# ============================================
# Proyecto: launcher-19cfe

VITE_FIREBASE_API_KEY=AIzaSyCIKVkXQWBSHlSzoXi0-T4YhIwa5OXJ8gc
VITE_FIREBASE_AUTH_DOMAIN=launcher-19cfe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcher-19cfe
VITE_FIREBASE_STORAGE_BUCKET=launcher-19cfe.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1099497136710
VITE_FIREBASE_APP_ID=1:1099497136710:web:00808d964ff4999914e047

# ============================================
# Opcional: Firebase Emulator (Solo desarrollo)
# ============================================
# VITE_USE_FIREBASE_EMULATOR=false
"@

if (Test-Path ".env") {
    Write-Host "⚠️  El archivo .env ya existe" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo con las nuevas credenciales? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Operación cancelada" -ForegroundColor Red
        exit
    }
}

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "`n✅ Archivo .env actualizado con las credenciales de launcher-19cfe" -ForegroundColor Green
Write-Host "`n📋 Credenciales configuradas:" -ForegroundColor Cyan
Write-Host "   • API Key: AIzaSyCIKVkXQWBSHlSzoXi0-T4YhIwa5OXJ8gc" -ForegroundColor White
Write-Host "   • Auth Domain: launcher-19cfe.firebaseapp.com" -ForegroundColor White
Write-Host "   • Project ID: launcher-19cfe" -ForegroundColor White
Write-Host "   • Storage Bucket: launcher-19cfe.firebasestorage.app" -ForegroundColor White
Write-Host "   • Messaging Sender ID: 1099497136710" -ForegroundColor White
Write-Host "   • App ID: 1:1099497136710:web:00808d964ff4999914e047`n" -ForegroundColor White
Write-Host "🔄 Próximo paso:" -ForegroundColor Yellow
Write-Host "   Reinicia el servidor: npm run dev`n" -ForegroundColor White


