# Script para abrir directamente las URLs de configuración de OAuth
Write-Host "`n🔧 Abriendo URLs de Configuración de OAuth...`n" -ForegroundColor Cyan

$projectId = "launcher-19cfe"
$port = "5174"

# URLs importantes
$urls = @{
    "Google Cloud Console - OAuth Credentials" = "https://console.cloud.google.com/apis/credentials?project=$projectId"
    "Firebase Console - Auth Settings" = "https://console.firebase.google.com/project/$projectId/authentication/settings"
    "Firebase Console - Sign-in Methods" = "https://console.firebase.google.com/project/$projectId/authentication/providers"
}

Write-Host "📋 Abriendo las siguientes URLs en tu navegador:`n" -ForegroundColor Yellow

foreach ($name in $urls.Keys) {
    $url = $urls[$name]
    Write-Host "  🌐 $name" -ForegroundColor White
    Write-Host "     $url" -ForegroundColor Cyan
    Start-Process $url
    Start-Sleep -Seconds 1
}

Write-Host "`n✅ URLs abiertas en tu navegador`n" -ForegroundColor Green

Write-Host "📝 INSTRUCCIONES RÁPIDAS:`n" -ForegroundColor Yellow

Write-Host "1️⃣ En Google Cloud Console (primera pestaña):" -ForegroundColor Cyan
Write-Host "   a) Busca 'OAuth 2.0 Client IDs'" -ForegroundColor White
Write-Host "   b) Haz clic en el OAuth Client ID (Web application)" -ForegroundColor White
Write-Host "   c) En 'Authorized JavaScript origins':" -ForegroundColor White
Write-Host "      - Haz clic en '+ ADD URI'" -ForegroundColor Gray
Write-Host "      - Agrega: http://localhost:$port" -ForegroundColor Green
Write-Host "   d) En 'Authorized redirect URIs':" -ForegroundColor White
Write-Host "      - Haz clic en '+ ADD URI'" -ForegroundColor Gray
Write-Host "      - Agrega: http://localhost:$port" -ForegroundColor Green
Write-Host "   e) Haz clic en 'SAVE'`n" -ForegroundColor White

Write-Host "2️⃣ En Firebase Console - Auth Settings (segunda pestaña):" -ForegroundColor Cyan
Write-Host "   a) Verifica que 'localhost' esté en 'Authorized domains'" -ForegroundColor White
Write-Host "   b) Si NO está, agrégalo (SIN puerto, solo 'localhost')`n" -ForegroundColor White

Write-Host "3️⃣ En Firebase Console - Sign-in Methods (tercera pestaña):" -ForegroundColor Cyan
Write-Host "   a) Verifica que Google esté 'Habilitado'`n" -ForegroundColor White

Write-Host "4️⃣ Después de configurar:" -ForegroundColor Cyan
Write-Host "   - Reinicia el servidor: npm run dev" -ForegroundColor White
Write-Host "   - Prueba iniciar sesión con Google`n" -ForegroundColor White

Write-Host "`n" -ForegroundColor White

