# Complete Step-by-Step Setup

---

## Part 1 — Upload to GitHub

1. Go to https://github.com and sign in
2. Click the green **"New"** button
3. **Repository name** → `avios`
4. Leave it **Public**
5. **Don't** check any boxes
6. Click **"Create repository"**
7. Open PowerShell and run:

```powershell
cd "C:\Users\mkaru_rlv02ne\OneDrive\Desktop\MAYDAY\web"
git remote add origin https://github.com/YOUR_USERNAME/avios.git
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 2 — Deploy Frontend on Vercel

1. Go to https://vercel.com → Sign Up with GitHub
2. **Add New...** → **Project** → Import `avios`
3. **Root Directory** → select `frontend/`
4. **Framework Preset** → should auto-detect **Vite**
5. **Environment Variables** → add:
   - Key: `VITE_API_URL`
   - Value: `http://localhost:8001` (we'll change this later)
6. Click **Deploy**
7. Once done, copy your domain: `https://avios-xxx.vercel.app`

---

## Part 3 — Install Software on Your Laptop

### Install Ollama
- https://ollama.com/download → Windows installer
- Then: `ollama pull llama3.2:latest` (~3-4 GB download)

### Install Cloudflare Tunnel
- https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- Download the Windows .msi and run it

---

## Part 4 — Install Python Dependencies

```powershell
cd "C:\Users\mkaru_rlv02ne\OneDrive\Desktop\MAYDAY\web\backend"
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

---

## Part 5 — Launch Everything

**Recommended — one-click launcher:**
```powershell
cd "C:\Users\mkaru_rlv02ne\OneDrive\Desktop\MAYDAY\web"
.\start.ps1
```

This starts Ollama, the backend, and the Cloudflare tunnel automatically. It will print the tunnel URL and ask if you want to update Vercel.

**Or manually** (three terminals):

| Terminal | Command |
|----------|---------|
| 1 — Ollama | `ollama run llama3.2:latest` |
| 2 — Backend | `cd backend; .\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8001` |
| 3 — Tunnel | `cloudflared tunnel --url http://localhost:8001` |

---

## Part 6 — Connect Vercel to Your Tunnel

After running `start.ps1`, copy the tunnel URL (looks like `https://words.trycloudflare.com`).

1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Edit `VITE_API_URL` → paste the tunnel URL
3. Go to **Deployments** → **...** → **Redeploy**

**Or with Vercel CLI (automated):**
```powershell
npm i -g vercel
vercel login
.\update-vercel-env.ps1 -TunnelUrl "https://your-tunnel-url.trycloudflare.com"
```

---

## Part 7 — Done!

Visit `https://avios-xxx.vercel.app` — create an account, or sign in as admin:
- Email: `admin@avios.local`
- Password: `admin123`

---

## Everyday Startup

Just run:
```powershell
cd "C:\Users\mkaru_rlv02ne\OneDrive\Desktop\MAYDAY\web"
.\start.ps1
```

Copy the tunnel URL → update VITE_API_URL in Vercel → Redeploy.

---

## Quick Reference

| What | Where |
|------|-------|
| Frontend URL | `https://avios-xxx.vercel.app` |
| Backend (local) | `http://localhost:8001` |
| Tunnel URL | `https://xxx.trycloudflare.com` (new each time) |
| Backend data | `backend\data\avios.db` |
| Admin login | `admin@avios.local` / `admin123` |
| Logs | `logs\backend.log`, `logs\tunnel.log` |
