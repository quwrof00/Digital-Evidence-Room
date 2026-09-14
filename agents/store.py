from __future__ import annotations

from collections import defaultdict
from threading import Lock
from typing import Any

_lock = Lock()
_chunks: dict[str, list[dict[str, Any]]] = defaultdict(list)
_events: dict[str, list[dict[str, Any]]] = defaultdict(list)
_entities: dict[str, list[dict[str, Any]]] = defaultdict(list)
_claims: dict[str, list[dict[str, Any]]] = defaultdict(list)


def reset(case_id: str) -> None:
    with _lock:
        if case_id in _chunks:
            _chunks[case_id].clear()
        if case_id in _events:
            _events[case_id].clear()
        if case_id in _entities:
            _entities[case_id].clear()
        if case_id in _claims:
            _claims[case_id].clear()


def ingest_chunks(case_id: str, chunks: list[dict[str, Any]]) -> int:
    with _lock:
        _chunks[case_id].extend(chunks)
        return len(_chunks[case_id])


def all_chunks(case_id: str) -> list[dict[str, Any]]:
    with _lock:
        return list(_chunks[case_id])


def dossier_text(case_id: str, limit: int = 14000) -> str:
    parts: list[str] = []
    total = 0
    with _lock:
        for chunk in _chunks[case_id]:
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
    case_id: str,
    events: list[dict[str, Any]] | None = None,
    entities: list[dict[str, Any]] | None = None,
    claims: list[dict[str, Any]] | None = None,
) -> None:
    with _lock:
        if events is not None:
            _events[case_id].clear()
            _events[case_id].extend(events)
        if entities is not None:
            _entities[case_id].clear()
            _entities[case_id].extend(entities)
        if claims is not None:
            _claims[case_id].clear()
            _claims[case_id].extend(claims)


def search(case_id: str, query: str, limit: int = 8) -> list[dict[str, Any]]:
    q = query.lower().strip()
    hits: list[dict[str, Any]] = []
    with _lock:
        for chunk in _chunks[case_id]:
            text = f"{chunk.get('source_file', '')} {chunk.get('content', '')}"
            if q and q in text.lower():
                hits.append(chunk)
            elif not q:
                hits.append(chunk)
            if len(hits) >= limit:
                break
        if not hits:
            hits = _chunks[case_id][:limit]
    return hits


def timeline(case_id: str) -> list[dict[str, Any]]:
    with _lock:
        return list(_events[case_id])


def entities(case_id: str) -> list[dict[str, Any]]:
    with _lock:
        return list(_entities[case_id])


def claims(case_id: str) -> list[dict[str, Any]]:
    with _lock:
        return list(_claims[case_id])


def snapshot(case_id: str) -> dict[str, Any]:
    with _lock:
        return {
            "chunk_count": len(_chunks[case_id]),
            "events": list(_events[case_id]),
            "entities": list(_entities[case_id]),
            "claims": list(_claims[case_id]),
        }
