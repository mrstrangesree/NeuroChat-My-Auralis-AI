import httpx
import json
import asyncio
from typing import AsyncGenerator, List, Dict, Optional, Any
from app.config import settings
from loguru import logger


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.timeout = httpx.Timeout(300.0, connect=10.0)

    async def list_models(self) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return data.get("models", [])
            except httpx.ConnectError:
                logger.error("Cannot connect to Ollama. Is it running?")
                raise ConnectionError("Ollama is not running. Please start Ollama first.")
            except Exception as e:
                logger.error(f"Error listing models: {e}")
                raise

    async def pull_model(self, model_name: str) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/pull",
                json={"name": model_name},
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        yield line

    async def delete_model(self, model_name: str) -> bool:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                f"{self.base_url}/api/delete",
                json={"name": model_name},
            )
            return response.status_code == 200

    async def chat_stream(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
            },
        }
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        async with httpx.AsyncClient(timeout=None) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    yield data["message"]["content"]
                                if data.get("done"):
                                    return
                            except json.JSONDecodeError:
                                continue
            except httpx.ConnectError:
                raise ConnectionError("Ollama is not running. Please start Ollama first.")

    async def chat_complete(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            return response.json()

    async def generate_title(self, message: str, model: str) -> str:
        """Generate a concise title for a conversation from the first message."""
        try:
            result = await self.chat_complete(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": f"Generate a short, concise title (max 6 words) for a conversation that starts with:\n\n{message[:200]}\n\nRespond with ONLY the title, no punctuation or quotes.",
                    }
                ],
                temperature=0.3,
                max_tokens=20,
            )
            title = result.get("message", {}).get("content", "").strip()
            return title[:80] if title else "New Conversation"
        except Exception:
            return "New Conversation"

    async def get_embeddings(self, text: str, model: str = None) -> List[float]:
        embed_model = model or settings.DEFAULT_EMBEDDING_MODEL
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": embed_model, "prompt": text},
            )
            response.raise_for_status()
            return response.json().get("embedding", [])

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False


ollama_service = OllamaService()
