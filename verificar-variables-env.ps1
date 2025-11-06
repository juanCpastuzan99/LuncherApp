# Script para verificar que las variables de entorno estén correctamente configuradas

Write-Host "`n🔍 Verificación Completa de Variables de Entorno Firebase`n" -ForegroundColor Cyan

# 1. Verificar archivo .env
Write-Host "1️⃣ Verificando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Archivo .env encontrado" -ForegroundColor Green
    $envPath = Resolve-Path ".env"
    Write-Host "   📁 Ubicación: $envPath" -ForegroundColor Gray
    
    # Leer contenido
    $content = Get-Content ".env" -Raw
    $lines = $content -split "`n" | Where-Object { $_ -match "^VITE_" -and $_ -notmatch "^#" }
    
    Write-Host "   📋 Variables encontradas: $($lines.Count)" -ForegroundColor White
} else {
    Write-Host "   ❌ Archivo .env NO encontrado" -ForegroundColor Red
    Write-Host "   💡 Crea el archivo .env en la raíz del proyecto (parcial/.env)" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar formato y contenido
Write-Host "`n2️⃣ Verificando formato y contenido..." -ForegroundColor Yellow
$requiredVars = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
)

$issues = @()
$allValid = $true

foreach ($var in $requiredVars) {
    if ($content -match "$var=(.+)") {
        $value = $matches[1].Trim()
        
        # Verificar formato
        if ($value -match '^["'']') {
            $issues += "❌ $var tiene comillas (no deben tener comillas)"
            $allValid = $false
        } elseif ($value -match '^\s|\s$') {
            $issues += "⚠️  $var tiene espacios al inicio/final"
        } elseif ([string]::IsNullOrWhiteSpace($value) -or $value -eq "tu-..." -or $value -match "^tu-") {
            $issues += "❌ $var está vacío o tiene valor placeholder"
            $allValid = $false
        } else {
            # Mostrar preview (ocultar valores sensibles)
            $preview = if ($var -eq "VITE_FIREBASE_API_KEY") {
                if ($value.Length -gt 15) {
                    $value.Substring(0, 10) + "..." + $value.Substring($value.Length - 4)
                } else {
                    "***"
                }
            } else {
                $value
            }
            Write-Host "   ✅ $var = $preview" -ForegroundColor Green
        }
    } else {
        $issues += "❌ $var NO encontrada en el archivo"
        $allValid = $false
    }
}

if ($issues.Count -gt 0) {
    Write-Host "`n⚠️  Problemas encontrados:" -ForegroundColor Yellow
    $issues | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
}

# 3. Verificar ubicación relativa a vite.config.ts
Write-Host "`n3️⃣ Verificando ubicación..." -ForegroundColor Yellow
$envPath = Resolve-Path ".env" -ErrorAction SilentlyContinue
$vitePath = Resolve-Path "vite.config.ts" -ErrorAction SilentlyContinue

if ($envPath -and $vitePath) {
    $envDir = Split-Path $envPath -Parent
    $viteDir = Split-Path $vitePath -Parent
    
    if ($envDir -eq $viteDir) {
        Write-Host "   ✅ .env y vite.config.ts están en el mismo directorio" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env y vite.config.ts están en directorios diferentes" -ForegroundColor Yellow
        Write-Host "      .env: $envDir" -ForegroundColor Gray
        Write-Host "      vite.config.ts: $viteDir" -ForegroundColor Gray
        Write-Host "   💡 Verifica que envDir esté configurado en vite.config.ts" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  No se pudo verificar la ubicación" -ForegroundColor Yellow
}

# 4. Verificar configuración de Vite
Write-Host "`n4️⃣ Verificando configuración de Vite..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    if ($viteConfig -match "envDir") {
        Write-Host "   ✅ envDir está configurado en vite.config.ts" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  envDir NO está configurado en vite.config.ts" -ForegroundColor Yellow
        Write-Host "   💡 Agrega: envDir: path.resolve(__dirname)" -ForegroundColor Yellow
    }
    
    if ($viteConfig -match "envPrefix") {
        Write-Host "   ✅ envPrefix está configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  envPrefix NO está configurado" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ vite.config.ts NO encontrado" -ForegroundColor Red
}

# Resumen
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
if ($allValid -and $envPath -and $vitePath) {
    Write-Host "✅ VERIFICACIÓN EXITOSA" -ForegroundColor Green
    Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Reinicia el servidor: npm run dev" -ForegroundColor White
    Write-Host "   2. Abre la aplicación" -ForegroundColor White
    Write-Host "   3. Abre la consola del navegador (F12)" -ForegroundColor White
    Write-Host "   4. Busca el mensaje: '🔍 Verificación de Variables de Entorno Firebase'" -ForegroundColor White
    Write-Host "   5. Verifica que todas las variables muestren ✅" -ForegroundColor White
} else {
    Write-Host "❌ VERIFICACIÓN FALLIDA" -ForegroundColor Red
    Write-Host "`n💡 Solución:" -ForegroundColor Yellow
    Write-Host "   1. Verifica que el archivo .env existe en la raíz" -ForegroundColor White
    Write-Host "   2. Verifica que todas las variables estén correctamente formateadas" -ForegroundColor White
    Write-Host "   3. Reinicia el servidor después de modificar .env" -ForegroundColor White
    Write-Host "   4. Verifica que envDir esté en vite.config.ts" -ForegroundColor White
}
Write-Host ("=" * 60) + "`n" -ForegroundColor Gray

