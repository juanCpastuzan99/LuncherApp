# Script de Diagnóstico para Google Sign-In en Firebase
# Este script ayuda a diagnosticar problemas con Google Sign-In

Write-Host "`n🔍 DIAGNÓSTICO DE GOOGLE SIGN-IN`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Verificar variables de entorno
Write-Host "`n1️⃣ Verificando Variables de Entorno...`n" -ForegroundColor Yellow

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    $requiredVars = @(
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_STORAGE_BUCKET",
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
        "VITE_FIREBASE_APP_ID"
    )
    
    $missingVars = @()
    $emptyVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=(.+?)(?:\r?\n|$)") {
            $value = $matches[1].Trim()
            if ($value -eq "" -or $value -match '^["\''].*["\''']$') {
                $emptyVars += $var
                Write-Host "  ⚠️  $var está vacío o tiene comillas" -ForegroundColor Yellow
            } elseif ($value -match '^tu-') {
                $emptyVars += $var
                Write-Host "  ⚠️  $var tiene valor placeholder" -ForegroundColor Yellow
            } else {
                Write-Host "  ✅ $var configurado" -ForegroundColor Green
            }
        } else {
            $missingVars += $var
            Write-Host "  ❌ $var NO encontrado" -ForegroundColor Red
        }
    }
    
    if ($missingVars.Count -gt 0 -or $emptyVars.Count -gt 0) {
        Write-Host "`n❌ Hay problemas con las variables de entorno" -ForegroundColor Red
        Write-Host "   Solución: Verifica el archivo .env y reinicia el servidor`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ Todas las variables de entorno están configuradas correctamente" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Archivo .env NO encontrado en: $envFile" -ForegroundColor Red
    Write-Host "   Solución: Crea el archivo .env con las variables de Firebase`n" -ForegroundColor Yellow
}

# Verificar dominio
Write-Host "`n2️⃣ Verificando Dominio...`n" -ForegroundColor Yellow
Write-Host "  Dominio actual: localhost" -ForegroundColor White
Write-Host "  ℹ️  Asegúrate de que 'localhost' esté en los dominios autorizados en Firebase Console`n" -ForegroundColor Cyan

# Instrucciones para Firebase Console
Write-Host "`n3️⃣ PASOS PARA HABILITAR GOOGLE SIGN-IN EN FIREBASE CONSOLE:`n" -ForegroundColor Yellow

Write-Host "  PASO 1: Habilitar Google Sign-In" -ForegroundColor Cyan
Write-Host "    1. Ve a: https://console.firebase.google.com" -ForegroundColor White
Write-Host "    2. Selecciona tu proyecto" -ForegroundColor White
Write-Host "    3. Ve a: Authentication > Sign-in method" -ForegroundColor White
Write-Host "    4. Busca 'Google' en la lista de proveedores" -ForegroundColor White
Write-Host "    5. Haz clic en 'Google'" -ForegroundColor White
Write-Host "    6. Activa el toggle 'Habilitar'" -ForegroundColor White
Write-Host "    7. Ingresa el Email de soporte (puede ser tu email)" -ForegroundColor White
Write-Host "    8. Haz clic en 'Guardar'`n" -ForegroundColor White

Write-Host "  PASO 2: Verificar Dominios Autorizados" -ForegroundColor Cyan
Write-Host "    1. En Authentication, ve a la pestaña 'Settings' (Configuración)" -ForegroundColor White
Write-Host "    2. Desplázate hasta 'Authorized domains' (Dominios autorizados)" -ForegroundColor White
Write-Host "    3. Verifica que 'localhost' esté en la lista" -ForegroundColor White
Write-Host "    4. Si NO está, haz clic en 'Add domain' (Agregar dominio)" -ForegroundColor White
Write-Host "    5. Ingresa 'localhost' y haz clic en 'Add'`n" -ForegroundColor White

Write-Host "  PASO 3: Verificar Configuración del Proyecto" -ForegroundColor Cyan
Write-Host "    1. Ve a: Project Settings > General" -ForegroundColor White
Write-Host "    2. Verifica que el 'Project ID' coincida con VITE_FIREBASE_PROJECT_ID en .env" -ForegroundColor White
Write-Host "    3. Verifica que el 'Web API Key' coincida con VITE_FIREBASE_API_KEY en .env`n" -ForegroundColor White

Write-Host "`n4️⃣ SOLUCIÓN RÁPIDA:`n" -ForegroundColor Yellow
Write-Host "  Si Google Sign-In ya está habilitado pero sigue fallando:" -ForegroundColor White
Write-Host "    1. Deshabilita Google Sign-In en Firebase Console" -ForegroundColor White
Write-Host "    2. Espera 10 segundos" -ForegroundColor White
Write-Host "    3. Vuelve a habilitarlo" -ForegroundColor White
Write-Host "    4. Guarda los cambios" -ForegroundColor White
Write-Host "    5. Reinicia el servidor de desarrollo (npm run dev)`n" -ForegroundColor White

Write-Host "`n5️⃣ VERIFICACIÓN FINAL:`n" -ForegroundColor Yellow
Write-Host "  Después de realizar los pasos anteriores:" -ForegroundColor White
Write-Host "    1. Reinicia el servidor: npm run dev" -ForegroundColor Cyan
Write-Host "    2. Abre la aplicación" -ForegroundColor Cyan
Write-Host "    3. Ve a Configuración > Cuenta" -ForegroundColor Cyan
Write-Host "    4. Intenta iniciar sesión con Google nuevamente`n" -ForegroundColor Cyan

Write-Host "`n" -ForegroundColor White
Write-Host "📚 Enlaces útiles:" -ForegroundColor Cyan
Write-Host "  - Firebase Console: https://console.firebase.google.com" -ForegroundColor White
Write-Host "  - Authentication Settings: https://console.firebase.google.com/project/_/authentication/settings" -ForegroundColor White
Write-Host "  - Sign-in Methods: https://console.firebase.google.com/project/_/authentication/providers" -ForegroundColor White

Write-Host "`n" -ForegroundColor White

