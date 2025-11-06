# Script para limpiar archivos innecesarios del repositorio git

Write-Host "`n🧹 LIMPIANDO ARCHIVOS INNECESARIOS DEL REPOSITORIO`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Cambiar al directorio del proyecto
$projectRoot = Split-Path -Parent $PSScriptRoot
$parcialPath = Join-Path $projectRoot "parcial"

Write-Host "`n📋 Buscando archivos que NO deberían estar en git...`n" -ForegroundColor Yellow

# Patrones de archivos a eliminar
$patternsToRemove = @(
    # Archivos sensibles
    "**/serviceAccountKey.json",
    "**/firebase-adminsdk-*.json",
    
    # Scripts de diagnóstico
    "**/diagnosticar-*.ps1",
    "**/verificar-*.ps1",
    "**/limpiar-cache.ps1",
    "**/abrir-configuracion-*.ps1",
    "**/configurar-oauth-*.ps1",
    "**/configurar-google-*.ps1",
    "**/actualizar-env.ps1",
    "**/crear-env.ps1",
    "**/verificar-y-reiniciar.ps1",
    
    # Scripts de deploy temporales
    "**/deploy-*.ps1",
    "**/DESPLEGAR_*.ps1",
    "**/configurar-y-desplegar.ps1",
    
    # Documentación temporal
    "**/SOLUCION_*.md",
    "**/CONFIGURAR_*.md",
    "**/GUIA_*.md",
    "**/HABILITAR_*.md",
    "**/LOGIN_*.md",
    "**/DOMINIOS_*.md",
    "**/VERIFICACION_*.md",
    "**/CHECKLIST_*.md",
    "**/DEPLOY_*.md",
    "**/PASOS_*.md",
    "**/COMANDOS_*.md",
    "**/ACTUALIZAR_*.md",
    "**/VENTANA_*.md",
    
    # Archivos de build
    "**/out/",
    "**/build/",
    "**/dist-electron/"
)

$filesToRemove = @()

# Buscar archivos rastreados por git que coincidan con los patrones
Write-Host "Buscando archivos en git..." -ForegroundColor White

foreach ($pattern in $patternsToRemove) {
    $relativePattern = $pattern -replace '\*\*/', ''
    $gitFiles = git ls-files | Where-Object { $_ -like "*parcial/$relativePattern" -or $_ -like "*$relativePattern" }
    
    foreach ($file in $gitFiles) {
        if (-not ($filesToRemove -contains $file)) {
            $filesToRemove += $file
        }
    }
}

if ($filesToRemove.Count -eq 0) {
    Write-Host "`n✅ No se encontraron archivos innecesarios rastreados por git.`n" -ForegroundColor Green
    Write-Host "💡 Esto significa que:" -ForegroundColor Cyan
    Write-Host "   - Los archivos ya están en .gitignore" -ForegroundColor White
    Write-Host "   - O nunca fueron agregados al repositorio`n" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Se encontraron $($filesToRemove.Count) archivos que deberían eliminarse:`n" -ForegroundColor Yellow
    
    foreach ($file in $filesToRemove) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    
    Write-Host "`n¿Deseas eliminar estos archivos del índice de git? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "`n🗑️  Eliminando archivos del índice de git...`n" -ForegroundColor Cyan
        
        foreach ($file in $filesToRemove) {
            git rm --cached "$file" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Eliminado: $file" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  No se pudo eliminar: $file (puede que ya no esté en git)" -ForegroundColor Yellow
            }
        }
        
        Write-Host "`n✅ Archivos eliminados del índice de git.`n" -ForegroundColor Green
        Write-Host "📋 PRÓXIMOS PASOS:`n" -ForegroundColor Cyan
        Write-Host "1. Revisa los cambios: git status" -ForegroundColor White
        Write-Host "2. Haz commit de los cambios:" -ForegroundColor White
        Write-Host "   git commit -m 'chore: eliminar archivos innecesarios del repositorio'" -ForegroundColor Gray
        Write-Host "3. Los archivos permanecerán en tu sistema local, solo se eliminaron de git.`n" -ForegroundColor White
    } else {
        Write-Host "`n❌ Operación cancelada. Los archivos no fueron eliminados.`n" -ForegroundColor Yellow
    }
}

# Verificar archivos no rastreados que deberían estar en .gitignore
Write-Host "`n📋 Verificando archivos no rastreados que deberían estar en .gitignore...`n" -ForegroundColor Yellow

$untrackedFiles = git ls-files --others --exclude-standard "Documents/PARCIAL ELECTIVA PROFECIONAL/parcial/" | Select-Object -First 20

if ($untrackedFiles.Count -gt 0) {
    Write-Host "ℹ️  Archivos no rastreados encontrados (esto es normal si están en .gitignore):" -ForegroundColor Cyan
    foreach ($file in $untrackedFiles) {
        Write-Host "   - $file" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ Todos los archivos están correctamente configurados.`n" -ForegroundColor Green
}

Write-Host "`nRECOMENDACION:" -ForegroundColor Cyan
Write-Host "   El archivo .gitignore ya fue actualizado para evitar agregar archivos innecesarios en el futuro.`n" -ForegroundColor White

