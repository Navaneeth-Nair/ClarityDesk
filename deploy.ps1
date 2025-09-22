# GitHub Pages Deployment Script
# This script manually deploys the React build to gh-pages branch

Write-Host "Starting GitHub Pages deployment..." -ForegroundColor Green

# Ensure we're in the right directory
Set-Location "C:\Development\codefest2k25hackathon"

# Build the React app
Write-Host "Building React application..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

# Create a temporary directory for deployment
$tempDir = "temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir

# Copy build files to temp directory
Write-Host "Copying build files..." -ForegroundColor Yellow
Copy-Item -Path "frontend\build\*" -Destination $tempDir -Recurse

# Initialize git in temp directory and push to gh-pages
Set-Location $tempDir
git init
git add .
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/Navaneeth-Nair/Code-fest-2025-Hackathon.git
git push -f origin gh-pages

# Clean up
Set-Location ..
Remove-Item $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://navaneeth-nair.github.io/Code-fest-2025-Hackathon/" -ForegroundColor Cyan