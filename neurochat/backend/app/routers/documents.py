import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from app.database import get_db
from app.models import Document
from app.schemas import DocumentResponse
from app.services.rag_service import rag_service
from app.config import settings
from loguru import logger

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Validate size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    # Save file
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Save metadata
    doc = Document(
        id=doc_id,
        filename=safe_filename,
        original_filename=file.filename,
        file_type=ext.lstrip("."),
        file_size=len(content),
        conversation_id=conversation_id,
    )
    db.add(doc)
    await db.commit()

    # Index in background
    try:
        chunk_count = await rag_service.index_document(file_path, doc_id, conversation_id)
        doc.chunk_count = chunk_count
        doc.is_indexed = True
        await db.commit()
        await db.refresh(doc)
        logger.info(f"Document {file.filename} indexed with {chunk_count} chunks")
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        await db.refresh(doc)

    return DocumentResponse.model_validate(doc)


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    conversation_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Document)
    if conversation_id:
        query = query.where(Document.conversation_id == conversation_id)
    query = query.order_by(Document.created_at.desc())
    result = await db.execute(query)
    return [DocumentResponse.model_validate(d) for d in result.scalars().all()]


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    file_path = os.path.join(settings.UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete from vector store
    await rag_service.delete_document(document_id, doc.conversation_id)

    await db.delete(doc)
    await db.commit()
