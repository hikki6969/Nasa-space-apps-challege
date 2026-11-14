#!/usr/bin/env python3
"""Build the deterministic SQLite and FTS5 search index from canonical JSON inputs."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_PATH = ROOT / "data" / "psi_snapshot.json"
ANNOTATIONS_PATH = ROOT / "data" / "annotations.json"
OUTPUT_DIR = ROOT / "data" / "generated"
DB_PATH = OUTPUT_DIR / "firesight.db"


def build_index(db_path: Path = DB_PATH) -> int:
    snapshot_data = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    annotations_data = json.loads(ANNOTATIONS_PATH.read_text(encoding="utf-8"))

    curated_map = {
        record["psi_id"]: record for record in annotations_data.get("records", [])
    }
    snapshot_records = snapshot_data.get("records", [])
    # Sort deterministically by psi_id
    snapshot_records.sort(key=lambda r: r["psi_id"])

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE investigations (
                    psi_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    acronym TEXT,
                    research_area TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    catalog_role TEXT NOT NULL,
                    evidence_class TEXT,
                    data_status TEXT,
                    annotation_status TEXT NOT NULL,
                    extraction_method TEXT,
                    fuel TEXT,
                    fuel_phases TEXT,
                    safety_theme TEXT,
                    secondary_safety_themes TEXT,
                    oxygen_fraction_min REAL,
                    oxygen_fraction_max REAL,
                    pressure_min REAL,
                    pressure_max REAL,
                    flow_velocity_min REAL,
                    flow_velocity_max REAL,
                    gravity_min REAL,
                    gravity_max REAL,
                    recorded_gravity_values TEXT,
                    recorded_flow_values TEXT,
                    objectives_text TEXT NOT NULL,
                    approach_text TEXT NOT NULL,
                    key_findings_text TEXT,
                    hardware TEXT,
                    orientation TEXT,
                    source_url TEXT NOT NULL
                )
                """
            )

            conn.execute(
                """
                CREATE VIRTUAL TABLE investigations_fts USING fts5(
                    psi_id UNINDEXED,
                    title,
                    objectives,
                    approach,
                    findings,
                    fuel,
                    hardware,
                    keywords,
                    tokenize = 'porter unicode61'
                )
                """
            )

            for rec in snapshot_records:
                psi_id = rec["psi_id"]
                curated = curated_map.get(psi_id)

                title = rec["title"]
                acronym = rec.get("acronym")
                research_area = rec.get("research_area", "Combustion Science")
                project_type = rec.get("project_type", "microgravity")
                objectives = rec.get("objectives_text", "")
                approach = rec.get("approach_text", "")
                findings = rec.get("key_findings_text") or ""
                hardware_list = rec.get("hardware", [])
                hardware_str = ", ".join(hardware_list)
                orientation_list = rec.get("orientation", [])
                orientation_str = ", ".join(orientation_list)
                source_url = rec.get("source_url") or f"https://psi.nasa.gov/geode-py/ws/repo/investigations/{psi_id}"

                if curated:
                    catalog_role = curated.get("catalog_role", "evidence")
                    evidence_class = curated.get("evidence_class")
                    data_status = curated.get("data_status", "complete")
                    annotation_status = curated.get("annotation_status", "source_cited")
                    extraction_method = curated.get("extraction_method", "script")
                    fuel = curated.get("fuel")
                    fuel_phases = json.dumps(curated.get("fuel_phases", []))
                    safety_theme = curated.get("safety_theme")
                    sec_themes = json.dumps(curated.get("secondary_safety_themes", []))

                    o2 = curated.get("oxygen_fraction")
                    o2_min = o2.get("min") if o2 else None
                    o2_max = o2.get("max") if o2 else None

                    pres = curated.get("pressure")
                    pres_min = pres.get("min") if pres else None
                    pres_max = pres.get("max") if pres else None

                    flow = curated.get("flow_velocity")
                    flow_min = flow.get("min") if flow else None
                    flow_max = flow.get("max") if flow else None

                    grav = curated.get("gravity")
                    grav_min = grav.get("min") if grav else None
                    grav_max = grav.get("max") if grav else None

                    rec_grav = json.dumps(curated.get("recorded_gravity_values", []))
                    rec_flow = json.dumps(curated.get("recorded_flow_values", []))
                else:
                    catalog_role = "instrument_context" if psi_id == "PSI-47" else "evidence"
                    evidence_class = (
                        "detection_instrumentation" if psi_id == "PSI-47"
                        else "modeling" if psi_id == "PSI-117"
                        else None
                    )
                    data_status = None
                    annotation_status = "metadata_only"
                    extraction_method = None
                    fuel = None
                    fuel_phases = "[]"
                    safety_theme = "detection" if psi_id == "PSI-47" else None
                    sec_themes = "[]"
                    o2_min = o2_max = None
                    pres_min = pres_max = None
                    flow_min = flow_max = None
                    grav_min = grav_max = None
                    rec_grav = "[]"
                    rec_flow = "[]"

                conn.execute(
                    """
                    INSERT INTO investigations VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    """,
                    (
                        psi_id,
                        title,
                        acronym,
                        research_area,
                        project_type,
                        catalog_role,
                        evidence_class,
                        data_status,
                        annotation_status,
                        extraction_method,
                        fuel,
                        fuel_phases,
                        safety_theme,
                        sec_themes,
                        o2_min,
                        o2_max,
                        pres_min,
                        pres_max,
                        flow_min,
                        flow_max,
                        grav_min,
                        grav_max,
                        rec_grav,
                        rec_flow,
                        objectives,
                        approach,
                        findings,
                        hardware_str,
                        orientation_str,
                        source_url,
                    ),
                )

                # Keywords for FTS: acronym, safety_theme, fuel_phases, orientation
                kw_parts = [acronym or "", safety_theme or "", orientation_str]
                if curated:
                    kw_parts.extend(curated.get("fuel_phases", []))
                    kw_parts.extend(curated.get("secondary_safety_themes", []))
                keywords = " ".join(p for p in kw_parts if p)

                conn.execute(
                    """
                    INSERT INTO investigations_fts (
                        psi_id, title, objectives, approach, findings, fuel, hardware, keywords
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        psi_id,
                        title,
                        objectives,
                        approach,
                        findings,
                        fuel or "",
                        hardware_str,
                        keywords,
                    ),
                )

        count = conn.execute("SELECT COUNT(*) FROM investigations").fetchone()[0]
        fts_count = conn.execute("SELECT COUNT(*) FROM investigations_fts").fetchone()[0]
        assert count == 24
        assert fts_count == 24
        print(f"Successfully built {db_path} with {count} records and FTS5 index.")
        return count
    finally:
        conn.close()


if __name__ == "__main__":
    build_index()
