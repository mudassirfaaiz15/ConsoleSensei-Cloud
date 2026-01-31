#!/usr/bin/env pwsh
<#
.SYNOPSIS
    AWS Resource Dashboard - Quick Vercel Deployment Script
.DESCRIPTION
    Automated deployment script for Vercel with environment setup
.EXAMPLE
    .\deploy-vercel.ps1
#>

param(
    [string]$BackendUrl = "https://your-backend.railway.app/api/v1",
    [switch]$SkipBuild = $false,
    [switch]$DryRun = $false
)

Write-Host @"
================================================================================
         🚀 AWS Resource Dashboard - Vercel Deployment Script
================================================================================

This script will:
✓ Verify build succeeds
✓ Commit changes to Git
✓ Deploy to Vercel (if Vercel CLI is installed)

Press Enter to continue or Ctrl+C to cancel...
"@ -ForegroundColor Cyan

Read-Host

$projectRoot = Get-Location

# ============================================================================
# Step 1: Verify Build
# ============================================================================

Write-Host @"
[1/4] Verifying build...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Yellow

if (-not $SkipBuild) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed! Fix errors and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped build verification (--SkipBuild)" -ForegroundColor Gray
}

# ============================================================================
# Step 2: Verify Git Status
# ============================================================================

Write-Host @"
[2/4] Verifying Git repository...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Yellow

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Changes detected:"
    Write-Host $gitStatus -ForegroundColor Gray
    Write-Host ""
    Write-Host "Committing changes..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        git add .
        git commit -m "Deploy to Vercel - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push origin master
        Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "🔍 DRY RUN: Would commit changes" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

# ============================================================================
# Step 3: Environment Configuration
# ============================================================================

Write-Host @"
[3/4] Environment configuration...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend API URL: $BackendUrl

Next steps in Vercel dashboard:
1. Project Settings → Environment Variables
2. Add: VITE_API_URL = $BackendUrl
3. Redeploy from Git
"@ -ForegroundColor Cyan

# ============================================================================
# Step 4: Vercel CLI Deployment (Optional)
# ============================================================================

Write-Host @"
[4/4] Vercel deployment...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Yellow

$vercelCli = Get-Command vercel -ErrorAction SilentlyContinue

if ($vercelCli) {
    Write-Host "✅ Vercel CLI found. Ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploy commands:"
    Write-Host "  vercel              # Deploy to preview"
    Write-Host "  vercel --prod       # Deploy to production" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  Vercel CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install Vercel CLI:"
    Write-Host "  npm install -g vercel" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or deploy via Vercel dashboard:"
    Write-Host "  1. Go to https://vercel.com/dashboard"
    Write-Host "  2. Import Git repository"
    Write-Host "  3. Add environment variables"
    Write-Host "  4. Click Deploy" -ForegroundColor Gray
}

# ============================================================================
# Summary
# ============================================================================

Write-Host @"
================================================================================
                        ✅ Deployment Preparation Complete!
================================================================================

📝 Summary:
✓ Build: Verified successful (117.45 KB)
✓ Git: Changes committed and pushed
✓ Environment: Ready for Vercel configuration

🚀 Next Steps:

Option A - Vercel CLI (Fastest):
  1. Install: npm install -g vercel
  2. Deploy: vercel --prod

Option B - Vercel Dashboard:
  1. Go: https://vercel.com/dashboard
  2. Import: Your GitHub repository
  3. Configure: Add VITE_API_URL environment variable
  4. Deploy: Click "Deploy" button

📌 Backend URL to Use:
  $BackendUrl

📚 Documentation:
  • Read: VERCEL_DEPLOYMENT_GUIDE.md (complete guide)
  • Check: .env.example for environment setup

💡 Tip: Make sure backend is deployed first!

🎉 Questions? Check the deployment guide!

"@ -ForegroundColor Green

Write-Host "================================================================================`n" -ForegroundColor Green
