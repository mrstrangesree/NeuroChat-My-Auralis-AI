import os
import uuid
import asyncio
from pathlib import Path
from typing import List, Optional
from loguru import logger
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
    Docx2txtLoader,
    CSVLoader,
)
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from app.config import settings


class RAGService:
    def __init__(self):
        self.embed_model = settings.DEFAULT_EMBEDDING_MODEL
        self.chroma_dir = settings.CHROMA_PERSIST_DIR
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self._embeddings = None

    def _get_embeddings(self):
        if self._embeddings is None:
            self._embeddings = OllamaEmbeddings(
                model=self.embed_model,
                base_url=settings.OLLAMA_BASE_URL,
            )
        return self._embeddings

    def _get_vectorstore(self, collection_name: str) -> Chroma:
        return Chroma(
            collection_name=collection_name,
            embedding_function=self._get_embeddings(),
            persist_directory=self.chroma_dir,
        )

    async def index_document(
        self, file_path: str, document_id: str, conversation_id: Optional[str] = None
    ) -> int:
        """Index a document and return the number of chunks created."""
        try:
            ext = Path(file_path).suffix.lower()
            loader_map = {
                ".pdf": PyPDFLoader,
                ".txt": TextLoader,
                ".md": UnstructuredMarkdownLoader,
                ".docx": Docx2txtLoader,
                ".csv": CSVLoader,
            }
            loader_cls = loader_map.get(ext)
            if not loader_cls:
                raise ValueError(f"Unsupported file type: {ext}")

            loader = loader_cls(file_path)
            docs = await asyncio.get_event_loop().run_in_executor(None, loader.load)
            chunks = self.text_splitter.split_documents(docs)

            # Add metadata
            for chunk in chunks:
                chunk.metadata["document_id"] = document_id
                if conversation_id:
                    chunk.metadata["conversation_id"] = conversation_id

            collection_name = f"conv_{conversation_id}" if conversation_id else "global"
            vectorstore = self._get_vectorstore(collection_name)

            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: vectorstore.add_documents(chunks),
            )

            logger.info(f"Indexed {len(chunks)} chunks for document {document_id}")
            return len(chunks)
        except Exception as e:
            logger.error(f"Error indexing document: {e}")
            raise

    async def search(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        k: int = 5,
    ) -> List[str]:
        """Search for relevant document chunks."""
        try:
            collection_name = f"conv_{conversation_id}" if conversation_id else "global"
            vectorstore = self._get_vectorstore(collection_name)
            docs = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: vectorstore.similarity_search(query, k=k),
            )
            return [doc.page_content for doc in docs]
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            return []

    async def delete_document(self, document_id: str, conversation_id: Optional[str] = None):
        """Remove document chunks from vector store."""
        try:
            collection_name = f"conv_{conversation_id}" if conversation_id else "global"
            vectorstore = self._get_vectorstore(collection_name)
            vectorstore.delete(where={"document_id": document_id})
            logger.info(f"Deleted document {document_id} from vector store")
        except Exception as e:
            logger.warning(f"Could not delete from vector store: {e}")

    def format_context(self, chunks: List[str]) -> str:
        if not chunks:
            return ""
        formatted = "\n\n---\n\n".join(chunks)
        return f"""You have access to the following relevant document context:

<context>
{formatted}
</context>

Use this context to answer the user's question accurately. If the context doesn't contain the answer, say so."""


rag_service = RAGService()
