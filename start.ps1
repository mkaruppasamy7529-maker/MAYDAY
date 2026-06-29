param(
  [switch]$SkipVercel
)

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          AVIOS — Launch All            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$LogDir = Join-Path $Root "logs"
$null = New-Item -ItemType Directory -Path $LogDir -Force

# ─── Helper: test if a port is listening ───
function Test-Port($Port) {
  try { $null = [System.Net.Sockets.TcpClient]::new().ConnectAsync("127.0.0.1", $Port).GetAwaiter().GetResult(); return $true }
  catch { return $false }
}

# ─── 1. Ollama ───
Write-Host "[1/4] Checking Ollama..." -ForegroundColor Yellow
if (Test-Port 11434) {
  Write-Host "  ✓ Ollama already running on port 11434" -ForegroundColor Green
} else {
  Write-Host "  Starting Ollama..." -ForegroundColor Yellow
  $ollama = Start-Process -NoNewWindow -PassThru -FilePath "ollama" -ArgumentList "run llama3.2:latest"
  Write-Host "  Waiting for Ollama to be ready..." -ForegroundColor Yellow
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    if (Test-Port 11434) { $ready = $true; break }
    Start-Sleep -Milliseconds 1000
  }
  if (-not $ready) { Write-Host "  ✗ Ollama failed to start. Check it's installed." -ForegroundColor Red; exit 1 }
  Write-Host "  ✓ Ollama ready" -ForegroundColor Green
}

# ─── 2. Install Python deps if needed ───
Write-Host "[2/4] Checking Python dependencies..." -ForegroundColor Yellow
$venvDir = Join-Path $Backend "venv"
if (-not (Test-Path (Join-Path $venvDir "Scripts\python.exe"))) {
  Write-Host "  Creating virtual environment..." -ForegroundColor Yellow
  python -m venv $venvDir
}
$pip = Join-Path $venvDir "Scripts\pip.exe"
$python = Join-Path $venvDir "Scripts\python.exe"
& $pip install -q -r (Join-Path $Backend "requirements.txt")
Write-Host "  ✓ Dependencies ready" -ForegroundColor Green

# ─── 3. Generate JWT secret on first run ───
$envFile = Join-Path $Backend ".env"
$envContent = Get-Content $envFile -Raw
if ($envContent -match "JWT_SECRET=avios-jwt-secret-change-in-production") {
  Write-Host "  Generating JWT secret..." -ForegroundColor Yellow
  $newSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
  $envContent = $envContent -replace "JWT_SECRET=avios-jwt-secret-change-in-production", "JWT_SECRET=$newSecret"
  Set-Content $envFile $envContent
  Write-Host "  ✓ JWT secret generated" -ForegroundColor Green
}

# ─── 4. Backend ───
Write-Host "[3/4] Starting backend..." -ForegroundColor Yellow
$backendLog = Join-Path $LogDir "backend.log"
$backendProc = Start-Process -NoNewWindow -PassThru -FilePath $python -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8001" -WorkingDirectory $Backend -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog
Write-Host "  Waiting for backend on :8001..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  if (Test-Port 8001) { $ready = $true; break }
  Start-Sleep -Milliseconds 1000
}
if (-not $ready) { Write-Host "  ✗ Backend failed to start. Check $backendLog" -ForegroundColor Red; exit 1 }
Write-Host "  ✓ Backend running on http://localhost:8001" -ForegroundColor Green

# ─── 5. Cloudflare Tunnel ───
Write-Host "[4/4] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelLog = Join-Path $LogDir "tunnel.log"
$tunnelProc = Start-Process -NoNewWindow -PassThru -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:8001" -RedirectStandardOutput $tunnelLog -RedirectStandardError $tunnelLog

# Wait for tunnel URL
$tunnelUrl = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 1000
  $content = Get-Content $tunnelLog -Tail 10 -ErrorAction SilentlyContinue
  $match = $content | Select-String "https://[a-zA-Z0-9-]+\.trycloudflare\.com"
  if ($match) {
    $tunnelUrl = $match.Matches[0].Value.Trim()
    break
  }
}

if (-not $tunnelUrl) {
  Write-Host "  ✗ Tunnel URL not detected. Check $tunnelLog" -ForegroundColor Red
  Write-Host "  Manual: run 'cloudflared tunnel --url http://localhost:8001'" -ForegroundColor Yellow
} else {
  Write-Host "  ✓ Tunnel URL: $tunnelUrl" -ForegroundColor Green
}

# ─── Summary ───
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              All Running!               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:8001" -ForegroundColor White
if ($tunnelUrl) {
  Write-Host "  Tunnel:    $tunnelUrl" -ForegroundColor White
}
Write-Host "  Logs:      $LogDir" -ForegroundColor White
Write-Host ""

if ($tunnelUrl -and -not $SkipVercel) {
  Write-Host "  ── Vercel Setup ──" -ForegroundColor Magenta
  Write-Host "  Set VITE_API_URL in Vercel dashboard to:" -ForegroundColor Yellow
  Write-Host "  $tunnelUrl" -ForegroundColor White
  Write-Host ""
  Write-Host "  1. Go to https://vercel.com → your project → Settings → Environment Variables" -ForegroundColor White
  Write-Host "  2. Edit VITE_API_URL → paste the tunnel URL above" -ForegroundColor White
  Write-Host "  3. Go to Deployments → ... → Redeploy" -ForegroundColor White

  if (Get-Command "vercel" -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "  Vercel CLI detected! Auto-update? (y/n)" -ForegroundColor Cyan
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq "Y") {
      Write-Host "  Updating VITE_API_URL in Vercel..."
      vercel env add VITE_API_URL production <<< "$tunnelUrl`n"
      if ($?) {
        Write-Host "  Redeploying..."
        vercel deploy --prod
        Write-Host "  ✓ Deployed! The frontend will work once Vercel finishes building." -ForegroundColor Green
      }
    }
  }
}

Write-Host ""
Write-Host "  Press Q to quit (stops all processes)" -ForegroundColor DarkGray

# Wait for Q key or process exit
while ($true) {
  if ([Console]::KeyAvailable) {
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq "Q") {
      Write-Host "`nShutting down..." -ForegroundColor Yellow
      if ($backendProc -and !$backendProc.HasExited) { $backendProc.Kill() }
      if ($tunnelProc -and !$tunnelProc.HasExited) { $tunnelProc.Kill() }
      Write-Host "Done." -ForegroundColor Green
      break
    }
  }
  if ($backendProc.HasExited -or $tunnelProc.HasExited) {
    Write-Host "`nA process exited unexpectedly. Check logs." -ForegroundColor Red
    break
  }
  Start-Sleep -Milliseconds 500
}
