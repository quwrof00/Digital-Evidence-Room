from __future__ import annotations

import json
import os
from threading import Lock
import contextvars

from strands import Agent, tool
from strands.models import BedrockModel

import store
from json_util import parse_json_payload

MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "global.anthropic.claude-sonnet-4-6")
AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-west-2"))

current_case_id: contextvars.ContextVar[str] = contextvars.ContextVar("current_case_id")

def _model() -> BedrockModel:
    return BedrockModel(model_id=MODEL_ID, region_name=AWS_REGION, temperature=0.1)


def _agent(system_prompt: str) -> Agent:
    return Agent(
        model=_model(),
        system_prompt=system_prompt,
        callback_handler=None,
    )


TIMELINE_PROMPT = """You are the Timeline Agent for a legal evidence room.
Return ONLY JSON:
{"events":[{"timestamp":"YYYY-MM-DD or original date string","description":"one sentence","is_contradiction":false,"chunk_index":0,"source_file":""}]}
Use dates found in the evidence. Flag is_contradiction true when two sources disagree about the same fact."""

ENTITY_PROMPT = """You are the Entity Agent for a legal evidence room.
Return ONLY JSON:
{"entities":[{"type":"Person|Organization|Account|PhoneNumber|Other","name":"...","source_file":""}]}
Do not invent people who are not in the text."""

CLAIMS_PROMPT = """You are the Claims Agent for a legal evidence room.
Return ONLY JSON:
{"claims":[{"assertion":"...","confidence":"High|Medium|Low","source_file":"","conflicts_with":""}]}
conflicts_with is empty unless this claim contradicts another source."""

INVESTIGATOR_PROMPT = """You are the Digital Evidence Room investigator.
Use tools to search ingested evidence, the timeline, and extracted claims.
Answer only from tool results. Cite source file names. If evidence is missing, say so.
Keep answers concise."""


_extract_lock = Lock()
_timeline_agent: Agent | None = None
_entity_agent: Agent | None = None
_claims_agent: Agent | None = None
_orchestrator: Agent | None = None
_investigator: Agent | None = None


def _timeline() -> Agent:
    global _timeline_agent
    if _timeline_agent is None:
        _timeline_agent = _agent(TIMELINE_PROMPT)
    return _timeline_agent


def _entity() -> Agent:
    global _entity_agent
    if _entity_agent is None:
        _entity_agent = _agent(ENTITY_PROMPT)
    return _entity_agent


def _claims() -> Agent:
    global _claims_agent
    if _claims_agent is None:
        _claims_agent = _agent(CLAIMS_PROMPT)
    return _claims_agent


@tool
def run_timeline_agent(evidence_text: str) -> str:
    """Run the specialist Timeline Agent on evidence text and return dated events JSON."""
    result = _timeline()(
        "Extract the timeline from this evidence dossier:\n\n" + evidence_text[:12000]
    )
    return str(result)


@tool
def run_entity_agent(evidence_text: str) -> str:
    """Run the specialist Entity Agent on evidence text and return people/orgs JSON."""
    result = _entity()(
        "Extract entities from this evidence dossier:\n\n" + evidence_text[:12000]
    )
    return str(result)


@tool
def run_claims_agent(evidence_text: str) -> str:
    """Run the specialist Claims Agent on evidence text and return assertions JSON."""
    result = _claims()(
        "Extract claims and contradictions from this evidence dossier:\n\n"
        + evidence_text[:12000]
    )
    return str(result)


@tool
def persist_extractions(timeline_json: str, entities_json: str, claims_json: str) -> str:
    """Save specialist agent JSON into the case store so the UI and investigator can use it."""
    case_id = current_case_id.get()
    timeline = parse_json_payload(timeline_json)
    entities = parse_json_payload(entities_json)
    claims = parse_json_payload(claims_json)
    events = timeline.get("events", timeline if isinstance(timeline, list) else [])
    ents = entities.get("entities", entities if isinstance(entities, list) else [])
    cls = claims.get("claims", claims if isinstance(claims, list) else [])
    if not isinstance(events, list):
        events = []
    if not isinstance(ents, list):
        ents = []
    if not isinstance(cls, list):
        cls = []
    store.set_extractions(case_id, events=events, entities=ents, claims=cls)
    return json.dumps(
        {"saved_events": len(events), "saved_entities": len(ents), "saved_claims": len(cls)}
    )


@tool
def search_evidence(query: str) -> str:
    """Search ingested evidence chunks by keyword and return matching excerpts."""
    case_id = current_case_id.get()
    hits = store.search(case_id, query)
    slim = [
        {
            "source_file": h.get("source_file"),
            "chunk_index": h.get("chunk_index"),
            "content": (h.get("content") or "")[:800],
        }
        for h in hits
    ]
    return json.dumps(slim)


@tool
def list_timeline() -> str:
    """Return extracted timeline events for this case."""
    case_id = current_case_id.get()
    return json.dumps(store.timeline(case_id))


@tool
def list_claims() -> str:
    """Return extracted claims and contradiction notes for this case."""
    case_id = current_case_id.get()
    return json.dumps(store.claims(case_id))


def orchestrator() -> Agent:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Agent(
            model=_model(),
            system_prompt=(
                "You supervise three specialist Strands agents for a digital evidence case. "
                "Call run_timeline_agent, run_entity_agent, and run_claims_agent on the dossier, "
                "then persist_extractions with their raw JSON strings. Do not skip persist_extractions."
            ),
            tools=[run_timeline_agent, run_entity_agent, run_claims_agent, persist_extractions],
            callback_handler=None,
        )
    return _orchestrator


def investigator() -> Agent:
    global _investigator
    if _investigator is None:
        _investigator = Agent(
            model=_model(),
            system_prompt=INVESTIGATOR_PROMPT,
            tools=[search_evidence, list_timeline, list_claims],
            callback_handler=None,
        )
    return _investigator


def run_extraction(case_id: str) -> dict:
    current_case_id.set(case_id)
    with _extract_lock:
        dossier = store.dossier_text(case_id)
        orchestrator()(
            "Process this case dossier with all three specialist agents, then persist results.\n\n"
            + dossier
        )
        snap = store.snapshot(case_id)
        return {
            "events": snap["events"],
            "entities": snap["entities"],
            "claims": snap["claims"],
            "chunk_count": snap["chunk_count"],
        }


def ask_investigator(case_id: str, question: str) -> str:
    current_case_id.set(case_id)
    result = investigator()(question)
    return str(result)
