from __future__ import annotations

import os
from typing import Any

from crewai.tools import BaseTool
from langchain_community.vectorstores import PGVector
from langchain_openai import OpenAIEmbeddings
from pydantic import BaseModel, Field


class KnowledgeSearchInput(BaseModel):
    query: str = Field(..., description="Question ou contexte à rechercher dans la mémoire documentaire.")
    k: int = Field(default=4, ge=1, le=10, description="Nombre maximum de résultats à retourner.")


class KnowledgeSearchTool(BaseTool):
    name: str = "KnowledgeSearchTool"
    description: str = (
        "Recherche dans la base vectorielle MindMesh (collection mindmesh_knowledge) "
        "et retourne le contexte documentaire le plus pertinent."
    )
    args_schema: type[BaseModel] = KnowledgeSearchInput

    def _build_vector_store(self, embeddings: OpenAIEmbeddings, database_url: str) -> PGVector:
        attempts = (
            {"collection_name": "mindmesh_knowledge", "connection_string": database_url, "embedding_function": embeddings},
            {"collection_name": "mindmesh_knowledge", "connection_string": database_url, "embeddings": embeddings},
            {"collection_name": "mindmesh_knowledge", "connection_string": database_url, "embedding": embeddings},
        )

        last_error: Exception | None = None
        for kwargs in attempts:
            try:
                return PGVector(**kwargs)  # type: ignore[arg-type]
            except TypeError as error:
                last_error = error

        raise RuntimeError("Impossible d'initialiser PGVector pour la recherche documentaire.") from last_error

    @staticmethod
    def _format_documents(documents: list[Any]) -> str:
        formatted_chunks: list[str] = []

        for index, document in enumerate(documents, start=1):
            page_content = str(getattr(document, "page_content", "")).strip()
            metadata = getattr(document, "metadata", {}) or {}
            source = metadata.get("source") or metadata.get("file_path") or metadata.get("page") or "source inconnue"
            if not page_content:
                continue
            formatted_chunks.append(f"[{index}] {source}\n{page_content}")

        return "\n\n".join(formatted_chunks)

    def _run(self, query: str, k: int = 4) -> str:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return "DATABASE_URL n'est pas configurée."

        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            vector_store = self._build_vector_store(embeddings, database_url)
            documents = vector_store.similarity_search(query, k=max(1, min(int(k), 10)))
        except Exception as error:  # noqa: BLE001
            return f"Erreur lors de la recherche documentaire: {error}"

        if not documents:
            return "Aucun contexte pertinent trouvé dans la collection mindmesh_knowledge."

        formatted_documents = self._format_documents(documents)
        return formatted_documents or "Aucun contexte pertinent trouvé dans la collection mindmesh_knowledge."
