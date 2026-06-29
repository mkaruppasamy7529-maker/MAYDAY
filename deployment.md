# Deployment

## Architecture

```
Browser → https://avios.vercel.app (Vercel — frontend)
                ↓  API calls
         Oracle Cloud VM (free tier)
         ├─ uvicorn :8000 (backend)
         └─ ollama (llama3.2)
```

Free 24/7 — Ollama runs on Oracle's free ARM VM (4 cores, 24GB RAM).

---

## 1. Create Oracle Cloud VM

1. Go to [cloud.oracle.com](https://cloud.oracle.com) → sign up (requires credit card, but never charged)
2. Create a VM instance:
   - **Image**: Ubuntu 22.04 or 24.04
   - **Shape**: VM.Standard.A1.Flex (4 OCPUs, 24GB RAM — free tier)
   - **SSH key**: Download the private key — you'll need it
3. Once created, note the **public IP**

## 2. Install Ollama + Backend on the VM

SSH into the VM and run:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:latest

# Install Python + deps
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git

# Clone the repo
git clone https://github.com/YOUR_USERNAME/avios.git
cd avios/backend

# Set up Python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=8000
PRODUCTION=true
CORS_ORIGINS=*
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
EOF
```

## 3. Start everything

```bash
# Start Ollama (runs as a service automatically after install)
ollama serve &

# Start the backend
cd avios/backend
source venv/bin/activate
python3 main.py
```

The backend will be available at `http://<VM-IP>:8000`.

## 4. Keep it running 24/7

Use systemd so the backend restarts automatically:

```bash
sudo tee /etc/systemd/system/avios.service > /dev/null << 'EOF'
[Unit]
Description=Avios Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/avios/backend
ExecStart=/home/ubuntu/avios/backend/venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable avios
sudo systemctl start avios
```

## 5. Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New Project → Import your repo
3. **Root Directory** → set to `frontend/`
4. **Environment Variables** → add:
   ```
   VITE_API_URL = http://<VM-IP>:8000
   ```
5. Click **Deploy**

## 6. (Recommended) Add a domain

For production, add a domain and SSL:

- Get a free domain or use a `.nip.io` address
- Set up a reverse proxy (Caddy or Nginx) on the VM with SSL
- Update `VITE_API_URL` in Vercel to `https://your-domain.com`

Example with Caddy (automatic SSL):

```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
api.avios.example.com {
    reverse_proxy localhost:8000
}
EOF
sudo systemctl reload caddy
```

---

## Environment Variables

### Vercel
| Key | Value |
|-----|-------|
| `VITE_API_URL` | `http://<VM-IP>:8000` or `https://api.your-domain.com` |

### Backend (`backend/.env`)
| Key | Value |
|-----|-------|
| `HOST` | `0.0.0.0` |
| `PORT` | `8000` |
| `CORS_ORIGINS` | `*` |
| `JWT_SECRET` | (generate a random one) |
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_URL` | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | `llama3.2:latest` |
| `PRODUCTION` | `true` |
