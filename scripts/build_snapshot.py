#!/usr/bin/env python3
"""Build the deterministic 24-record canonical PSI snapshot."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.corpus import (  # noqa: E402
    EXPECTED_IDS,
    INSTRUMENT_CONTEXT,
    LICENSE_RULINGS,
)
from backend.app.snapshot_models import (  # noqa: E402
    LicenseInfo,
    Snapshot,
    SnapshotRecord,
    SnapshotSource,
    SnapshotTable,
)

SEARCH_URL = (
    "https://psi.nasa.gov/geode-py/ws/repo/search"
    "?ffield=Research%20Area&fvalue=Combustion%20Science"
)
DETAIL_URL = "https://psi.nasa.gov/geode-py/ws/repo/investigations/{psi_id}"
TABLE_URL = (
    "https://psi.nasa.gov/geode-py/ws/studies/{psi_id}/download"
    "?file={file_name}&version={version}&redirect={redirect}"
)

PROJECT_TYPES = {
    "Microgravity Investigation": "microgravity",
    "Ground Investigation": "ground",
}
USER_AGENT = "FireSight/0.1 (+https://psi.nasa.gov)"


class SnapshotError(RuntimeError):
    pass


def fetch_bytes(url: str) -> bytes:
    last_error: Exception | None = None
    for _ in range(3):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=60) as response:
                return response.read()
        except (URLError, TimeoutError, OSError) as exc:
            last_error = exc
    raise SnapshotError(f"Failed to download {url}: {last_error}")


def fetch_json(url: str) -> dict:
    body = fetch_bytes(url)
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise SnapshotError(f"Invalid JSON from {url}: {exc}") from exc
    if not isinstance(payload, dict):
        raise SnapshotError(f"Expected an object from {url}")
    return payload


def table_url(psi_id: str, file_name: str, version: int, redirect: bool) -> str:
    return TABLE_URL.format(
        psi_id=psi_id,
        file_name=quote(file_name, safe=""),
        version=version,
        redirect="true" if redirect else "false",
    )


def license_info(psi_id: str, detail: dict) -> LicenseInfo:
    name = detail.get("licenseName") or None
    if name:
        return LicenseInfo(
            name=name,
            identifier=detail.get("licenseIdentifier") or None,
            link=detail.get("licenseLink") or None,
            status="known",
            redistribution="allowed",
        )
    ruling = LICENSE_RULINGS.get(psi_id)
    if ruling is None:
        raise SnapshotError(
            f"{psi_id} has no license; add an explicit ruling before building"
        )
    return LicenseInfo(
        name=None,
        identifier=None,
        link=None,
        status="unknown",
        redistribution="blocked",
        note=ruling,
    )


def build_snapshot() -> dict:
    search = fetch_json(SEARCH_URL)
    hits = search.get("hits", {})
    if hits.get("total") != 24:
        raise SnapshotError(f"Expected 24 search hits, got {hits.get('total')!r}")
    ids = [hit["_source"]["Accession"] for hit in hits.get("hits", [])]
    if len(ids) != 24:
        raise SnapshotError(f"Expected 24 result documents, got {len(ids)}")
    if len(set(ids)) != len(ids):
        raise SnapshotError("Search response contains duplicate PSI IDs")
    if set(ids) != EXPECTED_IDS:
        raise SnapshotError("Search result IDs differ from the frozen VF-01 set")
    if {"PSI-181", "PSI-108"} & set(ids):
        raise SnapshotError("False-positive PSI IDs entered the exact filter")

    records: list[SnapshotRecord] = []
    for psi_id in sorted(ids):
        detail = fetch_json(DETAIL_URL.format(psi_id=psi_id))
        if detail.get("accession") != psi_id:
            raise SnapshotError(f"Detail accession mismatch for {psi_id}")
        if detail.get("researchArea") != "Combustion Science":
            raise SnapshotError(f"{psi_id} is not in Combustion Science")
        project_type = PROJECT_TYPES.get(detail.get("projectType"))
        if project_type is None:
            raise SnapshotError(
                f"Unknown project type for {psi_id}: {detail.get('projectType')!r}"
            )

        tables: list[SnapshotTable] = []
        for table in sorted(
            detail.get("experimentalTable") or [],
            key=lambda item: (item.get("file_name", ""), item.get("version", 0)),
        ):
            if not table.get("visible", False) or table.get("restricted", False):
                continue
            file_name = table["file_name"]
            version = table["version"]
            file_size = table["file_size"]
            body = fetch_bytes(table_url(psi_id, file_name, version, redirect=True))
            if len(body) != file_size:
                raise SnapshotError(
                    f"Partial download for {psi_id}/{file_name}: "
                    f"{len(body)} of {file_size} bytes"
                )
            tables.append(
                SnapshotTable(
                    file_name=file_name,
                    version=version,
                    s3_version_id=table["s3_version_id"],
                    download_url=table_url(psi_id, file_name, version, redirect=False),
                    file_size=file_size,
                    visible=True,
                    restricted=False,
                    verified_bytes=len(body),
                    sha256=hashlib.sha256(body).hexdigest(),
                )
            )

        records.append(
            SnapshotRecord(
                psi_id=psi_id,
                title=detail["title"],
                acronym=detail.get("investigationAcronym") or None,
                research_area=detail["researchArea"],
                sub_research_area=detail.get("subResearchArea") or None,
                project_type=project_type,
                catalog_role=(
                    "instrument_context" if psi_id in INSTRUMENT_CONTEXT else "evidence"
                ),
                objectives_text=detail.get("objective") or "",
                approach_text=detail.get("approach") or "",
                hypothesis_text=detail.get("hypothesis") or None,
                doi=detail.get("doi") or None,
                license=license_info(psi_id, detail),
                source_url=DETAIL_URL.format(psi_id=psi_id),
                detail_version=detail.get("version") or None,
                tables=tables,
            )
        )

    snapshot = Snapshot(
        schema_version="1.0",
        source=SnapshotSource(
            search_url=SEARCH_URL,
            detail_url_pattern=DETAIL_URL,
            table_download_url_pattern=TABLE_URL,
        ),
        records=records,
    )
    return snapshot.model_dump(mode="json")


def serialize(payload: dict) -> str:
    return json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def main() -> int:
    payload = build_snapshot()
    text = serialize(payload)
    data_dir = ROOT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    snapshot_path = data_dir / "psi_snapshot.json"
    snapshot_path.write_text(text, encoding="utf-8")
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    (data_dir / "snapshot.sha256").write_text(
        f"{digest}  data/psi_snapshot.json\n", encoding="utf-8"
    )
    print(
        f"Wrote {snapshot_path.relative_to(ROOT)} "
        f"({len(payload['records'])} records, sha256 {digest})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
