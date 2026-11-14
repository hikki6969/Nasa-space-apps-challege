import json
import sqlite3
import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data" / "generated" / "firesight.db"
EMBEDDINGS_PATH = ROOT / "data" / "embeddings.npy"
MANIFEST_PATH = ROOT / "data" / "embeddings_manifest.json"
SNAPSHOT_PATH = ROOT / "data" / "psi_snapshot.json"


def test_sqlite_investigations_table_structure_and_counts():
    assert DB_PATH.exists(), f"Missing SQLite index at {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM investigations").fetchone()[0]
        assert count == 24

        columns = [
            row[1] for row in conn.execute("PRAGMA table_info(investigations)").fetchall()
        ]
        assert "psi_id" in columns
        assert "title" in columns
        assert "annotation_status" in columns
        assert "catalog_role" in columns
        assert "oxygen_fraction_min" in columns
        assert "safety_theme" in columns
    finally:
        conn.close()


def test_fts5_virtual_table_search():
    conn = sqlite3.connect(DB_PATH)
    try:
        fts_count = conn.execute("SELECT COUNT(*) FROM investigations_fts").fetchone()[0]
        assert fts_count == 24

        # Search for droplet combustion
        results = conn.execute(
            """
            SELECT psi_id, rank
            FROM investigations_fts
            WHERE investigations_fts MATCH ?
            ORDER BY rank
            """,
            ("droplet",),
        ).fetchall()
        assert len(results) > 0
        result_ids = [r[0] for r in results]
        assert "PSI-69" in result_ids  # FLEX
        assert "PSI-68" in result_ids  # FLEX-2

        # Search for BASS or solid fuel
        bass_results = conn.execute(
            """
            SELECT psi_id, rank
            FROM investigations_fts
            WHERE investigations_fts MATCH ?
            ORDER BY rank
            """,
            ("BASS",),
        ).fetchall()
        assert len(bass_results) > 0
        bass_ids = [r[0] for r in bass_results]
        assert "PSI-25" in bass_ids
    finally:
        conn.close()


def test_embeddings_artifact_and_manifest():
    assert EMBEDDINGS_PATH.exists(), f"Missing {EMBEDDINGS_PATH}"
    assert MANIFEST_PATH.exists(), f"Missing {MANIFEST_PATH}"

    embeddings = np.load(EMBEDDINGS_PATH)
    assert embeddings.shape == (24, 384)
    assert embeddings.dtype == np.float32

    # L2-normalized rows
    norms = np.linalg.norm(embeddings, axis=1)
    np.testing.assert_allclose(norms, 1.0, rtol=1e-5)

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assert manifest["model_name"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert manifest["model_revision"] == "c224e78d5e4b10e9976450a52084712171457f30"
    assert manifest["license"] == "Apache-2.0"
    assert manifest["dimension"] == 384
    assert len(manifest["row_order"]) == 24

    snapshot = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    expected_ids = sorted([r["psi_id"] for r in snapshot["records"]])
    assert manifest["row_order"] == expected_ids


def test_runtime_does_not_import_torch_or_transformers():
    # Verify the runtime packages are NOT imported
    assert "torch" not in sys.modules
    assert "transformers" not in sys.modules
    assert "sentence_transformers" not in sys.modules
