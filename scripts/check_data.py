#!/usr/bin/env python3
"""Validate the canonical snapshot, membership, licenses, and digest."""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.corpus import (  # noqa: E402
    CURATED_IDS,
    EXPECTED_IDS,
    INSTRUMENT_CONTEXT,
    LICENSE_RULINGS,
)
from backend.app.snapshot_models import Snapshot  # noqa: E402

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


def main() -> int:
    snapshot_path = ROOT / "data" / "psi_snapshot.json"
    manifest_path = ROOT / "data" / "snapshot.sha256"
    require(snapshot_path.is_file(), "data/psi_snapshot.json is missing")
    require(manifest_path.is_file(), "data/snapshot.sha256 is missing")
    if not snapshot_path.is_file() or not manifest_path.is_file():
        report()
        return 1

    text = snapshot_path.read_text(encoding="utf-8")
    snapshot = Snapshot.model_validate_json(text)
    require(snapshot.schema_version == "1.0", "unexpected snapshot schema version")

    manifest = manifest_path.read_text(encoding="utf-8").strip().split()
    require(len(manifest) == 2, "snapshot.sha256 must contain '<digest>  <path>'")
    if len(manifest) == 2:
        digest, path = manifest
        require(path == "data/psi_snapshot.json", "snapshot manifest path mismatch")
        actual = hashlib.sha256(text.encode("utf-8")).hexdigest()
        require(digest == actual, "snapshot digest does not match canonical JSON")

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

    if not failures:
        print(
            f"Data check: 0 failures ({len(ids)} records, {table_count} tables)"
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
