# PowerShell script untuk setup dan build package
Write-Host "Setting up build environment for GenCV monorepo..." -ForegroundColor Green

# Install tsup di package root
Write-Host "Installing tsup in root project..." -ForegroundColor Cyan
npm install --save-dev tsup

# Buat folder dist jika belum ada
$packages = @("lib-ai", "types", "utils", "ui")
foreach ($pkg in $packages) {
    $distPath = "packages/$pkg/dist"
    if (-not (Test-Path $distPath)) {
        Write-Host "Creating $distPath directory..." -ForegroundColor Cyan
        New-Item -Path $distPath -ItemType Directory -Force | Out-Null
    }
}

# Build semua package
Write-Host "Building all packages..." -ForegroundColor Green
npm run build:packages

Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps for Vercel deployment:" -ForegroundColor Yellow
Write-Host "1. Commit these changes to your repository" -ForegroundColor Yellow
Write-Host "2. Push to your Git provider (GitHub/GitLab/Bitbucket)" -ForegroundColor Yellow
Write-Host "3. In Vercel, set your root directory to 'apps/web'" -ForegroundColor Yellow
Write-Host "4. Ensure 'buildCommand' in vercel.json is used" -ForegroundColor Yellow
Write-Host "5. Deploy your application" -ForegroundColor Yellow
