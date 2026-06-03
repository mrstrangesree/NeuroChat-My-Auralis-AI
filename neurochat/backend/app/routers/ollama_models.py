from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.ollama_service import ollama_service
from app.schemas import OllamaModel, ModelPullRequest
from typing import List
import json

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("", response_model=List[OllamaModel])
async def list_models():
    try:
        models = await ollama_service.list_models()
        result = []
        for m in models:
            details = m.get("details", {})
            result.append(
                OllamaModel(
                    name=m["name"],
                    size=m.get("size"),
                    digest=m.get("digest"),
                    modified_at=m.get("modified_at"),
                    parameter_size=details.get("parameter_size"),
                    quantization_level=details.get("quantization_level"),
                )
            )
        return result
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/pull")
async def pull_model(request: ModelPullRequest):
    """Stream model pull progress as SSE."""
    async def generate():
        async for line in ollama_service.pull_model(request.model_name):
            yield f"data: {line}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("/{model_name:path}")
async def delete_model(model_name: str):
    success = await ollama_service.delete_model(model_name)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": f"Model {model_name} deleted"}
