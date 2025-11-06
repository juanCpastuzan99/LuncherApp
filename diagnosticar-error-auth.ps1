# Script de diagnóstico completo para auth/internal-error

Write-Host "`n🔍 DIAGNÓSTICO COMPLETO: auth/internal-error`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n📋 CHECKLIST DE VERIFICACIÓN:`n" -ForegroundColor Yellow

$checks = @(
    @{
        Name = "1. ¿Agregaste http://localhost:3000 en 'Authorized Redirect URIs'?"
        Question = "¿Sí o No?"
    },
    @{
        Name = "2. ¿Hiciste clic en 'Guardar' (SAVE) después de agregar?"
        Question = "¿Sí o No?"
    },
    @{
        Name = "3. ¿Cuánto tiempo pasó desde que guardaste? (puede tardar 5 min - varias horas)"
        Question = "Tiempo:"
    },
    @{
        Name = "4. ¿Reiniciaste el servidor después de guardar?"
        Question = "¿Sí o No?"
    },
    @{
        Name = "5. ¿En qué puerto está corriendo el servidor ahora?"
        Question = "Puerto:"
    }
)

foreach ($check in $checks) {
    Write-Host "$($check.Name)" -ForegroundColor White
    Write-Host "   $($check.Question)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "`n🔧 SOLUCIONES PASO A PASO:`n" -ForegroundColor Cyan

Write-Host "SOLUCIÓN 1: Verificar que agregaste los Redirect URIs correctamente" -ForegroundColor Yellow
Write-Host "   1. Abre: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "   2. Busca 'OAuth 2.0 Client IDs' > 'Web client (auto created...)'" -ForegroundColor White
Write-Host "   3. En 'Authorized Redirect URIs' DEBE aparecer:" -ForegroundColor White
Write-Host "      ✅ https://launcher-19cfe.firebaseapp.com/_/auth/handler" -ForegroundColor Green
Write-Host "      ✅ http://localhost:3000" -ForegroundColor Green
Write-Host "      (Y otros puertos si los agregaste)`n" -ForegroundColor Gray

Write-Host "SOLUCIÓN 2: Esperar a que se apliquen los cambios" -ForegroundColor Yellow
Write-Host "   Los cambios en Google Cloud Console pueden tardar:" -ForegroundColor White
Write-Host "   - Mínimo: 5 minutos" -ForegroundColor Gray
Write-Host "   - Máximo: Varias horas" -ForegroundColor Gray
Write-Host "   - Promedio: 10-30 minutos`n" -ForegroundColor Gray

Write-Host "SOLUCIÓN 3: Verificar el puerto actual del servidor" -ForegroundColor Yellow
Write-Host "   El código detecta automáticamente el puerto, pero verifica:" -ForegroundColor White
Write-Host "   - Abre la consola del navegador (F12)" -ForegroundColor White
Write-Host "   - Mira la URL: debe ser http://localhost:XXXX" -ForegroundColor White
Write-Host "   - Ese puerto DEBE estar en Redirect URIs`n" -ForegroundColor White

Write-Host "SOLUCIÓN 4: Probar con signInWithRedirect directamente" -ForegroundColor Yellow
Write-Host "   El código ya tiene fallback automático, pero si persiste:" -ForegroundColor White
Write-Host "   - El sistema intentará redirect automáticamente" -ForegroundColor Gray
Write-Host "   - Si el redirect falla, el problema es de configuración OAuth`n" -ForegroundColor Gray

Write-Host "SOLUCIÓN 5: Verificar en la consola del navegador" -ForegroundColor Yellow
Write-Host "   1. Abre la consola (F12)" -ForegroundColor White
Write-Host "   2. Intenta hacer login con Google" -ForegroundColor White
Write-Host "   3. Mira los mensajes de error en la consola" -ForegroundColor White
Write-Host "   4. Busca mensajes que digan:" -ForegroundColor White
Write-Host "      - 'Popup falló, código de error: auth/internal-error'" -ForegroundColor Gray
Write-Host "      - 'Cambiando a método redirect...'" -ForegroundColor Gray
Write-Host "      - 'Error al iniciar redirect: ...'`n" -ForegroundColor Gray

Write-Host "💡 TIPS ADICIONALES:`n" -ForegroundColor Cyan
Write-Host "   - Cierra completamente el navegador/Electron y vuelve a abrir" -ForegroundColor White
Write-Host "   - Limpia la caché del navegador (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   - Verifica que no haya un firewall bloqueando localhost" -ForegroundColor White
Write-Host "   - Prueba con un navegador diferente temporalmente" -ForegroundColor White

Write-Host "`n🚨 SI NADA FUNCIONA:" -ForegroundColor Red
Write-Host "   Puede ser que los cambios aún no se hayan aplicado." -ForegroundColor White
Write-Host "   Espera 30 minutos más y vuelve a intentar.`n" -ForegroundColor White

