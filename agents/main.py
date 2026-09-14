from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv("../.env")
load_dotenv(".env")

import store
from strands_team import ask_investigator, run_extraction

app = FastAPI(title="Digital Evidence Room — Strands Agents", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChunkIn(BaseModel):
    chunk_index: int
    source_file: str
    file_type: str = ""
    content: str
    detected_date: str | None = None
    document_id: str | None = None


class IngestRequest(BaseModel):
    document_id: str
    chunks: list[ChunkIn]


class AskRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[dict[str, str]] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "strands-agents",
        "aws_region": os.getenv("AWS_REGION", "us-west-2"),
        "model": os.getenv("BEDROCK_MODEL_ID", "global.anthropic.claude-sonnet-4-6"),
        "chunks": store.snapshot()["chunk_count"],
        "credentials_hint": bool(
            os.getenv("AWS_ACCESS_KEY_ID")
            or os.getenv("AWS_PROFILE")
            or os.getenv("AWS_BEARER_TOKEN_BEDROCK")
        ),
    }


@app.post("/ingest")
def ingest(req: IngestRequest) -> dict[str, Any]:
    payload = [c.model_dump() for c in req.chunks]
    count = store.ingest_chunks(payload)
    return {"ingested": len(payload), "total_chunks": count, "document_id": req.document_id}


@app.post("/extract")
def extract() -> dict[str, Any]:
    if not store.all_chunks():
        raise HTTPException(status_code=400, detail="No evidence ingested")
    try:
        return run_extraction()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Strands/Bedrock failed: {exc}") from exc


@app.post("/ask")
def ask(req: AskRequest) -> dict[str, str]:
    try:
        answer = ask_investigator(req.message)
        return {"answer": answer}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Investigator failed: {exc}") from exc


@app.get("/case")
def case_snapshot() -> dict[str, Any]:
    return store.snapshot()
