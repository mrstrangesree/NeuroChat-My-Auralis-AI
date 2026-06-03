import json
import time
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Conversation, Message
from app.schemas import ChatRequest, ChatResponse
from app.services.ollama_service import ollama_service
from app.services.rag_service import rag_service
from loguru import logger

try:
    from duckduckgo_search import DDGS
    HAS_SEARCH = True
except ImportError:
    HAS_SEARCH = False

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def build_messages(
    conversation: Conversation,
    new_message: str,
    system_prompt: Optional[str] = None,
    context: Optional[str] = None,
) -> list:
    msgs = []

    # System message
    base_system = system_prompt or conversation.system_prompt or (
        "You are NeuroChat, a helpful, harmless, and honest AI assistant. "
        "You provide clear, accurate, and thoughtful responses."
    )
    if context:
        base_system = context + "\n\n" + base_system
    msgs.append({"role": "system", "content": base_system})

    # History (last 20 messages to avoid context overflow)
    for msg in conversation.messages[-20:]:
        msgs.append({"role": msg.role, "content": msg.content})

    msgs.append({"role": "user", "content": new_message})
    return msgs


async def stream_response(
    conversation: Conversation,
    request: ChatRequest,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    model = request.model or conversation.model
    start_time = time.time()
    full_content = ""

    try:
        # RAG context
        rag_context = None
        if request.use_rag:
            chunks = await rag_service.search(request.message, conversation.id)
            if chunks:
                rag_context = rag_service.format_context(chunks)

        # Web search context
        if request.web_search and HAS_SEARCH:
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(request.message, max_results=4))
                if results:
                    search_ctx = "\n\n".join(
                        f"**{r['title']}**\n{r['body']}" for r in results
                    )
                    web_ctx = f"<web_search_results>\n{search_ctx}\n</web_search_results>\n\nUse these search results to help answer the question."
                    rag_context = (rag_context or "") + "\n\n" + web_ctx
            except Exception as e:
                logger.warning(f"Web search failed: {e}")

        messages = await build_messages(
            conversation, request.message, context=rag_context
        )

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
            model=model,
        )
        db.add(user_msg)
        await db.commit()
        await db.refresh(user_msg)

        yield f"data: {json.dumps({'type': 'start', 'message_id': user_msg.id})}\n\n"

        # Stream assistant response
        assistant_msg_id = None
        async for token in ollama_service.chat_stream(
            model=model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        ):
            full_content += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        generation_time = time.time() - start_time

        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=full_content,
            model=model,
            generation_time=round(generation_time, 2),
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)
        assistant_msg_id = assistant_msg.id

        # Auto-generate title for first message
        if len(conversation.messages) <= 1:
            title = await ollama_service.generate_title(request.message, model)
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conversation.id)
                .values(title=title)
            )
            await db.commit()
            yield f"data: {json.dumps({'type': 'title_update', 'title': title})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg_id, 'generation_time': round(generation_time, 2)})}\n\n"

    except ConnectionError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': 'An unexpected error occurred.'})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == request.conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Eagerly load messages
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == request.conversation_id)
    )
    conversation = result.scalar_one()

    return StreamingResponse(
        stream_response(conversation, request, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
