# Script para verificar la configuración de Google Sign-In

Write-Host "`n🔍 Verificando configuración de Google Sign-In...`n" -ForegroundColor Cyan

# Verificar archivo .env
Write-Host "1️⃣ Verificando variables de entorno:" -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID")
    $allPresent = $true
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=(.+)") {
            $value = $matches[1].Trim()
            if ([string]::IsNullOrWhiteSpace($value) -or $value -eq "tu-...") {
                Write-Host "   ❌ $var está vacío" -ForegroundColor Red
                $allPresent = $false
            } else {
                Write-Host "   ✅ $var configurada" -ForegroundColor Green
            }
        } else {
            Write-Host "   ❌ $var NO encontrada" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host "   ✅ Todas las variables están configuradas`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Hay problemas con las variables`n" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Archivo .env NO existe`n" -ForegroundColor Red
}

Write-Host "2️⃣ Verificando código:" -ForegroundColor Yellow
$authFile = "src/firebase/auth.ts"
if (Test-Path $authFile) {
    $authContent = Get-Content $authFile -Raw
    if ($authContent -match "signInWithGoogle") {
        Write-Host "   ✅ Función signInWithGoogle encontrada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Función signInWithGoogle NO encontrada" -ForegroundColor Red
    }
    
    if ($authContent -match "GoogleAuthProvider") {
        Write-Host "   ✅ GoogleAuthProvider configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GoogleAuthProvider NO configurado" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Archivo auth.ts NO encontrado`n" -ForegroundColor Red
}

Write-Host "`n3️⃣ Pasos siguientes:" -ForegroundColor Yellow
Write-Host "   1. Ve a Firebase Console: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "   2. Selecciona tu proyecto: launcher-19cfe" -ForegroundColor White
Write-Host "   3. Ve a Authentication > Sign-in method" -ForegroundColor White
Write-Host "   4. Habilita Google como proveedor" -ForegroundColor White
Write-Host "   5. Guarda los cambios" -ForegroundColor White
Write-Host "`n   📚 Ver HABILITAR_GOOGLE_SIGNIN.md para más detalles`n" -ForegroundColor Cyan

Write-Host "4️⃣ Para probar:" -ForegroundColor Yellow
Write-Host "   1. Reinicia el servidor: npm run dev" -ForegroundColor White
Write-Host "   2. Abre la aplicación" -ForegroundColor White
Write-Host "   3. Haz clic en ⚙️ > Cuenta" -ForegroundColor White
Write-Host "   4. Haz clic en 'Continuar con Google'`n" -ForegroundColor White

