# 🧠 NeuroChat AI

<div align="center">

![NeuroChat AI](https://img.shields.io/badge/NeuroChat-AI%20Assistant-6366f1?style=for-the-badge&logo=robot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000000?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack AI assistant powered entirely by Ollama — 100% local, zero API keys, zero subscriptions.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Models](#-supported-models) • [API](#-api-reference) • [Hosting](#-hosting) • [Deployment](DEPLOYMENT.md) • [Host Guide](HOST.md)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multiple LLMs** | Llama 3, Mistral, Phi-3, Gemma, DeepSeek — any Ollama model, switch live |
| ⚡ **Streaming Responses** | Real-time token streaming via Server-Sent Events (SSE) |
| 💾 **Conversation History** | Persistent SQLite storage — search, star, rename, export conversations |
| 📄 **RAG (Document Q&A)** | Upload PDF, DOCX, TXT, MD, CSV — ask AI questions about your files |
| 🌐 **Web Search** | DuckDuckGo integration baked in — no API key required |
| 🎨 **Stunning UI** | Glassmorphism design, animated gradients, dark theme, fully responsive |
| ✍️ **Markdown Rendering** | Full GFM markdown with syntax-highlighted code blocks + copy buttons |
| 🎭 **AI Personas** | Pre-built system prompts: Code Expert, Teacher, Researcher, Writer & more |
| ⚙️ **Fine-Grained Control** | Temperature, max tokens, RAG toggle, web search toggle — per message |
| 📤 **Export Conversations** | One-click JSON export of any conversation |
| 🔒 **100% Private** | All data stays on your machine — no telemetry, no cloud, no tracking |
| 🐳 **Docker Ready** | Full stack deploys in one command with Docker Compose |
| 🌍 **Multi-Platform** | Works on Windows, macOS, Linux, and all major cloud platforms |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| Python | 3.11+ | https://python.org |
| Node.js | 20+ | https://nodejs.org |
| Ollama | Latest | https://ollama.ai |

### Step 1 — Install Ollama & Pull a Model

```bash
# ── Install Ollama ──────────────────────────────────────────────
# Windows:  Download from https://ollama.ai/download/windows
# macOS:    brew install ollama
# Linux:    curl -fsSL https://ollama.ai/install.sh | sh

# ── Pull your preferred model ───────────────────────────────────
ollama pull llama3.2          # ⭐ Recommended — best balance (2GB)
ollama pull mistral           # Great for coding & reasoning (4GB)
ollama pull phi3              # Fastest on CPU — only 1.6GB
ollama pull deepseek-coder-v2 # Best code generation
ollama pull gemma2            # Google Gemma 2 — very capable

# ── Pull embedding model (required for RAG / document Q&A) ──────
ollama pull nomic-embed-text
```

### Step 2 — One-Command Start (Recommended)

```bash
cd neurochat
python start.py
```

This script auto-installs all dependencies, copies config files, and starts both servers.

**Frontend:** http://localhost:5173  
**API Docs:** http://localhost:8000/api/docs

### Step 3 — Manual Setup (Alternative)

**Backend:**
```bash
cd neurochat/backend

cp .env.example .env             # copy config
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd neurochat/frontend

cp .env.example .env             # copy config
npm install
npm run dev
```

---

## 🐳 Docker Quick Start (Production)

```bash
cd neurochat

# Build and start all 4 services
docker compose up --build -d

# Pull models into the Ollama container
docker exec neurochat-ollama ollama pull llama3.2
docker exec neurochat-ollama ollama pull nomic-embed-text

# Visit http://localhost ✅
```

Services started:

| Container | Role | Port |
|-----------|------|------|
| `neurochat-nginx` | Reverse proxy | 80, 443 |
| `neurochat-frontend` | React app | 80 (internal) |
| `neurochat-backend` | FastAPI | 8000 (internal) |
| `neurochat-ollama` | LLM runtime | 11434 (internal) |

---

## 🏗️ Architecture

```
neurochat/
├── backend/                        # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                 # App entry, CORS, lifespan
│   │   ├── config.py               # Env-based settings (pydantic-settings)
│   │   ├── database.py             # Async SQLAlchemy + aiosqlite
│   │   ├── models.py               # DB models: Conversation, Message, Document
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── chat.py             # SSE streaming chat endpoint
│   │   │   ├── conversations.py    # CRUD for conversation history
│   │   │   ├── ollama_models.py    # List / pull / delete Ollama models
│   │   │   └── documents.py        # File upload & RAG indexing
│   │   └── services/
│   │       ├── ollama_service.py   # Ollama HTTP client (stream + complete)
│   │       └── rag_service.py      # ChromaDB vector store + LangChain
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                       # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx                 # Root component, layout, state
│   │   ├── index.css               # Tailwind + glassmorphism design system
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx   # Main chat area with SSE streaming
│   │   │   ├── Sidebar.jsx         # Conversation list, search, filters
│   │   │   ├── MessageBubble.jsx   # Markdown + syntax-highlighted code
│   │   │   ├── ChatInput.jsx       # Auto-resize input with send/stop
│   │   │   ├── ModelSelector.jsx   # Dynamic Ollama model switcher
│   │   │   ├── DocumentUpload.jsx  # Drag-and-drop RAG file uploader
│   │   │   └── SettingsPanel.jsx   # Temperature, tokens, system prompts
│   │   ├── hooks/
│   │   │   ├── useChat.js          # SSE streaming state
│   │   │   └── useConversations.js # Conversation CRUD state
│   │   └── services/
│   │       └── api.js              # Axios + SSE fetch wrappers
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml              # Full stack orchestration
├── nginx.conf                      # Reverse proxy + SSE support
├── render.yaml                     # Render.com blueprint
├── Dockerfile.render               # Combined image for Render
├── start-render.sh                 # Render startup script
├── start.py                        # Local one-command dev start
├── README.md
├── DEPLOYMENT.md
└── HOST.md
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **LLM Engine** | [Ollama](https://ollama.ai) | Local model runner — zero API keys |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com) + [Uvicorn](https://www.uvicorn.org) | Async REST API + SSE streaming |
| **ORM** | [SQLAlchemy 2.0](https://sqlalchemy.org) + [aiosqlite](https://github.com/omnilib/aiosqlite) | Async database layer |
| **Vector Store** | [ChromaDB](https://www.trychroma.com) | Document embeddings for RAG |
| **RAG** | [LangChain](https://langchain.com) + LangChain-Ollama | Document chunking + retrieval |
| **Frontend** | [React 18](https://react.dev) + [Vite 5](https://vitejs.dev) | SPA with fast HMR |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com) | Utility-first + glassmorphism |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI transitions |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | Code + prose rendering |
| **Streaming** | Server-Sent Events (SSE) | Real-time token delivery |
| **Web Search** | [DuckDuckGo Search](https://github.com/deedy5/duckduckgo_search) | No-API-key web lookup |
| **Proxy** | [Nginx](https://nginx.org) | SSE-aware reverse proxy |
| **Containers** | [Docker](https://docker.com) + Docker Compose | One-command deployment |

---

## 🤖 Supported Models

Any model in [Ollama's library](https://ollama.com/library) works out of the box:

```bash
# ── General Purpose ──────────────────────────────────────────────
ollama pull llama3.2            # ⭐ Best default — Meta Llama 3.2 3B
ollama pull llama3.1            # Meta Llama 3.1 8B — more capable
ollama pull mistral             # Mistral 7B — fast & smart
ollama pull gemma2              # Google Gemma 2 9B
ollama pull qwen2.5             # Alibaba Qwen 2.5 — multilingual

# ── Coding ───────────────────────────────────────────────────────
ollama pull deepseek-coder-v2   # Best code generation overall
ollama pull codellama           # Meta Code Llama 7B
ollama pull qwen2.5-coder       # Qwen 2.5 Coder — fast & accurate
ollama pull starcoder2          # StarCoder 2 — 80+ languages

# ── Lightweight (runs on 4GB RAM / CPU) ──────────────────────────
ollama pull phi3                # Microsoft Phi-3 Mini — 1.6GB
ollama pull phi3.5              # Microsoft Phi-3.5 — smarter
ollama pull tinyllama           # TinyLlama 1.1B — ultra fast
ollama pull qwen2.5:0.5b        # Qwen 0.5B — smallest useful model

# ── Vision / Multimodal ──────────────────────────────────────────
ollama pull llava               # LLaVA — image + text understanding
ollama pull llava:13b           # LLaVA 13B — more accurate

# ── Embeddings (required for RAG) ────────────────────────────────
ollama pull nomic-embed-text    # ⭐ Best embedding model
ollama pull mxbai-embed-large   # Alternative embedding model
```

---

## 🔌 API Reference

The backend REST API runs at `http://localhost:8000`:

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/stream` | Stream chat response (SSE) — main chat endpoint |

**Request body:**
```json
{
  "conversation_id": "uuid",
  "message": "Your message here",
  "model": "llama3.2",
  "temperature": 0.7,
  "max_tokens": null,
  "use_rag": false,
  "web_search": false,
  "stream": true
}
```

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations/{id}` | Get conversation with full message history |
| `PUT` | `/api/conversations/{id}` | Update title / model / system prompt |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation |
| `DELETE` | `/api/conversations` | Delete all conversations |
| `POST` | `/api/conversations/{id}/export` | Export as JSON |

### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List all installed Ollama models |
| `POST` | `/api/models/pull` | Pull / download a model (SSE progress) |
| `DELETE` | `/api/models/{name}` | Delete an installed model |

### Documents (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload and index a document |
| `GET` | `/api/documents` | List uploaded documents |
| `DELETE` | `/api/documents/{id}` | Delete a document and its embeddings |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — app + Ollama status |
| `GET` | `/api/info` | App info and feature flags |
| `GET` | `/api/docs` | Interactive Swagger UI |
| `GET` | `/api/redoc` | ReDoc API reference |

---

## ⚙️ Configuration

All settings are controlled via environment variables or `backend/.env`:

```env
# ── Ollama ────────────────────────────────────
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.2
DEFAULT_EMBEDDING_MODEL=nomic-embed-text

# ── Database ──────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///./neurochat.db

# ── Files ─────────────────────────────────────
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=52428800           # 50MB in bytes
ALLOWED_EXTENSIONS=[".pdf",".txt",".md",".docx",".csv"]

# ── ChromaDB (RAG) ────────────────────────────
CHROMA_PERSIST_DIR=./chroma_db

# ── CORS (comma-separated or JSON array) ──────
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ── Debug ─────────────────────────────────────
DEBUG=false
```

Frontend `.env`:
```env
VITE_API_URL=/api          # dev: /api proxied to localhost:8000
                           # prod: https://your-backend-domain.com/api
```

---

## 🌍 Hosting

NeuroChat AI is designed to run on **any platform**. The same codebase works everywhere — only 3 environment variables change per deployment:

| Variable | What to set |
|----------|-------------|
| `OLLAMA_BASE_URL` | URL of wherever Ollama is running |
| `CORS_ORIGINS` | Your frontend's public domain |
| `VITE_API_URL` | Your backend's public URL (frontend build-time) |

### Platform Quick Reference

| Platform | Effort | Cost | Best For |
|----------|--------|------|----------|
| **Local** | ⭐ Easiest | Free | Personal use |
| **Docker Compose** | Easy | Hosting cost only | Self-hosted production |
| **Render** | Easy | $7–85/mo | Developers, small teams |
| **DigitalOcean** | Easy | $24–96/mo | Small to medium teams |
| **Hetzner** | Easy | €4–16/mo | Best value in Europe |
| **Railway** | Easy | $5+/mo | Developers |
| **Fly.io** | Moderate | $0–20/mo | Developers, free tier |
| **AWS EC2** | Moderate | $60–400+/mo | Enterprise, GPU support |
| **Google Cloud** | Moderate | $50–600+/mo | Enterprise, GPU support |
| **Azure** | Moderate | $35–500+/mo | Enterprise, GPU support |
| **Vercel/Netlify** | Easy | Free | Frontend only |

📖 **Full step-by-step instructions for every platform → [HOST.md](HOST.md)**

---

## 🛠️ Development

### Backend (hot-reload)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --log-level debug --port 8000
```

### Frontend (hot-reload)
```bash
cd frontend
npm run dev
```

### Build frontend for production
```bash
cd frontend
npm run build         # outputs to frontend/dist/
npm run preview       # preview production build locally
```

### Useful commands
```bash
# Check backend API interactively
open http://localhost:8000/api/docs

# List running Ollama models
ollama ps

# Check which model is loaded
curl http://localhost:11434/api/ps

# Health check
curl http://localhost:8000/api/health
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test them
4. Commit: `git commit -m 'feat: add your feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ using Ollama, FastAPI, and React

**No cloud. No keys. No tracking. Just AI.**

---

💡 Concept, Design & Creation by [Mr.StrangeSree](https://github.com/mrstrangesree/)

</div>
