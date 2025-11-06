# Script para crear archivo .env con template

$envContent = @"
# ============================================
# Configuración de Firebase
# ============================================
# Reemplaza los valores con tus credenciales de Firebase
# Obtén estas credenciales desde: https://console.firebase.google.com/
# Proyecto → Configuración ⚙️ → Tus aplicaciones → Web App

VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=launcher-19cfe
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ============================================
# Opcional: Firebase Emulator (Solo desarrollo)
# ============================================
# VITE_USE_FIREBASE_EMULATOR=false
"@

if (Test-Path ".env") {
    Write-Host "⚠️  El archivo .env ya existe" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Operación cancelada" -ForegroundColor Red
        exit
    }
}

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ Archivo .env creado exitosamente" -ForegroundColor Green
Write-Host "`n📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Abre el archivo .env" -ForegroundColor White
Write-Host "2. Obtén tus credenciales de Firebase Console" -ForegroundColor White
Write-Host "3. Reemplaza los valores 'tu-...' con tus credenciales reales" -ForegroundColor White
Write-Host "4. Reinicia el servidor: npm run dev`n" -ForegroundColor White
Write-Host "📚 Ver CONFIGURAR_ENV.md para más detalles" -ForegroundColor Yellow

