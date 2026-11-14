#!/usr/bin/env python3
"""Validate the canonical snapshot, annotations, membership, licenses, and digest."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import get_args

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.corpus import (  # noqa: E402
    CURATED_IDS,
    EXPECTED_IDS,
    INSTRUMENT_CONTEXT,
    LICENSE_RULINGS,
)
from backend.app.models import (  # noqa: E402
    PHYSICAL_FIELDS,
    RECORDED_VALUE_FIELDS,
    ExtractionMethod,
    InvestigationRecord,
)
from backend.app.snapshot_models import Snapshot  # noqa: E402

EXTRACTION_METHODS = get_args(ExtractionMethod)

SIGNED_URL_TOKENS = (
    "AWSAccessKeyId",
    "Signature=",
    "x-amz-security-token",
    "Expires=",
)

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def main(
    annotations_path: Path | None = None, check_manifest: bool = True
) -> int:
    global failures
    failures = []
    snapshot_path = ROOT / "data" / "psi_snapshot.json"
    if annotations_path is None:
        annotations_path = (
            Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "annotations.json"
        )
    manifest_path = ROOT / "data" / "snapshot.sha256"
    require(snapshot_path.is_file(), "data/psi_snapshot.json is missing")
    require(annotations_path.is_file(), "data/annotations.json is missing")
    if check_manifest:
        require(manifest_path.is_file(), "data/snapshot.sha256 is missing")
    if (
        not snapshot_path.is_file()
        or not annotations_path.is_file()
        or (check_manifest and not manifest_path.is_file())
    ):
        report()
        return 1

    text = snapshot_path.read_text(encoding="utf-8")
    snapshot = Snapshot.model_validate_json(text)
    require(snapshot.schema_version == "1.0", "unexpected snapshot schema version")

    if check_manifest:
        manifest_entries: dict[str, str] = {}
        for line in manifest_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            parts = line.split()
            require(len(parts) == 2, "snapshot.sha256 lines must be '<digest>  <path>'")
            if len(parts) == 2:
                manifest_entries[parts[1]] = parts[0]
        expected_manifest = {
            "data/psi_snapshot.json": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "data/annotations.json": hashlib.sha256(
                annotations_path.read_bytes()
            ).hexdigest(),
        }
        require(
            set(manifest_entries) == set(expected_manifest),
            "snapshot.sha256 must cover snapshot and annotations",
        )
        for path, digest in expected_manifest.items():
            require(
                manifest_entries.get(path) == digest,
                f"{path} digest does not match canonical JSON",
            )

    ids = [record.psi_id for record in snapshot.records]
    require(len(ids) == 24, f"expected 24 records, found {len(ids)}")
    require(len(set(ids)) == len(ids), "duplicate PSI IDs in snapshot")
    require(set(ids) == EXPECTED_IDS, "snapshot ID set differs from VF-01")
    require(not ({"PSI-181", "PSI-108"} & set(ids)), "false-positive PSI IDs present")
    require(CURATED_IDS <= set(ids), "curated PSI IDs are missing")

    table_count = 0
    for record in snapshot.records:
        require(
            record.research_area == "Combustion Science",
            f"{record.psi_id} is outside Combustion Science",
        )
        if record.psi_id in INSTRUMENT_CONTEXT:
            require(
                record.catalog_role == "instrument_context",
                f"{record.psi_id} must be instrument_context",
            )
        else:
            require(
                record.catalog_role == "evidence",
                f"{record.psi_id} must be evidence",
            )
        if record.psi_id == "PSI-117":
            require(not record.tables, "PSI-117 must not have an experimental table")
        if record.license.status == "unknown":
            require(
                record.psi_id in LICENSE_RULINGS,
                f"{record.psi_id} has an unruled missing license",
            )
            require(
                record.license.redistribution == "blocked",
                f"{record.psi_id} unknown license must block redistribution",
            )
        else:
            require(
                record.license.redistribution == "allowed",
                f"{record.psi_id} known license must allow redistribution",
            )
        require(bool(record.objectives_text), f"{record.psi_id} has no objectives text")
        require(bool(record.source_url), f"{record.psi_id} has no source URL")
        for table in record.tables:
            table_count += 1
            require(
                table.download_url.startswith(
                    "https://psi.nasa.gov/geode-py/ws/studies/"
                ),
                f"{record.psi_id} table URL is not a stable PSI URL",
            )
            require(
                "redirect=false" in table.download_url,
                f"{record.psi_id} table URL is not the stable redirect=false form",
            )
            require(
                not any(token in table.download_url for token in SIGNED_URL_TOKENS),
                f"{record.psi_id} table URL contains a signed-URL token",
            )
            require(
                table.verified_bytes == table.file_size,
                f"{record.psi_id}/{table.file_name} download was partial",
            )
            require(
                len(table.sha256) == 64,
                f"{record.psi_id}/{table.file_name} has no SHA-256",
            )
            require(
                table.visible and not table.restricted,
                f"{record.psi_id}/{table.file_name} is not public",
            )

    blocked_ids = {
        record.psi_id
        for record in snapshot.records
        if record.license.redistribution == "blocked"
    }
    annotations = json.loads(annotations_path.read_text(encoding="utf-8"))
    require(
        annotations.get("_schema_version") == "1.0",
        "unexpected annotations schema version",
    )
    annotation_records = annotations.get("records", [])
    annotation_ids = [record.get("psi_id") for record in annotation_records]
    require(
        len(annotation_ids) == len(CURATED_IDS),
        f"expected {len(CURATED_IDS)} annotations, found {len(annotation_ids)}",
    )
    require(
        len(set(annotation_ids)) == len(annotation_ids),
        "duplicate PSI IDs in annotations",
    )
    require(
        set(annotation_ids) == CURATED_IDS,
        "annotation ID set differs from the frozen seven",
    )
    source_cited_ids: list[str] = []
    for raw in annotation_records:
        try:
            record = InvestigationRecord.model_validate(raw)
        except ValueError as error:
            require(False, f"{raw.get('psi_id')} annotation is invalid: {error}")
            continue
        if record.annotation_status == "source_cited":
            source_cited_ids.append(record.psi_id)
            require(
                record.extraction_method in EXTRACTION_METHODS,
                f"{record.psi_id} has an invalid extraction_method",
            )
        for field in PHYSICAL_FIELDS | set(RECORDED_VALUE_FIELDS):
            value = getattr(record, field, None)
            if value in (None, [], ""):
                continue
            entry = record.provenance.get(field)
            require(
                entry is not None,
                f"{record.psi_id}/{field} is populated without provenance",
            )
            if entry is None:
                continue
            require(
                bool(entry.source_url) and bool(entry.excerpt_or_table_ref),
                f"{record.psi_id}/{field} provenance lacks a source or reference",
            )
            require(
                entry.extraction_method in EXTRACTION_METHODS,
                f"{record.psi_id}/{field} provenance lacks extraction_method",
            )
        for table in record.experimental_tables:
            require(
                table.download_url.startswith(
                    "https://psi.nasa.gov/geode-py/ws/studies/"
                ),
                f"{record.psi_id} annotation table URL is not a stable PSI URL",
            )
            require(
                "redirect=false" in table.download_url,
                f"{record.psi_id} annotation table URL is not the stable redirect=false form",
            )
            require(
                not any(token in table.download_url for token in SIGNED_URL_TOKENS),
                f"{record.psi_id} annotation table URL contains a signed-URL token",
            )
            if record.psi_id in blocked_ids:
                require(
                    not table.rows,
                    f"{record.psi_id}/{table.file_name} has rows but redistribution is blocked",
                )
    require(
        "_human_review" not in annotations,
        "annotations must not carry a _human_review gate",
    )
    scenario_d = annotations.get("scenarios", {}).get("scenario_D", {})
    require(
        scenario_d.get("oxygen_fraction") is None,
        "Scenario D must not use Apollo 1 oxygen as a scoring input",
    )
    require(
        scenario_d.get("pressure_psia") is None,
        "Scenario D must not use Apollo 1 pressure as a scoring input",
    )

    if not failures:
        print(
            f"Data check: 0 failures ({len(ids)} records, {table_count} tables, "
            f"{len(annotation_ids)} annotations, "
            f"{len(source_cited_ids)} source_cited)"
        )
    return report()


def report() -> int:
    if failures:
        print(f"Data check: {len(failures)} failure(s)")
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
