param(
  [Parameter(Mandatory = $true)]
  [string]$TunnelUrl,
  [string]$Project = "avios"
)

Write-Host "Updating VITE_API_URL for Vercel project '$Project'..." -ForegroundColor Cyan

# Validate URL
if ($TunnelUrl -notmatch "^https://") {
  Write-Host "✗ URL must start with https://" -ForegroundColor Red
  exit 1
}

# Check Vercel CLI
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
  Write-Host "✗ Vercel CLI not found." -ForegroundColor Red
  Write-Host "  Install: npm i -g vercel" -ForegroundColor Yellow
  Write-Host "  Then run: vercel login" -ForegroundColor Yellow
  exit 1
}

# Set env var (non-interactive)
Write-Host "Setting VITE_API_URL = $TunnelUrl" -ForegroundColor Yellow
$result = $TunnelUrl | vercel env add VITE_API_URL production --yes 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "✗ Failed to set env var:" -ForegroundColor Red
  Write-Host $result -ForegroundColor Red
  exit 1
}
Write-Host "✓ Environment variable updated" -ForegroundColor Green

# Redeploy
Write-Host "Redeploying..." -ForegroundColor Yellow
vercel deploy --prod --yes 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Deployed! Your frontend will use the new backend URL after the build completes." -ForegroundColor Green
} else {
  Write-Host "✗ Deploy failed. Try manually in Vercel dashboard." -ForegroundColor Red
}
