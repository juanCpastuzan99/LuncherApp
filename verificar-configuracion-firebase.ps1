# Script de Verificación Completa de Firebase
Write-Host "`n🔍 VERIFICACIÓN COMPLETA DE FIREBASE`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Verificar archivo .env
Write-Host "`n1️⃣ Verificando archivo .env...`n" -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content $envFile -Raw
    
    # Verificar variables críticas
    $vars = @{
        "VITE_FIREBASE_API_KEY" = "API Key"
        "VITE_FIREBASE_AUTH_DOMAIN" = "Auth Domain"
        "VITE_FIREBASE_PROJECT_ID" = "Project ID"
    }
    
    foreach ($var in $vars.Keys) {
        if ($envContent -match "$var=(.+?)(?:\r?\n|$)") {
            $value = $matches[1].Trim()
            if ($value -and -not $value.StartsWith('tu-') -and -not $value.StartsWith('"')) {
                Write-Host "  ✅ $($vars[$var]): Configurado" -ForegroundColor Green
                if ($var -eq "VITE_FIREBASE_PROJECT_ID") {
                    Write-Host "     Valor: $value" -ForegroundColor Gray
                }
            } else {
                Write-Host "  ❌ $($vars[$var]): NO configurado o tiene comillas" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ $($vars[$var]): NO encontrado" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Archivo .env NO encontrado" -ForegroundColor Red
}

# 2. Verificar servidor
Write-Host "`n2️⃣ Verificando servidor...`n" -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor corriendo en http://localhost:5174" -ForegroundColor Green
        $serverRunning = $true
    }
} catch {
    Write-Host "⚠️  Servidor NO está corriendo o no responde" -ForegroundColor Yellow
    Write-Host "   Ejecuta: npm run dev" -ForegroundColor Cyan
}

# 3. Instrucciones para Firebase Console
Write-Host "`n3️⃣ VERIFICACIÓN EN FIREBASE CONSOLE:`n" -ForegroundColor Yellow

Write-Host "A. Verificar Google Sign-In está habilitado:" -ForegroundColor Cyan
Write-Host "   1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/providers" -ForegroundColor White
Write-Host "   2. Busca 'Google' en la lista" -ForegroundColor White
Write-Host "   3. Debe mostrar 'Habilitada' (Enabled) con check verde ✅" -ForegroundColor White
Write-Host "   4. Si NO está habilitado:" -ForegroundColor White
Write-Host "      - Haz clic en 'Google'" -ForegroundColor Gray
Write-Host "      - Activa el toggle 'Enable'" -ForegroundColor Gray
Write-Host "      - Selecciona email de soporte" -ForegroundColor Gray
Write-Host "      - Haz clic en 'Save'`n" -ForegroundColor Gray

Write-Host "B. Verificar Dominios Autorizados:" -ForegroundColor Cyan
Write-Host "   1. Ve a: https://console.firebase.google.com/project/launcher-19cfe/authentication/settings" -ForegroundColor White
Write-Host "   2. Desplázate hasta 'Authorized domains'" -ForegroundColor White
Write-Host "   3. DEBE incluir estos dominios:" -ForegroundColor White
Write-Host "      ✅ localhost" -ForegroundColor Green
Write-Host "      ✅ 127.0.0.1 (opcional pero recomendado)" -ForegroundColor Green
Write-Host "      ✅ launcher-19cfe.firebaseapp.com (automático)" -ForegroundColor Green
Write-Host "   4. Si 'localhost' NO está:" -ForegroundColor White
Write-Host "      - Haz clic en 'Add domain'" -ForegroundColor Gray
Write-Host "      - Escribe: localhost (sin http://, sin puerto)" -ForegroundColor Gray
Write-Host "      - Haz clic en 'Add'`n" -ForegroundColor Gray

Write-Host "C. Verificar OAuth en Google Cloud Console:" -ForegroundColor Cyan
Write-Host "   1. Ve a: https://console.cloud.google.com/apis/credentials?project=launcher-19cfe" -ForegroundColor White
Write-Host "   2. Busca 'OAuth 2.0 Client IDs'" -ForegroundColor White
Write-Host "   3. Debe haber uno para 'Web application'" -ForegroundColor White
Write-Host "   4. Si no existe, Firebase debería crearlo automáticamente" -ForegroundColor White
Write-Host "   5. Si hay problemas, verifica:" -ForegroundColor White
Write-Host "      - Authorized JavaScript origins incluye: http://localhost:5174" -ForegroundColor Gray
Write-Host "      - Authorized redirect URIs incluye: http://localhost:5174" -ForegroundColor Gray

# 4. Pasos de solución
Write-Host "`n4️⃣ PASOS DE SOLUCIÓN:`n" -ForegroundColor Yellow

Write-Host "1. Verifica que Google Sign-In esté habilitado (paso A arriba)" -ForegroundColor White
Write-Host "2. Verifica que 'localhost' esté en dominios autorizados (paso B arriba)" -ForegroundColor White
Write-Host "3. Si hiciste cambios, ESPERA 10-30 segundos" -ForegroundColor White
Write-Host "4. REINICIA el servidor:" -ForegroundColor Cyan
Write-Host "   - Detén el servidor (Ctrl+C)" -ForegroundColor Gray
Write-Host "   - Ejecuta: npm run dev" -ForegroundColor Gray
Write-Host "   - Espera a que inicie completamente" -ForegroundColor Gray
Write-Host "5. Limpia la caché del navegador (si es necesario)" -ForegroundColor White
Write-Host "6. Intenta iniciar sesión con Google nuevamente`n" -ForegroundColor White

# 5. Verificación en consola del navegador
Write-Host "`n5️⃣ VERIFICACIÓN EN CONSOLA DEL NAVEGADOR:`n" -ForegroundColor Yellow
Write-Host "Abre la consola del navegador (F12) y busca:" -ForegroundColor White
Write-Host "  ✅ 'Firebase inicializado correctamente'" -ForegroundColor Green
Write-Host "  ✅ 'Proyecto: launcher-19cfe'" -ForegroundColor Green
Write-Host "  ✅ 'Auth Domain: launcher-19cfe.firebaseapp.com'" -ForegroundColor Green
Write-Host "  ❌ Si ves errores, cópialos y compártelos`n" -ForegroundColor Red

Write-Host "`n" -ForegroundColor White

