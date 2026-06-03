from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Message Schemas ─────────────────────────────────────────────────────────
class MessageBase(BaseModel):
    role: str
    content: str


class MessageCreate(MessageBase):
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    generation_time: Optional[float] = None


class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    generation_time: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Conversation Schemas ─────────────────────────────────────────────────────
class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    model: str = "llama3.2"
    system_prompt: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    is_starred: Optional[bool] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    model: str
    system_prompt: Optional[str] = None
    is_starred: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# ── Chat Schemas ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    model: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=8192)
    use_rag: bool = False
    web_search: bool = False
    stream: bool = True


class ChatResponse(BaseModel):
    message_id: str
    conversation_id: str
    content: str
    model: str
    tokens_used: Optional[int] = None
    generation_time: Optional[float] = None


# ── Model Schemas ────────────────────────────────────────────────────────────
class OllamaModel(BaseModel):
    name: str
    size: Optional[int] = None
    digest: Optional[str] = None
    modified_at: Optional[str] = None
    parameter_size: Optional[str] = None
    quantization_level: Optional[str] = None


class ModelPullRequest(BaseModel):
    model_name: str


# ── Document Schemas ─────────────────────────────────────────────────────────
class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    chunk_count: int
    is_indexed: bool
    created_at: datetime
    conversation_id: Optional[str] = None

    class Config:
        from_attributes = True


# ── Web Search Schemas ───────────────────────────────────────────────────────
class WebSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=5, ge=1, le=10)


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
