# 🌐 NeuroChat AI — Complete Hosting Guide

> Step-by-step hosting instructions for every major platform. Same code everywhere — only 3 env vars change per deployment.

---

## Table of Contents

1. [How It Works on Any Platform](#1-how-it-works-on-any-platform)
2. [Platform Compatibility Matrix](#2-platform-compatibility-matrix)
3. [Local Machine (Windows / macOS / Linux)](#3-local-machine)
4. [Docker Compose — Self-Hosted](#4-docker-compose--self-hosted)
5. [Render](#5-render)
6. [Railway](#6-railway)
7. [Fly.io](#7-flyio)
8. [DigitalOcean](#8-digitalocean)
9. [Hetzner Cloud](#9-hetzner-cloud)
10. [AWS EC2](#10-aws-ec2)
11. [Google Cloud (GCP)](#11-google-cloud-gcp)
12. [Microsoft Azure](#12-microsoft-azure)
13. [Vercel + Netlify (Frontend Only)](#13-vercel--netlify-frontend-only)
14. [GPU Acceleration](#14-gpu-acceleration)
15. [Ollama Hosting Options](#15-ollama-hosting-options)
16. [Custom Domain & SSL](#16-custom-domain--ssl)
17. [Firewall & Security](#17-firewall--security)
18. [Persistent Storage & Backups](#18-persistent-storage--backups)
19. [Monitoring & Logs](#19-monitoring--logs)
20. [Troubleshooting](#20-troubleshooting)
21. [Cost Comparison](#21-cost-comparison)

---

## 1. How It Works on Any Platform

NeuroChat AI has four components:

```
Browser
  │  HTTP/HTTPS
  ▼
Nginx (Reverse Proxy)  ──── port 80 / 443
  ├── /api/* ──────────►  FastAPI Backend  ──── port 8000
  │                              │
  │                        port 11434
  │                              ▼
  │                           Ollama
  │                         (LLM engine)
  └── /*  ────────────►  React Frontend
                         (Nginx static)
```

**The 3 things that change per platform:**

| Variable | Where | What to set |
|----------|-------|-------------|
| `OLLAMA_BASE_URL` | `backend/.env` | URL where Ollama is running |
| `CORS_ORIGINS` | `backend/.env` | Your frontend's public domain |
| `VITE_API_URL` | `frontend/.env` | Your backend's public URL |

Everything else — streaming, RAG, conversation history, document upload — is identical.

---

## 2. Platform Compatibility Matrix

| Platform | Frontend | Backend | Ollama | Persistent DB | Full Support |
|----------|----------|---------|--------|--------------|-------------|
| **Local Machine** | Vite / Nginx | FastAPI | Local | Local disk | ✅ Full |
| **Docker Compose** | Nginx container | FastAPI container | Container | Docker volumes | ✅ Full |
| **Linux VPS (any)** | Nginx static | Uvicorn | systemd service | Server disk | ✅ Full |
| **Render** | Static site (free) | Web service ($7+) | External* | Render Disk | ✅ Yes |
| **Railway** | Static / Railway | Docker service | External* | Railway Volume | ✅ Yes |
| **Fly.io** | Static / Fly machine | Docker machine | External* | Fly Volume | ✅ Yes |
| **DigitalOcean Droplet** | Nginx | Uvicorn / Docker | Same VM | DO Volumes | ✅ Full |
| **Hetzner Cloud** | Nginx | Uvicorn / Docker | Same server | Hetzner Volumes | ✅ Full |
| **AWS EC2** | Nginx / S3 | Docker / Uvicorn | Same VM | EBS | ✅ Full |
| **Google Cloud (GCE)** | Nginx / Cloud Run | Docker / GCE | Same VM | Persistent disk | ✅ Full |
| **Azure VM** | Nginx / Static Web | Docker / VM | Same VM | Managed disk | ✅ Full |
| **Vercel / Netlify** | Static site | ❌ Not supported | External* | N/A | ⚠️ Frontend only |
| **Heroku** | Static buildpack | Python dyno | External* | ❌ Ephemeral free | ⚠️ Limited |

*External Ollama = RunPod, Vast.ai, your own GPU server, or CPU-only with a small model.

---

## 3. Local Machine

The easiest way to run NeuroChat AI — everything on your own computer.

### Hardware Requirements

| | Minimum | Recommended |
|-|---------|-------------|
| RAM | 8 GB | 16 GB |
| Disk | 10 GB free | 30 GB free |
| CPU | 4 cores | 8+ cores |
| GPU | Not required | NVIDIA 6GB+ or Apple Silicon |

### Windows

```powershell
# 1. Install Ollama
# Download from: https://ollama.ai/download/windows
# (Registers as a background service automatically)

# 2. Open a new terminal and pull models
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Clone project and start
cd neurochat
python start.py        # auto-installs Python + Node deps, starts both servers

# ✅ Open http://localhost:5173
```

**Firewall (if sharing on LAN):**
```powershell
New-NetFirewallRule -DisplayName "NeuroChat" -Direction Inbound `
  -Port 5173,8000 -Protocol TCP -Action Allow
```

### macOS

```bash
# 1. Install Ollama
brew install ollama
# OR download: https://ollama.ai/download/mac

# 2. Pull models
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Start NeuroChat
cd neurochat
python3 start.py

# ✅ Open http://localhost:5173
```

> Apple Silicon (M1/M2/M3/M4) users: Ollama automatically uses **Metal GPU** — very fast, no config needed.

### Linux

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull models
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Start NeuroChat
cd neurochat
python3 start.py

# ✅ Open http://localhost:5173
```

### Manual start (any OS)

```bash
# Terminal 1 — Backend
cd neurochat/backend
cp .env.example .env
python -m venv venv && source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd neurochat/frontend
cp .env.example .env
npm install
npm run dev

# Open http://localhost:5173
```

---

## 4. Docker Compose — Self-Hosted

The **recommended production method**. One command deploys all 4 services.

### Prerequisites

```bash
# Install Docker (includes Docker Compose)
curl -fsSL https://get.docker.com | sh        # Linux
# OR download Docker Desktop for Windows/macOS
```

### Deploy

```bash
cd neurochat

# Build and start all services in the background
docker compose up --build -d

# Pull models into the Ollama container (first time only)
docker exec neurochat-ollama ollama pull llama3.2
docker exec neurochat-ollama ollama pull nomic-embed-text

# ✅ Open http://localhost
```

### Manage Services

```bash
# Status
docker compose ps

# Live logs (all services)
docker compose logs -f

# Logs for one service
docker compose logs -f backend
docker compose logs -f ollama

# Stop everything
docker compose down

# Stop and delete all data (irreversible!)
docker compose down -v

# Restart one service
docker compose restart backend

# Rebuild after code changes
docker compose up --build -d --no-deps backend
```

### Update to Latest Code

```bash
git pull origin main
docker compose up --build -d
```

### Data Volumes

| Volume | Contents | Location in container |
|--------|----------|----------------------|
| `backend_data` | SQLite database | `/app/neurochat.db` |
| `uploads` | Uploaded documents | `/app/uploads/` |
| `chroma_db` | Vector embeddings | `/app/chroma_db/` |
| `logs` | App logs | `/app/logs/` |
| `ollama_data` | Model weights | `/root/.ollama/` |

---

## 5. Render

[Render](https://render.com) — modern cloud with free static hosting, auto SSL, and Git auto-deploy.

### ⚠️ Key Limitations

| Limitation | Detail |
|------------|--------|
| No GPU | Ollama runs CPU-only — slow for large models |
| No Docker Compose | Each service deployed separately |
| Free tier sleeps | Web services sleep after 15 min idle (30s cold start) |
| Ephemeral disk | Free tier — no disk persistence; use paid Disk add-on |

### Architecture on Render

```
Render Static Site (free)    Render Web Service ($7+/mo)    External Ollama
  neurochat-frontend    →     neurochat-backend          →  (RunPod / Vast.ai /
   React build                FastAPI + ChromaDB              self-hosted)
```

---

### Option A — Recommended: External Ollama (Best Performance)

**Step 1: Host Ollama externally**

On [RunPod](https://runpod.io) (GPU cloud, pay per hour):
```
1. Sign up at https://runpod.io
2. Pods → Deploy → search "Ollama"
3. Pick GPU: RTX 3080 (~$0.20/hr) or A100 (~$1.60/hr)
4. Expose port 11434
5. Copy the public URL: https://<pod-id>-11434.proxy.runpod.net
```

On [Vast.ai](https://vast.ai) (cheaper GPU cloud):
```
1. Sign up at https://vast.ai
2. Search for GPU instances → select one with 8GB+ VRAM
3. Use the Ollama Docker template
4. Note the public IP and mapped port
```

On your own machine (tunnelled via ngrok):
```bash
OLLAMA_HOST=0.0.0.0 ollama serve &
ngrok http 11434
# Use the https://xxxx.ngrok.io URL as OLLAMA_BASE_URL
```

**Step 2: Push code to GitHub**
```bash
cd neurochat
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/neurochat.git
git push -u origin main
```

**Step 3: Deploy via Render Dashboard**

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New → Blueprint** → connect your GitHub repo
3. Render detects `render.yaml` and creates both services automatically
4. In the `neurochat-backend` service → **Environment** → set:
   - `OLLAMA_BASE_URL` = your external Ollama URL
   - `CORS_ORIGINS` = `https://neurochat-frontend.onrender.com`
5. In the `neurochat-frontend` service → **Environment** → set:
   - `VITE_API_URL` = `https://neurochat-backend.onrender.com/api`
6. Click **Apply** → Render deploys both services

**OR deploy manually:**
```bash
# Install Render CLI
npm install -g @render-oss/cli
render login

# Deploy using blueprint
render blueprint launch render.yaml
```

**Step 4: Add persistent disk (required for database)**

In Render Dashboard → `neurochat-backend` → **Disks** → Add Disk:
- Name: `neurochat-data`
- Mount Path: `/opt/render/project/src`
- Size: 5 GB ($1.25/mo)

**Step 5: Verify**
```bash
curl https://neurochat-backend.onrender.com/api/health
# Expected: {"status":"ok","ollama":"connected"}
```

---

### Option B — CPU-only Ollama on Render (Small Models Only)

Only use this for `phi3` or `tinyllama`. Expect ~5–10 tokens/second.

**Build the combined Docker image and deploy:**

The project includes `Dockerfile.render` and `start-render.sh` for this exact setup.

In Render Dashboard → **New Web Service** → **Deploy an existing image or Dockerfile**:
- Root directory: `.` (project root)
- Dockerfile: `./Dockerfile.render`
- Plan: **Pro** ($85/mo) — needs 4GB RAM minimum for phi3
- Add disk: mount `/root/.ollama` (10GB for model storage)
- Set env vars:
  - `DEFAULT_MODEL=phi3`
  - `DEFAULT_EMBEDDING_MODEL=nomic-embed-text`

---

### Render Plan Reference

| Plan | RAM | Price | Use For |
|------|-----|-------|---------|
| Free | 512 MB | $0 | Static frontend only |
| Starter | 512 MB | $7/mo | Backend (no Ollama) |
| Standard | 2 GB | $25/mo | Backend + tiny Ollama |
| Pro | 4 GB | $85/mo | Backend + phi3 |
| Pro Plus | 8 GB | $175/mo | Backend + llama3.2 |

### Custom Domain on Render
```
Dashboard → your service → Settings → Custom Domains → Add domain
DNS: CNAME  neurochat  →  neurochat-frontend.onrender.com
SSL auto-provisioned by Render ✅
```

---

## 6. Railway

[Railway](https://railway.app) — developer-friendly platform with $5/mo free credit.

### Limitations
- No GPU — Ollama must run externally
- Persistent volumes available on paid plans ($0.25/GB/mo)
- Auto-deploys from GitHub

### Deploy Backend

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Create project
cd neurochat/backend
railway init

# Deploy
railway up

# Set environment variables
railway variables set OLLAMA_BASE_URL=https://your-ollama-url:11434
railway variables set CORS_ORIGINS=https://your-frontend-domain.com
railway variables set DEFAULT_MODEL=llama3.2
railway variables set DATABASE_URL=sqlite+aiosqlite:///./neurochat.db
```

### Deploy Frontend as Static Site

```bash
cd neurochat/frontend
npm run build

# Use Railway's static file serving
# OR deploy dist/ to Vercel/Netlify (free)
```

### Add Persistent Volume (Railway Dashboard)
```
Project → Service → Storage → Add Volume
Mount Path: /app
Size: 5 GB
```

### Using railway.toml (auto-configure)

Create `neurochat/backend/railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"

[environments.production.variables]
DEFAULT_MODEL = "llama3.2"
DEBUG = "false"
```

---

## 7. Fly.io

[Fly.io](https://fly.io) — runs Docker containers globally, good free tier ($0–$5/mo for small apps).

### Limitations
- No GPU on standard plans
- Ollama must run externally (or CPU-only with a small model)
- Persistent volumes required for database

### Install Fly CLI

```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh

# Windows
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

fly auth login
```

### Deploy Backend

```bash
cd neurochat/backend

# Initialize Fly app
fly launch --name neurochat-backend --no-deploy

# This creates fly.toml — edit it:
```

`fly.toml` for backend:
```toml
app = "neurochat-backend"
primary_region = "sin"          # change to closest region

[build]
  dockerfile = "Dockerfile"

[env]
  DEFAULT_MODEL = "llama3.2"
  DEBUG = "false"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [services.concurrency]
    type = "requests"
    hard_limit = 25
    soft_limit = 20

[[mounts]]
  source = "neurochat_data"
  destination = "/app"
  initial_size = "5gb"
```

```bash
# Create persistent volume
fly volumes create neurochat_data --size 5 --region sin

# Set secrets
fly secrets set OLLAMA_BASE_URL=https://your-ollama-url:11434
fly secrets set CORS_ORIGINS=https://neurochat-frontend.fly.dev

# Deploy
fly deploy

# Check status
fly status
fly logs
```

### Deploy Frontend

```bash
cd neurochat/frontend

# Build static files
npm run build

# Deploy to Fly as a static app
fly launch --name neurochat-frontend --no-deploy
```

`fly.toml` for frontend:
```toml
app = "neurochat-frontend"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"      # uses nginx to serve static files

[[services]]
  internal_port = 80
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
```

```bash
fly secrets set VITE_API_URL=https://neurochat-backend.fly.dev/api
fly deploy
```

### Useful Fly Commands
```bash
fly status                   # check deployment
fly logs -a neurochat-backend  # live logs
fly ssh console              # SSH into running container
fly scale count 2            # scale to 2 instances
```

---

## 8. DigitalOcean

[DigitalOcean](https://digitalocean.com) — the easiest full-featured cloud. Excellent for teams.

### Recommended Droplet Sizes

| Use Case | Size | vCPU | RAM | Disk | Price |
|----------|------|------|-----|------|-------|
| Dev / Testing | s-2vcpu-4gb | 2 | 4 GB | 80 GB | $24/mo |
| Small Team | s-4vcpu-8gb | 4 | 8 GB | 160 GB | $48/mo |
| Production | s-4vcpu-16gb | 4 | 16 GB | 320 GB | $96/mo |
| GPU | GPU Droplet | 8 | 32 GB | H100 | ~$900/mo |

### Full Setup

```bash
# 1. Create a Droplet: Ubuntu 22.04, choose size above
# 2. Add your SSH key in the DigitalOcean dashboard
# 3. SSH in:
ssh root@<YOUR-DROPLET-IP>

# 4. Update system
apt update && apt upgrade -y

# 5. Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER && newgrp docker

# 6. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
systemctl enable ollama && systemctl start ollama

# 7. Pull models
ollama pull llama3.2
ollama pull nomic-embed-text

# 8. Clone and deploy
git clone https://github.com/YOUR_USERNAME/neurochat.git /opt/neurochat
cd /opt/neurochat

cp backend/.env.example backend/.env
# Edit backend/.env if needed:
# nano backend/.env

docker compose up --build -d

# ✅ Visit http://<YOUR-DROPLET-IP>
```

### Add a Domain

```bash
# In DigitalOcean DNS panel:
# A record: @ → <YOUR-DROPLET-IP>
# A record: www → <YOUR-DROPLET-IP>

# Get free SSL
apt install -y certbot
certbot certonly --standalone -d yourdomain.com

# Update nginx.conf with your domain + SSL certs, then:
docker compose restart nginx
```

### DigitalOcean Volumes (for larger model storage)

```bash
# Create a 100GB volume in DO console → attach to Droplet
mkdir -p /mnt/ollama
mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_your-volume /mnt/ollama

# Make permanent
echo "/dev/disk/by-id/scsi-0DO_Volume_your-volume /mnt/ollama ext4 defaults,nofail 0 2" >> /etc/fstab

# Tell Ollama to use this path
echo 'OLLAMA_MODELS=/mnt/ollama' >> /etc/environment
systemctl restart ollama
```

### DigitalOcean App Platform (PaaS alternative)

```bash
# Deploy backend as an App Platform service
doctl apps create --spec - <<EOF
name: neurochat
services:
  - name: backend
    source_dir: /backend
    github:
      repo: YOUR_USERNAME/neurochat
      branch: main
    run_command: uvicorn app.main:app --host 0.0.0.0 --port 8080
    environment_slug: python
    instance_size_slug: professional-xs
    envs:
      - key: OLLAMA_BASE_URL
        value: https://your-ollama-url
static_sites:
  - name: frontend
    source_dir: /frontend
    github:
      repo: YOUR_USERNAME/neurochat
      branch: main
    build_command: npm install && npm run build
    output_dir: dist
EOF
```

---

## 9. Hetzner Cloud

[Hetzner](https://hetzner.com/cloud) — the best price/performance ratio, especially in Europe.

### Recommended Servers

| Use Case | Server | vCPU | RAM | Disk | Price |
|----------|--------|------|-----|------|-------|
| Testing | CX22 | 2 | 4 GB | 40 GB | €4.51/mo |
| Standard | CX32 | 4 | 8 GB | 80 GB | €8.21/mo |
| Production | CX42 | 8 | 16 GB | 160 GB | €16.90/mo |
| Dedicated CPU | CCX13 | 2 | 8 GB (dedicated) | 80 GB | €12.49/mo |

### Deploy with hcloud CLI

```bash
# Install hcloud CLI
brew install hcloud                    # macOS
# Linux: https://github.com/hetznercloud/cli/releases

hcloud context create neurochat        # authenticate

# Create SSH key
hcloud ssh-key create --name mykey --public-key-file ~/.ssh/id_rsa.pub

# Create server
hcloud server create \
  --name neurochat \
  --type cx42 \
  --image ubuntu-22.04 \
  --ssh-key mykey \
  --location nbg1                      # Nuremberg, Germany

# Get IP
hcloud server describe neurochat | grep "Public Net"

# SSH in
ssh root@<SERVER-IP>
```

**Then run the same setup as DigitalOcean above** (same Ubuntu commands).

### Hetzner Volumes

```bash
# Create a 100GB volume in Hetzner console → attach to server
# Mount it:
mkfs.ext4 /dev/disk/by-id/scsi-0HC_Volume_XXXXX
mkdir /mnt/ollama
mount /dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/ollama
echo "/dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/ollama ext4 defaults 0 0" >> /etc/fstab
```

### Hetzner Firewall

```bash
# In Hetzner Console → Firewalls → Create:
# Allow:  TCP 22  (SSH — your IP only)
# Allow:  TCP 80  (HTTP)
# Allow:  TCP 443 (HTTPS)
# Block:  TCP 11434 (Ollama — internal only)
# Block:  TCP 8000  (Backend — internal only)
```

---

## 10. AWS EC2

[Amazon EC2](https://aws.amazon.com/ec2/) — industry-standard cloud. Best for GPU and enterprise needs.

### Recommended Instance Types

| Use Case | Instance | vCPU | RAM | Est. Cost |
|----------|----------|------|-----|-----------|
| Dev / Testing | t3.large | 2 | 8 GB | ~$60/mo |
| Production | m5.xlarge | 4 | 16 GB | ~$140/mo |
| GPU (fast AI) | g4dn.xlarge | 4 | 16 GB + T4 | ~$380/mo |
| GPU (large models) | g5.2xlarge | 8 | 32 GB + A10G | ~$800/mo |

### Launch & Configure

```bash
# 1. Launch EC2 in AWS Console:
#    AMI: Ubuntu 22.04 LTS (ami-0c7217cdde317cfec for us-east-1)
#    Instance type: m5.xlarge (or larger)
#    Key pair: create/select one
#    Security Group:
#      Port 22   — your IP only
#      Port 80   — 0.0.0.0/0
#      Port 443  — 0.0.0.0/0
#    Storage: 50 GB gp3 SSD

# 2. Allocate Elastic IP (static public IP)
#    EC2 Console → Elastic IPs → Allocate → Associate to instance

# 3. SSH in
ssh -i your-key.pem ubuntu@<ELASTIC-IP>

# 4. Setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && newgrp docker
curl -fsSL https://ollama.ai/install.sh | sh
sudo systemctl enable ollama && sudo systemctl start ollama

ollama pull llama3.2
ollama pull nomic-embed-text

sudo git clone https://github.com/YOUR_USERNAME/neurochat.git /opt/neurochat
cd /opt/neurochat
sudo cp backend/.env.example backend/.env

sudo docker compose up --build -d

# ✅ Visit http://<ELASTIC-IP>
```

### Add EBS Volume for Ollama Models

```bash
# In EC2 Console → Volumes → Create → 100 GB gp3 → attach to instance as /dev/xvdf

sudo mkfs.ext4 /dev/xvdf
sudo mkdir -p /mnt/ollama
sudo mount /dev/xvdf /mnt/ollama
echo "/dev/xvdf /mnt/ollama ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab

# Configure Ollama to use this path
sudo mkdir -p /etc/systemd/system/ollama.service.d
echo -e "[Service]\nEnvironment=\"OLLAMA_MODELS=/mnt/ollama\"" | sudo tee /etc/systemd/system/ollama.service.d/override.conf
sudo systemctl daemon-reload && sudo systemctl restart ollama
```

### AWS CLI Quick Setup

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws configure                            # enter your access keys

# Create Security Group
aws ec2 create-security-group --group-name neurochat-sg --description "NeuroChat"
aws ec2 authorize-security-group-ingress --group-name neurochat-sg --protocol tcp --port 22 --cidr YOUR.IP/32
aws ec2 authorize-security-group-ingress --group-name neurochat-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name neurochat-sg --protocol tcp --port 443 --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type m5.xlarge \
  --key-name your-key \
  --security-groups neurochat-sg \
  --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":50,\"VolumeType\":\"gp3\"}}]"
```

---

## 11. Google Cloud (GCP)

[Google Cloud](https://cloud.google.com) — excellent GPU availability and managed services.

### Recommended Machine Types

| Use Case | Machine | vCPU | RAM | Est. Cost |
|----------|---------|------|-----|-----------|
| Testing | e2-standard-2 | 2 | 8 GB | ~$50/mo |
| Production | n2-standard-4 | 4 | 16 GB | ~$140/mo |
| GPU | n1-standard-4 + T4 | 4 | 15 GB + T4 16GB | ~$350/mo |
| High-end GPU | a2-highgpu-1g | 12 | 85 GB + A100 | ~$2,500/mo |

### Deploy via gcloud CLI

```bash
# Install gcloud SDK
curl https://sdk.cloud.google.com | bash
gcloud init
gcloud auth login

# Create a project (or use existing)
gcloud projects create neurochat-ai --name="NeuroChat AI"
gcloud config set project neurochat-ai

# Enable Compute Engine
gcloud services enable compute.googleapis.com

# Create VM
gcloud compute instances create neurochat-vm \
  --zone=us-central1-a \
  --machine-type=n2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --tags=neurochat

# Reserve static IP
gcloud compute addresses create neurochat-ip --region=us-central1

# Create firewall rules
gcloud compute firewall-rules create neurochat-http \
  --allow=tcp:80,tcp:443 \
  --target-tags=neurochat

# SSH in
gcloud compute ssh neurochat-vm --zone=us-central1-a
```

**Then run the same Ubuntu setup as DigitalOcean.**

### Add Persistent Disk

```bash
# In Cloud Console → Compute Engine → Disks → Create Disk
# 100GB, type: pd-ssd

# Attach and mount
sudo mkfs.ext4 /dev/sdb
sudo mkdir /mnt/ollama
sudo mount /dev/sdb /mnt/ollama
echo "/dev/sdb /mnt/ollama ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
```

### Add a GPU

```bash
# Create VM with GPU
gcloud compute instances create neurochat-gpu \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --maintenance-policy=TERMINATE \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --metadata="install-nvidia-driver=True"
```

---

## 12. Microsoft Azure

[Azure](https://azure.microsoft.com) — strong enterprise integration, available globally.

### Recommended VM Sizes

| Use Case | VM Size | vCPU | RAM | Est. Cost |
|----------|---------|------|-----|-----------|
| Testing | Standard_B2s | 2 | 4 GB | ~$35/mo |
| Production | Standard_D4s_v3 | 4 | 16 GB | ~$140/mo |
| GPU | Standard_NC4as_T4_v3 | 4 | 28 GB + T4 | ~$500/mo |
| High-end GPU | Standard_NC24ads_A100_v4 | 24 | 220 GB + A100 | ~$3,600/mo |

### Deploy via Azure CLI

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login

# Create resource group
az group create --name neurochat-rg --location eastus

# Create VM
az vm create \
  --resource-group neurochat-rg \
  --name neurochat-vm \
  --image Ubuntu2204 \
  --size Standard_D4s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys

# Open ports
az vm open-port --port 80  --resource-group neurochat-rg --name neurochat-vm
az vm open-port --port 443 --resource-group neurochat-rg --name neurochat-vm

# Get public IP
az vm show --resource-group neurochat-rg --name neurochat-vm \
  --show-details --query publicIps -o tsv

# SSH in
ssh azureuser@<PUBLIC-IP>
```

**Then run the same Ubuntu setup as DigitalOcean.**

### Assign Static IP (Azure)

```bash
# Create static public IP
az network public-ip create \
  --resource-group neurochat-rg \
  --name neurochat-ip \
  --allocation-method Static \
  --sku Standard

# Associate with VM's NIC
az network nic ip-config update \
  --resource-group neurochat-rg \
  --nic-name neurochat-vmVMNic \
  --name ipconfigNeurochat \
  --public-ip-address neurochat-ip
```

### Azure Managed Disk

```bash
# Create and attach 128GB disk
az disk create \
  --resource-group neurochat-rg \
  --name ollama-disk \
  --size-gb 128 \
  --sku Premium_LRS

az vm disk attach \
  --resource-group neurochat-rg \
  --vm-name neurochat-vm \
  --name ollama-disk

# Then mount it on the VM (same as GCP/AWS steps above)
```

---

## 13. Vercel + Netlify (Frontend Only)

These platforms only support static sites and serverless functions — **not long-running processes**. You can host the **React frontend** here for free, but the **FastAPI backend must run elsewhere**.

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

cd neurochat/frontend

# Set backend URL before building
echo "VITE_API_URL=https://your-backend.onrender.com/api" > .env

# Deploy
vercel --prod

# Or connect GitHub repo in Vercel Dashboard:
# 1. vercel.com → New Project → Import from GitHub
# 2. Root directory: frontend
# 3. Build command: npm run build
# 4. Output dir: dist
# 5. Environment variable: VITE_API_URL=https://your-backend-url/api
```

### Netlify (Frontend)

```bash
# Install Netlify CLI
npm install -g netlify-cli

cd neurochat/frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Or connect GitHub in Netlify Dashboard:
# 1. netlify.com → Add new site → Import from GitHub
# 2. Base directory: frontend
# 3. Build command: npm run build
# 4. Publish directory: frontend/dist
# 5. Environment: VITE_API_URL=https://your-backend-url/api
```

Create `frontend/public/_redirects` for SPA routing:
```
/*    /index.html    200
```

### Where to run the Backend?

| Option | Cost | Difficulty |
|--------|------|------------|
| Render Starter | $7/mo | ⭐ Easy |
| Railway | $5+/mo | ⭐ Easy |
| Fly.io | $0–5/mo | Easy |
| DigitalOcean Droplet | $24/mo | Easy |
| Your own VPS / Home server | VPS cost | Moderate |

---

## 14. GPU Acceleration

GPU dramatically improves inference speed (5–20x faster than CPU).

### Performance Benchmarks

| Hardware | phi3 (3.8B) | llama3.2 (3B) | mistral (7B) |
|----------|-------------|---------------|--------------|
| CPU (8 cores) | ~20 t/s | ~15 t/s | ~6 t/s |
| Apple M2 (Metal) | ~90 t/s | ~80 t/s | ~45 t/s |
| NVIDIA RTX 3080 | ~130 t/s | ~120 t/s | ~70 t/s |
| NVIDIA RTX 4090 | ~210 t/s | ~200 t/s | ~120 t/s |
| NVIDIA A100 | ~260 t/s | ~250 t/s | ~150 t/s |

### NVIDIA GPU (Docker)

```bash
# 1. Install NVIDIA Container Toolkit
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor \
  -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# 2. Verify GPU is accessible
docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi

# 3. Uncomment GPU section in docker-compose.yml:
#    ollama:
#      deploy:
#        resources:
#          reservations:
#            devices:
#              - driver: nvidia
#                count: all
#                capabilities: [gpu]

docker compose up --build -d
```

### AMD GPU (ROCm)

```yaml
# docker-compose.yml
ollama:
  image: ollama/ollama:rocm
  devices:
    - /dev/kfd
    - /dev/dri
  group_add:
    - video
```

### Apple Silicon (macOS)

No configuration needed. Ollama automatically uses **Metal GPU** on all Apple Silicon Macs (M1/M2/M3/M4). Performance rivals an RTX 3080 for 7B models.

---

## 15. Ollama Hosting Options

Ollama must be reachable from the backend. Here are all options:

### Option 1: Same Server (Default)
```env
OLLAMA_BASE_URL=http://localhost:11434
```

### Option 2: Docker Internal Network
When using Docker Compose — Ollama is reachable by its service name:
```env
OLLAMA_BASE_URL=http://ollama:11434
```

### Option 3: Separate GPU Server (LAN)
```bash
# On the GPU server — allow remote connections:
OLLAMA_HOST=0.0.0.0 ollama serve
# Or in systemd:
# Environment="OLLAMA_HOST=0.0.0.0:11434"
```
```env
# In backend/.env:
OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### Option 4: RunPod (Cloud GPU — Pay-Per-Hour)
```
1. runpod.io → Pods → Deploy → search "Ollama"
2. Select GPU: RTX 3080 (~$0.20/hr), A100 (~$1.60/hr)
3. Expose port 11434
4. URL: https://<pod-id>-11434.proxy.runpod.net
```
```env
OLLAMA_BASE_URL=https://<pod-id>-11434.proxy.runpod.net
```

### Option 5: Vast.ai (Cheaper GPU Cloud)
```
1. vast.ai → Search instances → filter by GPU
2. Use Ollama Docker template
3. Note the public IP and port mapping
```

### Option 6: ngrok Tunnel (Local Machine → Cloud)
```bash
# Expose your local Ollama publicly:
OLLAMA_HOST=0.0.0.0 ollama serve &
ngrok http 11434
# Use the https://xxxx.ngrok.io URL
```

> ⚠️ **Security:** Never expose Ollama port 11434 directly to the internet without a firewall or auth proxy. Use private networks or VPN where possible.

---

## 16. Custom Domain & SSL

### Point a Domain to Your Server

In your DNS provider (Cloudflare, Namecheap, Route 53, etc.):

```
Type  Name  Value              TTL
A     @     <YOUR-SERVER-IP>   Auto
A     www   <YOUR-SERVER-IP>   Auto
```

### Let's Encrypt (Free SSL — Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (Certbot sets this up automatically)
sudo systemctl status certbot.timer
```

Update `nginx.conf` to use HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    add_header Strict-Transport-Security "max-age=63072000" always;

    # ... rest of location blocks unchanged
}
```

### Cloudflare (Free CDN + SSL)

1. Add domain to Cloudflare (free plan)
2. Set DNS A records with **Proxy enabled** (orange cloud)
3. SSL/TLS → Mode: **Full (strict)**
4. Benefits: free SSL, DDoS protection, global CDN caching

---

## 17. Firewall & Security

### UFW (Ubuntu)

```bash
sudo ufw enable
sudo ufw allow 22/tcp        # SSH — restrict to your IP if possible
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw deny 11434/tcp      # Block Ollama from internet
sudo ufw deny 8000/tcp       # Block backend from internet (nginx handles it)
sudo ufw status verbose
```

### Restrict SSH to Your IP

```bash
sudo ufw delete allow 22/tcp
sudo ufw allow from YOUR.IP.HERE to any port 22 proto tcp
```

### Security Checklist

- ✅ SSH key authentication only (no passwords)
- ✅ Ollama port 11434 blocked from internet
- ✅ Backend port 8000 blocked from internet
- ✅ HTTPS enabled with valid certificate
- ✅ Rate limiting in nginx (60 req/min)
- ✅ `apt upgrade` run regularly
- ✅ Fail2ban installed (brute-force protection)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban && sudo systemctl start fail2ban
```

### Port Reference

| Port | Service | Expose? | Notes |
|------|---------|---------|-------|
| 22 | SSH | Restrict to your IP | Management only |
| 80 | Nginx HTTP | ✅ Public | Redirects to HTTPS |
| 443 | Nginx HTTPS | ✅ Public | Main entry point |
| 8000 | FastAPI Backend | ❌ Internal only | Via Nginx /api/* |
| 5173 | Vite Dev Server | ❌ Dev only | Local development |
| 11434 | Ollama API | ❌ Internal only | Never expose publicly |

---

## 18. Persistent Storage & Backups

### What Needs to be Persisted

| Data | Location | Size |
|------|----------|------|
| Conversations + messages (SQLite) | `backend/neurochat.db` | < 100 MB |
| Uploaded documents | `backend/uploads/` | Varies |
| Vector embeddings (ChromaDB) | `backend/chroma_db/` | ~50MB / 1000 docs |
| Ollama models | `~/.ollama/` or `/root/.ollama/` | 1–70 GB per model |

### Backup Script

```bash
#!/bin/bash
# Run via cron: 0 2 * * * /opt/backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M)

mkdir -p "$BACKUP_DIR"

# Backup database and uploads
docker run --rm \
  -v neurochat_backend_data:/source \
  -v "$BACKUP_DIR":/backup \
  ubuntu tar czf "/backup/neurochat_${DATE}.tar.gz" /source

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete: neurochat_${DATE}.tar.gz"
```

### Restore

```bash
docker run --rm \
  -v neurochat_backend_data:/target \
  -v /opt/backups:/backup \
  ubuntu bash -c "cd /target && tar xzf /backup/neurochat_20240101_0200.tar.gz --strip-components=1"
```

### Auto-Backup via Cron

```bash
crontab -e
# Add:
0 2 * * * /opt/backup.sh >> /var/log/neurochat-backup.log 2>&1
```

---

## 19. Monitoring & Logs

### Check Service Health

```bash
# App health
curl https://yourdomain.com/api/health

# Ollama status
curl http://localhost:11434/api/tags

# Running models
curl http://localhost:11434/api/ps
```

### Docker Logs

```bash
docker compose logs -f              # all services
docker compose logs -f backend      # backend only
docker compose logs -f ollama       # ollama only
docker compose logs --tail=100 nginx # last 100 nginx lines
```

### Application Logs

```bash
tail -f backend/logs/neurochat.log
```

### Simple Uptime Monitoring (Free)

- [UptimeRobot](https://uptimerobot.com) — free, pings every 5 min, email alerts
- Add monitor: HTTP(s) → `https://yourdomain.com/api/health`

---

## 20. Troubleshooting

### ❌ "Ollama is not running" / "Connection refused"

```bash
# Check Ollama is running
ollama list
systemctl status ollama

# Start it
ollama serve
# OR
sudo systemctl start ollama
```

### ❌ "No models found" in UI

```bash
ollama pull llama3.2

# For Docker:
docker exec neurochat-ollama ollama pull llama3.2
```

### ❌ RAG not working / "embedding" error

```bash
# Pull the embedding model
ollama pull nomic-embed-text

# Or use alternative
ollama pull mxbai-embed-large
# Update backend/.env: DEFAULT_EMBEDDING_MODEL=mxbai-embed-large
```

### ❌ CORS error in browser

```bash
# In backend/.env, add your frontend domain:
CORS_ORIGINS=https://yourdomain.com,http://localhost:5173
```

### ❌ SSE streaming broken / chat hangs

```bash
# Ensure nginx has these settings:
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 600s;
chunked_transfer_encoding on;
# These are already in the provided nginx.conf ✅
```

### ❌ Docker container out of memory

```bash
# Use a smaller model
docker exec neurochat-ollama ollama pull phi3    # only 1.6GB

# Or add memory limit in docker-compose.yml:
ollama:
  mem_limit: 8g
```

### ❌ File upload fails on cloud

```bash
# Ensure UPLOAD_DIR is on a persistent volume, not ephemeral storage
# In backend/.env:
UPLOAD_DIR=/mnt/data/uploads
```

### ❌ Render / Railway build fails

```bash
# Check Python version in build log — needs 3.11+
# Add to backend/runtime.txt:
echo "python-3.11.9" > backend/runtime.txt
```

---

## 21. Cost Comparison

### Monthly Cost by Platform

| Platform | Frontend | Backend | Ollama | Total |
|----------|----------|---------|--------|-------|
| **Local Machine** | Free | Free | Free | **$0** |
| **Docker on VPS** | Included | Included | Included | **$8–96/mo** |
| **Hetzner CX32** | Included | Included | Included | **~€8/mo** |
| **DigitalOcean 8GB** | Included | Included | Included | **$48/mo** |
| **Render + RunPod GPU** | Free | $7/mo | ~$30/mo (150hr) | **~$37/mo** |
| **Railway + RunPod** | Free | $10/mo | ~$30/mo | **~$40/mo** |
| **Fly.io + RunPod** | Free | $5/mo | ~$30/mo | **~$35/mo** |
| **Vercel + Render backend** | Free | $7/mo | External | **$7+/mo** |
| **AWS EC2 m5.xlarge** | Included | Included | Included | **~$140/mo** |
| **AWS EC2 g4dn.xlarge** | Included | Included | GPU ✅ | **~$380/mo** |
| **GCP n2-standard-4** | Included | Included | Included | **~$140/mo** |
| **Azure D4s_v3** | Included | Included | Included | **~$140/mo** |

### Recommended by Use Case

| Scenario | Platform | Monthly Cost |
|----------|----------|-------------|
| Personal use, home | Local Machine | **Free** |
| Developer portfolio | Render + RunPod (pay-as-you-go) | **~$10–15** |
| Small team (2–10) | DigitalOcean 8GB or Hetzner CX42 | **~$16–48** |
| Medium team (10–50) | Dedicated VPS + GPU server | **~$50–200** |
| Enterprise / Production | AWS g4dn or Azure NC T4 | **$400+** |

---

<div align="center">

💡 Concept, Design & Creation by [Mr.StrangeSree](https://github.com/mrstrangesree/)

</div>
