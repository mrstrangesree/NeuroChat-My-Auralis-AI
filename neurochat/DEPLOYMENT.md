# 🚀 NeuroChat AI — Deployment Guide

This guide covers all deployment scenarios from local development to production.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Compose (Recommended)](#docker-compose-recommended)
- [Production on Linux VPS](#production-on-linux-vps)
- [GPU Acceleration](#gpu-acceleration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements

| Mode | RAM | CPU | GPU (optional) |
|------|-----|-----|----------------|
| Minimum (phi3) | 4GB | 4 cores | — |
| Recommended (llama3.2) | 8GB | 8 cores | — |
| Optimal (llama3.1:70b) | 32GB | 16 cores | NVIDIA 8GB+ VRAM |

### Software Requirements

| Software | Version | Install |
|----------|---------|---------|
| Ollama | Latest | https://ollama.ai |
| Docker | 24+ | https://docker.com |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| Python | 3.11+ | https://python.org |
| Node.js | 20+ | https://nodejs.org |

---

## Local Development

### Step 1: Install Ollama

**Windows:**
```powershell
# Download installer from https://ollama.ai/download
# Or via winget:
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama & Pull Models

```bash
# Start Ollama service
ollama serve

# In another terminal, pull models:
ollama pull llama3.2             # Main chat model (recommended)
ollama pull nomic-embed-text     # Required for RAG/document Q&A

# Optional additional models:
ollama pull mistral
ollama pull deepseek-coder-v2
ollama pull phi3
```

### Step 3: Backend Setup

```bash
cd neurochat/backend

# Copy environment config
cp .env.example .env

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Linux/macOS
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: http://localhost:8000
📖 API docs: http://localhost:8000/api/docs

### Step 4: Frontend Setup

```bash
cd neurochat/frontend

# Copy environment config
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## Docker Compose (Recommended)

The easiest way to run NeuroChat in production.

### Quick Deploy

```bash
cd neurochat

# Build and start all services in background
docker-compose up --build -d

# Check service status
docker-compose ps

# Pull models into Ollama (required first time)
docker exec neurochat-ollama ollama pull llama3.2
docker exec neurochat-ollama ollama pull nomic-embed-text

# View logs
docker-compose logs -f
```

✅ App running at: http://localhost

### Service Overview

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `nginx` | neurochat-nginx | 80, 443 | Reverse proxy |
| `frontend` | neurochat-frontend | 80 (internal) | React app |
| `backend` | neurochat-backend | 8000 (internal) | FastAPI |
| `ollama` | neurochat-ollama | 11434 | LLM runtime |

### Managing Services

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# Update to latest
git pull
docker-compose up --build -d

# View logs for a service
docker-compose logs -f backend
docker-compose logs -f ollama
```

---

## Production on Linux VPS

### Ubuntu/Debian Server Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
sudo systemctl enable ollama
sudo systemctl start ollama

# 4. Clone the project
git clone <your-repo-url> /opt/neurochat
cd /opt/neurochat

# 5. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env as needed

# 6. Deploy
docker-compose up --build -d

# 7. Pull models
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Create a systemd service (alternative to Docker)

```bash
# Backend service
sudo tee /etc/systemd/system/neurochat-backend.service > /dev/null <<EOF
[Unit]
Description=NeuroChat Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/neurochat/backend
Environment="PATH=/opt/neurochat/backend/venv/bin"
ExecStart=/opt/neurochat/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable neurochat-backend
sudo systemctl start neurochat-backend
```

### Build frontend for production

```bash
cd frontend
npm install
npm run build
# Output in frontend/dist/ — serve via Nginx
```

---

## GPU Acceleration

### NVIDIA GPU (CUDA)

```bash
# 1. Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

Edit `docker-compose.yml` to uncomment the GPU section under `ollama`:

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

```bash
# Rebuild with GPU support
docker-compose up --build -d
```

### AMD GPU (ROCm)

```bash
# For ROCm support, use rocm variant:
# Edit docker-compose.yml:
ollama:
  image: ollama/ollama:rocm
  devices:
    - /dev/kfd
    - /dev/dri
```

### Apple Silicon (Metal)

Ollama natively supports Metal on macOS. No extra configuration needed — it automatically uses the GPU.

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Update nginx.conf for HTTPS

Replace the `server` block in `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # ... rest of your location blocks
}
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `DEFAULT_MODEL` | `llama3.2` | Default LLM model |
| `DEFAULT_EMBEDDING_MODEL` | `nomic-embed-text` | Model for RAG embeddings |
| `DATABASE_URL` | `sqlite+aiosqlite:///./neurochat.db` | Database connection string |
| `DEBUG` | `false` | Enable debug mode |
| `MAX_UPLOAD_SIZE` | `52428800` | Max file upload size (50MB) |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | ChromaDB storage directory |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |

---

## Monitoring & Logs

### View logs

```bash
# Docker Compose
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f ollama       # Ollama only

# Application logs
tail -f backend/logs/neurochat.log
```

### Health checks

```bash
# App health
curl http://localhost:8000/api/health

# Ollama health
curl http://localhost:11434/api/tags

# Check all running models
curl http://localhost:11434/api/ps
```

---

## Troubleshooting

### ❌ "Ollama is not running"

```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Or with systemctl
sudo systemctl start ollama
sudo systemctl status ollama
```

### ❌ "No models found" in UI

```bash
# Pull at least one model
ollama pull llama3.2

# For Docker deployment
docker exec neurochat-ollama ollama pull llama3.2
```

### ❌ RAG not working / embedding errors

```bash
# Pull the embedding model
ollama pull nomic-embed-text

# Or use a different embedding model in .env:
# DEFAULT_EMBEDDING_MODEL=mxbai-embed-large
```

### ❌ Backend fails to start

```bash
# Check Python version (needs 3.11+)
python --version

# Check if all deps are installed
pip install -r requirements.txt

# Run with debug mode
DEBUG=true uvicorn app.main:app --reload
```

### ❌ File upload fails

```bash
# Check uploads directory permissions
ls -la backend/uploads/

# Create if missing
mkdir -p backend/uploads backend/chroma_db
```

### ❌ Docker Compose port conflict

```bash
# Check what's using port 80
sudo lsof -i :80

# Change ports in docker-compose.yml:
ports:
  - "8080:80"   # Use port 8080 instead
```

### ❌ Out of Memory errors

- Use a smaller model: `ollama pull phi3` or `ollama pull tinyllama`
- Reduce context with `max_tokens` in settings
- Ensure you have at least 8GB RAM for llama3.2

### Performance Tips

- **CPU**: Use `phi3` or `llama3.2:3b` for faster responses
- **GPU (NVIDIA)**: Enable GPU in `docker-compose.yml` (10x faster)
- **macOS**: Ollama auto-uses Metal GPU — no config needed
- **SSD**: Store Ollama models on SSD for faster loading

---

## Backup & Restore

```bash
# Backup database and uploads
docker-compose exec backend tar -czf /backup.tar.gz neurochat.db uploads/
docker cp neurochat-backend:/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# Restore
docker cp ./backup.tar.gz neurochat-backend:/
docker-compose exec backend tar -xzf /backup.tar.gz
```

---

## Updating NeuroChat

```bash
git pull origin main

# Docker
docker-compose down
docker-compose up --build -d

# Manual
cd backend && pip install -r requirements.txt
cd frontend && npm install && npm run build
```

---

*For issues and feature requests, open a GitHub issue.*
