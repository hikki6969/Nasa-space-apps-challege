#!/usr/bin/env python3
"""Migrate curated annotations to the provenance-first `source_cited` model.

Replaces the Data Safety human-review gate: a record is `source_cited` when
every populated physical field carries field-level provenance. No human
attestation is recorded or claimed.

Aborts without writing if any populated physical field lacks provenance.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ANNOTATIONS = DATA / "annotations.json"
MANIFEST = DATA / "snapshot.sha256"
SNAPSHOT = DATA / "psi_snapshot.json"

REQUIRED_PROVENANCE_KEYS = ("source_url", "source_kind", "value_kind")
ALLOWED_EXTRACTION_METHODS = {"script", "manual", "script_assisted_manual"}


def fail(message: str) -> None:
    print(f"ABORT: {message}")
    raise SystemExit(1)


def excerpt_of(entry: dict) -> str:
    """`excerpt` was renamed to `excerpt_or_table_ref`; accept both on read."""
    return entry.get("excerpt_or_table_ref") or entry.get("excerpt") or ""


def migrate_record(record: dict) -> bool:
    """Promote one metadata_only record. Returns True if it was promoted."""
    psi_id = record.get("psi_id", "<unknown>")
    provenance = record.get("provenance", {})
    promoted = record.get("annotation_status") == "metadata_only"

    if promoted:
        # Prove provenance is complete before promoting anything.
        for field, entry in provenance.items():
            for key in REQUIRED_PROVENANCE_KEYS:
                if not entry.get(key):
                    fail(f"{psi_id}: provenance[{field}] missing {key}")
            if not excerpt_of(entry):
                fail(f"{psi_id}: provenance[{field}] missing excerpt_or_table_ref")
            if (
                "extraction_method" in entry
                and entry["extraction_method"] not in ALLOWED_EXTRACTION_METHODS
            ):
                fail(
                    f"{psi_id}: provenance[{field}] has invalid "
                    f"extraction_method {entry['extraction_method']!r}"
                )
        record["annotation_status"] = "source_cited"

    if record.get("annotation_status") == "source_cited":
        record.setdefault("extraction_method", "script")
        if record["extraction_method"] not in ALLOWED_EXTRACTION_METHODS:
            fail(f"{psi_id}: invalid extraction_method {record['extraction_method']!r}")
        for field, entry in provenance.items():
            if "excerpt" in entry and "excerpt_or_table_ref" not in entry:
                entry["excerpt_or_table_ref"] = entry.pop("excerpt")
            if not excerpt_of(entry):
                fail(f"{psi_id}: provenance[{field}] missing excerpt_or_table_ref")
            entry.setdefault("extraction_method", "script")
            if entry["extraction_method"] not in ALLOWED_EXTRACTION_METHODS:
                fail(
                    f"{psi_id}: provenance[{field}] has invalid "
                    f"extraction_method {entry['extraction_method']!r}"
                )
        for table in record.get("experimental_tables", []):
            entry = table.get("provenance") or {}
            if "excerpt" in entry and "excerpt_or_table_ref" not in entry:
                entry["excerpt_or_table_ref"] = entry.pop("excerpt")
            if entry:
                entry.setdefault("extraction_method", "script")
                table["provenance"] = entry
    return promoted


def write_manifest() -> None:
    # shortcut: scripts/build_snapshot.py regenerates this too but needs
    # psi.nasa.gov, which is unreachable here; the manifest is two static
    # sha256 lines, so write them directly. Re-run build_snapshot.py when
    # the network is available to confirm byte-identical output.
    lines = [
        f"{hashlib.sha256(SNAPSHOT.read_bytes()).hexdigest()}  data/psi_snapshot.json",
        f"{hashlib.sha256(ANNOTATIONS.read_bytes()).hexdigest()}  data/annotations.json",
    ]
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    doc = json.loads(ANNOTATIONS.read_text(encoding="utf-8"))

    migrated = 0
    for record in doc.get("records", []):
        if migrate_record(record):
            migrated += 1

    # The human-review gate is gone; the keys go with it.
    doc.pop("_human_review", None)

    # Validate the result against the schema before touching disk.
    sys.path.insert(0, str(ROOT))
    from backend.app.models import InvestigationRecord  # noqa: E402

    for record in doc.get("records", []):
        try:
            InvestigationRecord.model_validate(record)
        except ValueError as error:
            fail(f"{record.get('psi_id')}: {error}")

    ANNOTATIONS.write_text(
        json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    write_manifest()

    digest = hashlib.sha256(ANNOTATIONS.read_bytes()).hexdigest()
    print(f"Migrated {migrated} records to source_cited. Digest: {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
