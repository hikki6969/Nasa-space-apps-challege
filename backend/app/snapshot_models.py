"""Internal shape of the canonical PSI snapshot.

The snapshot stores source metadata only. Curated physical fields and
provenance live in annotations.json; this keeps raw evidence separate from
human interpretation.
"""

from __future__ import annotations

from typing import Literal

from .models import CatalogRole, ProjectType, StrictModel


class LicenseInfo(StrictModel):
    name: str | None
    identifier: str | None
    link: str | None
    status: Literal["known", "unknown"]
    redistribution: Literal["allowed", "blocked"]
    note: str | None = None


class SnapshotTable(StrictModel):
    file_name: str
    version: int
    s3_version_id: str
    download_url: str
    file_size: int
    visible: bool
    restricted: bool
    verified_bytes: int
    sha256: str


class SnapshotRecord(StrictModel):
    psi_id: str
    title: str
    acronym: str | None = None
    research_area: str
    sub_research_area: str | None = None
    project_type: ProjectType
    catalog_role: CatalogRole
    objectives_text: str
    approach_text: str
    hypothesis_text: str | None = None
    doi: str | None = None
    license: LicenseInfo
    source_url: str
    detail_version: int | None = None
    tables: list[SnapshotTable]


class SnapshotSource(StrictModel):
    search_url: str
    detail_url_pattern: str
    table_download_url_pattern: str


class Snapshot(StrictModel):
    schema_version: Literal["1.0"]
    source: SnapshotSource
    records: list[SnapshotRecord]
