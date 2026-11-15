"""Structured filters, SQLite FTS5, and vector retrieval."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import numpy as np

from .catalog import RECORDS
from .models import EvidenceClass, FuelPhase, InvestigationRecord, ProjectType, SafetyTheme, Scenario

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data" / "generated" / "firesight.db"
EMBEDDINGS_PATH = ROOT / "data" / "embeddings.npy"
MANIFEST_PATH = ROOT / "data" / "embeddings_manifest.json"

_EMBEDDINGS: np.ndarray | None = None
_ID_TO_INDEX: dict[str, int] = {}


def _ensure_embeddings() -> tuple[np.ndarray | None, dict[str, int]]:
    global _EMBEDDINGS, _ID_TO_INDEX
    if _EMBEDDINGS is not None:
        return _EMBEDDINGS, _ID_TO_INDEX

    if EMBEDDINGS_PATH.exists() and MANIFEST_PATH.exists():
        _EMBEDDINGS = np.load(EMBEDDINGS_PATH)
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        _ID_TO_INDEX = {psi_id: idx for idx, psi_id in enumerate(manifest.get("row_order", []))}
    return _EMBEDDINGS, _ID_TO_INDEX


def fts_search(query: str, limit: int = 10) -> list[tuple[str, float]]:
    """Query the FTS5 virtual table using BM25 ranking."""
    if not DB_PATH.exists() or not query.strip():
        return []

    # Clean query for fts5 match: alphanumeric or quoted
    terms = [term for term in query.strip().split() if term.isalnum()]
    if not terms:
        return []
    match_expr = " OR ".join(terms)

    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute(
            """
            SELECT psi_id, rank
            FROM investigations_fts
            WHERE investigations_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (match_expr, limit),
        )
        return [(row[0], float(row[1])) for row in cursor.fetchall()]
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()


def investigation_similarity(psi_id_a: str, psi_id_b: str) -> float | None:
    """Compute cosine similarity between two investigations using committed embeddings."""
    embeddings, id_to_index = _ensure_embeddings()
    if embeddings is None:
        return None
    idx_a = id_to_index.get(psi_id_a)
    idx_b = id_to_index.get(psi_id_b)
    if idx_a is None or idx_b is None:
        return None

    vec_a = embeddings[idx_a]
    vec_b = embeddings[idx_b]
    # Vectors are already L2 normalized
    sim = float(np.dot(vec_a, vec_b))
    return max(0.0, min(1.0, sim))


def reciprocal_rank_fusion(
    ranked_lists: list[list[str]], k: int = 60
) -> list[tuple[str, float]]:
    """Combine multiple ranked lists of IDs using standard RRF."""
    scores: dict[str, float] = {}
    for r_list in ranked_lists:
        for rank, item_id in enumerate(r_list):
            scores[item_id] = scores.get(item_id, 0.0) + 1.0 / (k + (rank + 1))

    ordered = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return ordered


def filter_records(
    records: list[InvestigationRecord],
    safety_theme: SafetyTheme | None = None,
    evidence_class: EvidenceClass | None = None,
    fuel_phase: FuelPhase | None = None,
    project_type: ProjectType | None = None,
    catalog_role: str | None = None,
    only_rank_eligible: bool = False,
) -> list[InvestigationRecord]:
    """Apply deterministic structured filters."""
    result: list[InvestigationRecord] = []
    for r in records:
        if only_rank_eligible and not r.rank_eligible:
            continue
        if catalog_role is not None and r.catalog_role != catalog_role:
            continue
        if safety_theme is not None and r.safety_theme != safety_theme and safety_theme not in r.secondary_safety_themes:
            continue
        if evidence_class is not None and r.evidence_class != evidence_class:
            continue
        if fuel_phase is not None and fuel_phase not in r.fuel_phases:
            continue
        if project_type is not None and r.project_type != project_type:
            continue
        result.append(r)
    return result


def retrieve_candidates(
    scenario: Scenario,
    free_text: str | None = None,
    limit: int = 10,
) -> list[InvestigationRecord]:
    """Retrieve up to `limit` candidates for physical scoring.

    Spec §6.1: forwards at most 10 candidates; scores only rank_eligible evidence records.
    """
    eligible = filter_records(
        list(RECORDS.values()), only_rank_eligible=True
    )
    eligible = [record for record in eligible if record.evidence_class != "modeling"]

    if free_text:
        fts_hits = fts_search(free_text, limit=limit)
        fts_ids = [hit[0] for hit in fts_hits]
        eligible_set = {r.psi_id: r for r in eligible}
        matched = [eligible_set[psi_id] for psi_id in fts_ids if psi_id in eligible_set]
        if len(matched) >= limit:
            return matched[:limit]
        # Supplement with remaining eligible
        remaining = [r for r in eligible if r.psi_id not in fts_ids]
        return (matched + remaining)[:limit]

    return eligible[:limit]


def compare_similarities(psi_ids: list[str]) -> dict[str, float]:
    """Return pairwise cosine similarity for a two-to-four-record comparison."""
    return {
        f"{left}|{right}": similarity
        for left_index, left in enumerate(psi_ids)
        for right in psi_ids[left_index + 1 :]
        if (similarity := investigation_similarity(left, right)) is not None
    }
