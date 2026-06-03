#!/usr/bin/env python3
"""
NeuroChat AI - Quick Start Script
Starts both backend and frontend with a single command (development mode).
"""
import subprocess
import sys
import os
import time
import platform
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def check_ollama():
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:11434/api/tags", timeout=3)
        return True
    except Exception:
        return False


def start():
    print("\n🧠 NeuroChat AI - Starting...\n")

    # Check Ollama
    if check_ollama():
        print("✅ Ollama is running")
    else:
        print("⚠️  Ollama not detected — please start Ollama first: ollama serve")
        print("   Then pull a model: ollama pull llama3.2\n")

    is_win = platform.system() == "Windows"
    activate = str(BACKEND / "venv" / ("Scripts" if is_win else "bin") / "activate")
    python = str(BACKEND / "venv" / ("Scripts" if is_win else "bin") / "python")
    uvicorn = str(BACKEND / "venv" / ("Scripts" if is_win else "bin") / "uvicorn")

    # Setup backend venv if needed
    if not Path(python).exists():
        print("📦 Setting up Python virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(BACKEND / "venv")], check=True)
        subprocess.run([python, "-m", "pip", "install", "-r", str(BACKEND / "requirements.txt")], check=True)
        print("✅ Backend dependencies installed\n")

    # Copy .env if needed
    if not (BACKEND / ".env").exists():
        if (BACKEND / ".env.example").exists():
            import shutil
            shutil.copy(BACKEND / ".env.example", BACKEND / ".env")

    # Start backend
    print("🚀 Starting backend on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(
        [uvicorn, "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(BACKEND),
    )

    time.sleep(2)

    # Setup frontend if needed
    if not (FRONTEND / "node_modules").exists():
        print("📦 Installing frontend dependencies (this takes a minute)...")
        subprocess.run(["npm", "install"], cwd=str(FRONTEND), check=True)

    if not (FRONTEND / ".env").exists():
        if (FRONTEND / ".env.example").exists():
            import shutil
            shutil.copy(FRONTEND / ".env.example", FRONTEND / ".env")

    # Start frontend
    print("🎨 Starting frontend on http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND),
    )

    print("\n" + "="*55)
    print("  ✅ NeuroChat AI is running!")
    print("  🌐 Open: http://localhost:5173")
    print("  📖 API docs: http://localhost:8000/api/docs")
    print("  Press Ctrl+C to stop")
    print("="*55 + "\n")

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()


if __name__ == "__main__":
    start()
