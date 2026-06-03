#!/bin/bash
# NeuroChat AI — Render startup script
# Starts Ollama in background, pulls model, then starts FastAPI
set -e

MODEL="${DEFAULT_MODEL:-phi3}"
EMBED_MODEL="${DEFAULT_EMBEDDING_MODEL:-nomic-embed-text}"

echo "======================================"
echo "  NeuroChat AI — Render Startup"
echo "  Model: $MODEL"
echo "======================================"

# Start Ollama as a background service
ollama serve &
OLLAMA_PID=$!
echo "Ollama PID: $OLLAMA_PID"

# Wait until Ollama is ready to accept requests
echo "Waiting for Ollama to be ready..."
MAX_WAIT=60
ELAPSED=0
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "ERROR: Ollama did not start in ${MAX_WAIT}s"
    exit 1
  fi
done
echo "Ollama is ready!"

# Pull main chat model (skip if already present in mounted disk)
if ollama list | grep -q "^${MODEL}"; then
  echo "Model '$MODEL' already present — skipping pull"
else
  echo "Pulling model: $MODEL ..."
  ollama pull "$MODEL"
  echo "Model '$MODEL' pulled successfully"
fi

# Pull embedding model (for RAG — non-fatal if unavailable)
if ollama list | grep -q "^${EMBED_MODEL}"; then
  echo "Embedding model '$EMBED_MODEL' already present"
else
  echo "Pulling embedding model: $EMBED_MODEL ..."
  ollama pull "$EMBED_MODEL" || echo "Warning: embedding model pull failed — RAG will be unavailable"
fi

echo "Starting FastAPI on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
