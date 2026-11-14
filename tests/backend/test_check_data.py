import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
CHECK_DATA_SCRIPT = ROOT / "scripts" / "check_data.py"
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"


def run_check_data() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CHECK_DATA_SCRIPT)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )


def test_check_data_passes_on_current_canonical_data():
    proc = run_check_data()
    assert proc.returncode == 0
    assert "Data check: 0 failures" in proc.stdout
    assert "7 source_cited" in proc.stdout


def test_check_data_fails_when_source_cited_record_misses_provenance(tmp_path):
    """Step 6 requirement: source_cited record with missing provenance entry must fail."""
    raw = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    # Remove provenance for oxygen_fraction on the first curated record
    record = raw["records"][0]
    assert record["annotation_status"] == "source_cited"
    assert "oxygen_fraction" in record["provenance"]
    del record["provenance"]["oxygen_fraction"]

    test_annotations = tmp_path / "annotations.json"
    test_annotations.write_text(json.dumps(raw), encoding="utf-8")

    cmd = [
        sys.executable,
        "-c",
        f"""
import sys
from pathlib import Path
ROOT = Path({repr(str(ROOT))})
sys.path.insert(0, str(ROOT))
import scripts.check_data as cd
sys.exit(cd.main(annotations_path=Path({repr(str(test_annotations))}), check_manifest=False))
""",
    ]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    assert proc.returncode != 0
    assert "populated without provenance" in proc.stdout or "Missing provenance" in proc.stdout


def test_check_data_fails_if_human_review_key_present(tmp_path):
    raw = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))
    raw["_human_review"] = {"status": "approved", "reviewed_by": "Test"}
    test_annotations = tmp_path / "annotations.json"
    test_annotations.write_text(json.dumps(raw), encoding="utf-8")

    cmd = [
        sys.executable,
        "-c",
        f"""
import sys
from pathlib import Path
ROOT = Path({repr(str(ROOT))})
sys.path.insert(0, str(ROOT))
import scripts.check_data as cd
sys.exit(cd.main(annotations_path=Path({repr(str(test_annotations))}), check_manifest=False))
""",
    ]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    assert proc.returncode != 0
    assert "annotations must not carry a _human_review gate" in proc.stdout
