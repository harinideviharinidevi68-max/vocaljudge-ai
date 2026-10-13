# VocalJudge AI - GitHub Push Helper Script
param(
    [string]$RepoUrl = ""
)

if (-not $RepoUrl) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "VocalJudge AI - Push to GitHub" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "1. Create a new repository on GitHub: https://github.com/new"
    Write-Host "   - Repository name: vocaljudge-ai (or AI_Multimodel)"
    Write-Host "   - Public or Private: Public recommended"
    Write-Host "   - Do NOT initialize with README or .gitignore (already created)"
    Write-Host "2. Copy the repository URL (e.g. https://github.com/harinideviharinidevi68/vocaljudge-ai.git)"
    Write-Host ""
    $RepoUrl = Read-Host "Paste your GitHub repository URL"
}

if ($RepoUrl) {
    Write-Host "Configuring remote origin: $RepoUrl" -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $RepoUrl
    git branch -M main
    Write-Host "Pushing main branch to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS! Repository pushed to GitHub." -ForegroundColor Green
    } else {
        Write-Host "`nPush failed. Please ensure you are authenticated or check repository permissions." -ForegroundColor Red
    }
}
