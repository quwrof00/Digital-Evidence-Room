from __future__ import annotations

from threading import Lock
from typing import Any

_lock = Lock()
_chunks: list[dict[str, Any]] = []
_events: list[dict[str, Any]] = []
_entities: list[dict[str, Any]] = []
_claims: list[dict[str, Any]] = []


def reset() -> None:
    with _lock:
        _chunks.clear()
        _events.clear()
        _entities.clear()
        _claims.clear()


def ingest_chunks(chunks: list[dict[str, Any]]) -> int:
    with _lock:
        for chunk in chunks:
            _chunks.append(chunk)
        return len(_chunks)


def all_chunks() -> list[dict[str, Any]]:
    with _lock:
        return list(_chunks)


def dossier_text(limit: int = 14000) -> str:
    parts: list[str] = []
    total = 0
    with _lock:
        for chunk in _chunks:
            block = (
                f"[chunk {chunk.get('chunk_index')} | {chunk.get('source_file')}]\n"
                f"{chunk.get('content', '')}\n"
            )
            if total + len(block) > limit:
                break
            parts.append(block)
            total += len(block)
    return "\n".join(parts) if parts else "(no evidence ingested yet)"


def set_extractions(
    events: list[dict[str, Any]] | None = None,
    entities: list[dict[str, Any]] | None = None,
    claims: list[dict[str, Any]] | None = None,
) -> None:
    with _lock:
        if events is not None:
            _events.clear()
            _events.extend(events)
        if entities is not None:
            _entities.clear()
            _entities.extend(entities)
        if claims is not None:
            _claims.clear()
            _claims.extend(claims)


def search(query: str, limit: int = 8) -> list[dict[str, Any]]:
    q = query.lower().strip()
    hits: list[dict[str, Any]] = []
    with _lock:
        for chunk in _chunks:
            text = f"{chunk.get('source_file', '')} {chunk.get('content', '')}"
            if q and q in text.lower():
                hits.append(chunk)
            elif not q:
                hits.append(chunk)
            if len(hits) >= limit:
                break
        if not hits:
            hits = _chunks[:limit]
    return hits


def timeline() -> list[dict[str, Any]]:
    with _lock:
        return list(_events)


def entities() -> list[dict[str, Any]]:
    with _lock:
        return list(_entities)


def claims() -> list[dict[str, Any]]:
    with _lock:
        return list(_claims)


def snapshot() -> dict[str, Any]:
    with _lock:
        return {
            "chunk_count": len(_chunks),
            "events": list(_events),
            "entities": list(_entities),
            "claims": list(_claims),
        }
