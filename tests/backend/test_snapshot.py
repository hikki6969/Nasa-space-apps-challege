import hashlib
import json
from pathlib import Path

import pytest

from backend.app.corpus import CURATED_IDS, EXPECTED_IDS
from backend.app.snapshot_models import Snapshot
from scripts.build_snapshot import serialize

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT_PATH = ROOT / "data" / "psi_snapshot.json"
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"
MANIFEST_PATH = ROOT / "data" / "snapshot.sha256"


def manifest_entries() -> dict[str, str]:
    entries: dict[str, str] = {}
    for line in MANIFEST_PATH.read_text(encoding="utf-8").splitlines():
        if line.strip():
            digest, path = line.split()
            entries[path] = digest
    return entries


@pytest.fixture(scope="module")
def snapshot() -> Snapshot:
    return Snapshot.model_validate_json(SNAPSHOT_PATH.read_text(encoding="utf-8"))


def test_snapshot_has_exact_vf01_membership(snapshot):
    ids = [record.psi_id for record in snapshot.records]
    assert len(ids) == 24
    assert len(set(ids)) == 24
    assert set(ids) == set(EXPECTED_IDS)
    assert "PSI-181" not in ids
    assert "PSI-108" not in ids
    assert set(CURATED_IDS) <= set(ids)


def test_snapshot_is_sorted_and_canonical(snapshot):
    ids = [record.psi_id for record in snapshot.records]
    assert ids == sorted(ids)
    text = SNAPSHOT_PATH.read_text(encoding="utf-8")
    assert serialize(snapshot.model_dump(mode="json")) == text


def test_snapshot_digest_matches_manifest(snapshot):
    entries = manifest_entries()
    text = SNAPSHOT_PATH.read_text(encoding="utf-8")
    assert entries["data/psi_snapshot.json"] == hashlib.sha256(
        text.encode("utf-8")
    ).hexdigest()


def test_annotations_digest_matches_manifest():
    entries = manifest_entries()
    assert entries["data/annotations.json"] == hashlib.sha256(
        ANNOTATIONS_PATH.read_bytes()
    ).hexdigest()


def test_daft_is_instrument_context(snapshot):
    record = next(item for item in snapshot.records if item.psi_id == "PSI-47")
    assert record.catalog_role == "instrument_context"


def test_psi_117_has_no_table(snapshot):
    record = next(item for item in snapshot.records if item.psi_id == "PSI-117")
    assert record.tables == []


def test_bass_ii_table_metadata_is_preserved(snapshot):
    record = next(item for item in snapshot.records if item.psi_id == "PSI-25")
    assert len(record.tables) == 1
    table = record.tables[0]
    assert table.file_name == "PSI-25_Experimental table_BASS-II.csv"
    assert table.version == 1
    assert table.s3_version_id == "..Z_cQ7ymWFmdISmAvT7c5Gcs7ZHo4N_"
    assert "redirect=false" in table.download_url
    assert table.verified_bytes == table.file_size == 16590


def test_no_signed_urls_are_stored(snapshot):
    tokens = ("AWSAccessKeyId", "Signature=", "x-amz-security-token", "Expires=")
    for record in snapshot.records:
        for table in record.tables:
            assert not any(token in table.download_url for token in tokens)


def test_license_ruling_for_psi_10(snapshot):
    record = next(item for item in snapshot.records if item.psi_id == "PSI-10")
    assert record.license.status == "unknown"
    assert record.license.redistribution == "blocked"
    assert record.license.note
    known = [item for item in snapshot.records if item.license.status == "known"]
    assert len(known) == 23
    assert all(item.license.identifier == "CC0-1.0" for item in known)


def test_all_visible_tables_were_verified(snapshot):
    tables = [table for record in snapshot.records for table in record.tables]
    assert len(tables) == 22
    for table in tables:
        assert table.visible is True
        assert table.restricted is False
        assert table.verified_bytes == table.file_size
        assert len(table.sha256) == 64


def test_snapshot_contains_only_combustion_science(snapshot):
    assert {record.research_area for record in snapshot.records} == {
        "Combustion Science"
    }


def test_snapshot_source_patterns_are_stable(snapshot):
    assert snapshot.source.search_url.startswith("https://psi.nasa.gov/")
    assert "{psi_id}" in snapshot.source.detail_url_pattern
    assert "{file_name}" in snapshot.source.table_download_url_pattern
    assert "{redirect}" in snapshot.source.table_download_url_pattern


def test_snapshot_json_has_no_build_timestamp(snapshot):
    payload = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    assert "generated_at" not in payload
    assert "fetched_at" not in payload
