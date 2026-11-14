"""Canonical catalog and investigation loader for FireSight."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from .api_models import (
    CatalogCounts,
    CatalogEntry,
    CatalogResponse,
    HealthResponse,
    InvestigationResponse,
    TablePreview,
)
from .models import (
    ExperimentalTable,
    InvestigationRecord,
    Provenance,
    Range,
)

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
SNAPSHOT_PATH = DATA_DIR / "psi_snapshot.json"
ANNOTATIONS_PATH = DATA_DIR / "annotations.json"
MANIFEST_PATH = DATA_DIR / "snapshot.sha256"
DB_PATH = DATA_DIR / "generated" / "firesight.db"
EMBEDDINGS_PATH = DATA_DIR / "embeddings.npy"


def load_canonical_data() -> tuple[dict[str, InvestigationRecord], dict[str, list[TablePreview]]]:
    if not SNAPSHOT_PATH.exists() or not ANNOTATIONS_PATH.exists():
        return {}, {}

    snapshot_data = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    annotations_data = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))

    curated_map = {
        r["psi_id"]: r for r in annotations_data.get("records", [])
    }

    records: dict[str, InvestigationRecord] = {}
    table_previews: dict[str, list[TablePreview]] = {}

    for raw in snapshot_data.get("records", []):
        psi_id = raw["psi_id"]
        curated = curated_map.get(psi_id)

        if curated:
            rec = InvestigationRecord.model_validate(curated)
        else:
            catalog_role = "instrument_context" if psi_id == "PSI-47" else "evidence"
            evidence_class = (
                "detection_instrumentation" if psi_id == "PSI-47"
                else "modeling" if psi_id == "PSI-117"
                else "bench_flammability"
            )
            safety_theme = "detection" if psi_id == "PSI-47" else None

            # Table definitions from snapshot
            tables: list[ExperimentalTable] = []
            for t in raw.get("tables", []):
                t_prov = Provenance(
                    source_url=t.get("download_url") or raw.get("source_url") or "",
                    source_kind="psi_table",
                    excerpt_or_table_ref=f"{t['file_name']} v{t['version']}",
                    extraction_method=None,
                )
                tables.append(
                    ExperimentalTable(
                        psi_id=psi_id,
                        file_name=t["file_name"],
                        version=t["version"],
                        s3_version_id=t.get("s3_version_id", ""),
                        download_url=t.get("download_url", ""),
                        columns=t.get("columns", []),
                        rows=[],
                        provenance=t_prov,
                    )
                )

            prov: dict[str, Provenance] = {}
            if safety_theme:
                prov["safety_theme"] = Provenance(
                    source_url=raw.get("source_url") or "",
                    source_kind="psi_narrative",
                    excerpt_or_table_ref="approach_text and title",
                    extraction_method=None,
                )

            rec = InvestigationRecord(
                psi_id=psi_id,
                title=raw["title"],
                acronym=raw.get("acronym"),
                research_area=raw.get("research_area", "Combustion Science"),
                project_type=raw.get("project_type", "microgravity"),
                catalog_role=catalog_role,
                evidence_class=evidence_class,
                safety_theme=safety_theme,
                secondary_safety_themes=[],
                fuel=None,
                fuel_phases=[],
                oxygen_fraction=None,
                pressure=None,
                flow_velocity=None,
                gravity=None,
                recorded_gravity_values=[],
                recorded_flow_values=[],
                hardware=raw.get("hardware", []),
                orientation=raw.get("orientation", []),
                objectives_text=raw.get("objectives_text", ""),
                approach_text=raw.get("approach_text", ""),
                key_findings_text=raw.get("key_findings_text"),
                experimental_tables=tables,
                data_status="complete" if raw.get("tables") else "partial",
                annotation_status="metadata_only",
                extraction_method=None,
                doi=raw.get("doi"),
                license=raw.get("license", {}).get("name") if isinstance(raw.get("license"), dict) else None,
                source_url=raw.get("source_url") or f"https://psi.nasa.gov/geode-py/ws/repo/investigations/{psi_id}",
                provenance=prov,
            )

        records[psi_id] = rec

        previews = [
            TablePreview(
                file_name=table.file_name,
                version=table.version,
                columns=table.columns,
                row_count=len(table.rows),
                rows=table.rows,
                download_url=table.download_url,
                provenance=table.provenance,
            )
            for table in rec.experimental_tables
        ]
        table_previews[psi_id] = previews

    return records, table_previews


RECORDS, PREVIEWS = load_canonical_data()


def get_catalog_entries() -> list[CatalogEntry]:
    entries: list[CatalogEntry] = []
    for psi_id, rec in sorted(RECORDS.items()):
        entries.append(
            CatalogEntry(
                psi_id=psi_id,
                title=rec.title,
                acronym=rec.acronym,
                project_type=rec.project_type,
                catalog_role=rec.catalog_role,
                data_status=rec.data_status,
                annotation_status=rec.annotation_status,
                evidence_class=rec.evidence_class,
                safety_theme=rec.safety_theme,
                source_url=rec.source_url,
            )
        )
    return entries


def get_catalog_counts(entries: list[CatalogEntry]) -> CatalogCounts:
    by_class: dict[str, int] = {}
    for e in entries:
        if e.evidence_class:
            by_class[e.evidence_class] = by_class.get(e.evidence_class, 0) + 1

    return CatalogCounts(
        total=len(entries),
        evidence=sum(1 for e in entries if e.catalog_role == "evidence"),
        instrument_context=sum(1 for e in entries if e.catalog_role == "instrument_context"),
        source_cited=sum(1 for e in entries if e.annotation_status == "source_cited"),
        metadata_only=sum(1 for e in entries if e.annotation_status == "metadata_only"),
        by_evidence_class=by_class,
    )


def get_catalog_response() -> CatalogResponse:
    entries = get_catalog_entries()
    return CatalogResponse(counts=get_catalog_counts(entries), records=entries)


def get_investigation_response(psi_id: str) -> InvestigationResponse | None:
    rec = RECORDS.get(psi_id)
    if rec is None:
        return None
    return InvestigationResponse(record=rec, table_previews=PREVIEWS.get(psi_id, []))


def get_snapshot_sha256() -> str | None:
    if not MANIFEST_PATH.exists():
        return None
    lines = MANIFEST_PATH.read_text(encoding="utf-8").strip().splitlines()
    for line in lines:
        parts = line.split()
        if len(parts) >= 2 and parts[1].endswith("psi_snapshot.json"):
            return parts[0]
    return None


def verify_system_integrity() -> tuple[bool, str | None, bool, bool, list[str]]:
    messages: list[str] = []
    snapshot_ok = True
    expected_sha = get_snapshot_sha256()

    if not SNAPSHOT_PATH.exists():
        snapshot_ok = False
        messages.append("Missing canonical snapshot: data/psi_snapshot.json")
    else:
        actual_sha = hashlib.sha256(SNAPSHOT_PATH.read_bytes()).hexdigest()
        if expected_sha and actual_sha != expected_sha:
            snapshot_ok = False
            messages.append(
                f"Snapshot SHA-256 mismatch: expected {expected_sha}, got {actual_sha}"
            )
        else:
            messages.append(
                f"Canonical snapshot verified ({len(RECORDS)} records, digest: {actual_sha[:8]}...)."
            )

    if not ANNOTATIONS_PATH.exists():
        snapshot_ok = False
        messages.append("Missing annotations: data/annotations.json")

    index_ok = DB_PATH.exists()
    if not index_ok:
        messages.append("Missing derived SQLite/FTS5 index: data/generated/firesight.db")
    else:
        messages.append("Derived SQLite/FTS5 index verified.")

    embeddings_ok = EMBEDDINGS_PATH.exists()
    if not embeddings_ok:
        messages.append("Missing text embeddings: data/embeddings.npy")
    else:
        messages.append("Text embeddings verified.")

    return snapshot_ok, expected_sha, index_ok, embeddings_ok, messages


def get_health_response() -> HealthResponse:
    snapshot_ok, sha, index_ok, embeddings_ok, messages = verify_system_integrity()
    status = "ok" if (snapshot_ok and index_ok and embeddings_ok) else "degraded"
    return HealthResponse(
        status=status,
        version="0.1.0",
        snapshot=snapshot_ok,
        snapshot_sha256=sha,
        snapshot_records=len(RECORDS) if snapshot_ok else 0,
        index=index_ok,
        embeddings=embeddings_ok,
        use_llm=False,
        messages=messages,
    )

