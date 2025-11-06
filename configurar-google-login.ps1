# Script para configurar Google Sign-In en Firebase

Write-Host "`n🔐 Configuración de Google Sign-In para Firebase`n" -ForegroundColor Cyan

Write-Host "📋 Pasos para habilitar Google Sign-In:`n" -ForegroundColor Yellow

Write-Host "1️⃣ Abre Firebase Console:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/launcher-19cfe/authentication/providers`n" -ForegroundColor Cyan

Write-Host "2️⃣ Habilita Google como proveedor:" -ForegroundColor White
Write-Host "   - Ve a: Authentication > Sign-in method" -ForegroundColor Gray
Write-Host "   - Haz clic en 'Google' en la lista" -ForegroundColor Gray
Write-Host "   - Activa el toggle 'Enable'" -ForegroundColor Gray
Write-Host "   - Selecciona un email de soporte (puede ser el tuyo)" -ForegroundColor Gray
Write-Host "   - Haz clic en 'Save'`n" -ForegroundColor Gray

Write-Host "3️⃣ Verifica dominios autorizados:" -ForegroundColor White
Write-Host "   - Ve a: Authentication > Settings" -ForegroundColor Gray
Write-Host "   - Desplázate hasta 'Authorized domains'" -ForegroundColor Gray
Write-Host "   - Verifica que 'localhost' esté en la lista" -ForegroundColor Gray
Write-Host "   - Si no está, haz clic en 'Add domain' y agrega 'localhost'`n" -ForegroundColor Gray

Write-Host "4️⃣ Verifica la configuración de la app:" -ForegroundColor White
Write-Host "   - Ve a: Project Settings > Your apps" -ForegroundColor Gray
Write-Host "   - Verifica que tu app web tenga:" -ForegroundColor Gray
Write-Host "     ✓ API Key configurada" -ForegroundColor Green
Write-Host "     ✓ Auth Domain: launcher-19cfe.firebaseapp.com`n" -ForegroundColor Green

Write-Host "✅ Después de configurar:" -ForegroundColor Yellow
Write-Host "   1. Reinicia el servidor: npm run dev" -ForegroundColor White
Write-Host "   2. Abre la aplicación" -ForegroundColor White
Write-Host "   3. Haz clic en ⚙️ > Cuenta" -ForegroundColor White
Write-Host "   4. Haz clic en 'Continuar con Google'`n" -ForegroundColor White

Write-Host "🔗 Enlaces directos:" -ForegroundColor Yellow
Write-Host "   • Proveedores de autenticación:" -ForegroundColor White
Write-Host "     https://console.firebase.google.com/project/launcher-19cfe/authentication/providers" -ForegroundColor Cyan
Write-Host "   • Configuración del proyecto:" -ForegroundColor White
Write-Host "     https://console.firebase.google.com/project/launcher-19cfe/settings/general`n" -ForegroundColor Cyan

Write-Host "📚 Documentación completa: HABILITAR_GOOGLE_SIGNIN.md`n" -ForegroundColor Cyan

