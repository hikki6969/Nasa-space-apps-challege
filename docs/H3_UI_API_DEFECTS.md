# H3 — UI/API defect reports (Person B → Person A, 2026-11-14)

Two findings from the full frontend alignment to the live H2 backend (`frontend/src/api/live.ts`). Both are reproducible with `Invoke-RestMethod`/`curl` against `uvicorn backend.app.main:app`. Nothing here blocks the frontend; the frontend ships a workaround where one exists.

## D-001 — `/api/compare` rows carry Python reprs, not JSON values

- **Request:** `POST /api/compare` with body `{"psi_ids":["PSI-25","PSI-10"]}`
- **Response (excerpt, verbatim):**
  ```json
  {
    "psi_ids": ["PSI-25", "PSI-10"],
    "records": [ { "psi_id": "PSI-25", "...": "full record…" }, { "psi_id": "PSI-10", "...": "" } ],
    "rows": [
      { "name": "acronym", "values": { "PSI-25": "BASS-II", "PSI-10": "ACME/Flame Design" } },
      { "name": "fuel_phases", "values": { "PSI-25": "['solid']", "PSI-10": "['gas']" } }
    ],
    "shared_fields": ["project_type", "safety_theme"],
    "differing_fields": ["acronym", "evidence_class", "fuel", "fuel_phases", "annotation_status"]
  }
  ```
- **Defect:** the `fuel_phases` (and list-typed) values in `rows[].values` are Python `repr()` strings — `['solid']` with single quotes — not JSON arrays. Any consumer parsing per JSON conventions (`JSON.parse("['solid']")`) fails. Either the values must be real arrays, or the field must be documented as `repr`-formatted and treated as display-only.
- **Expected:** `values` carries typed JSON (`["solid"]`), or a typed `records` projection documented as authoritative with `rows` explicitly display-only.
- **Where the frontend works around it:** the comparison UI does not consume `rows` at all; it derives the matrix, shared/different groupings, and unit-compatible parallel axes from the hydrated full `records` (same derivation path as the mock adapter, in `src/api/derived.ts`). No numeric claim is derived from the repr strings.
- **Suggested owner:** `backend/app/justifications.py` or the compare builder in `backend/app/main.py` — wherever `repr(list)` reaches the wire.

## D-002 — `/api/observations` reports oxygen bounds only; the B5 map cannot draw its axes

- **Request:** `GET /api/observations`
- **Response (verbatim):** `{"points":[{"psi_id":"PSI-25","file_name":"PSI-25_Experimental table_BASS-II.csv","row_index":0,"oxygen_fraction":0.136,"pressure_psia":null,"flow_velocity_cms":null,"gravity_g":null,"fuel_phase":null,"provenance":{…}},{…"oxygen_fraction":0.222…}],"excluded_psi_ids":["PSI-47","PSI-117"],"disclaimer":"Observed test domain; not a validated flammability boundary."}`
- **Ruling needed (not a defect):** Person B's B5 checklist requires outcome/phase encoding, but the canonical data as exposed here carries no per-row outcome or measured flow for these table rows. The honest options are (a) enrich the two BASS-II boundary points with `fuel_phase` and any measured `flow_velocity_cms` that carries provenance, or (b) document in the TODO/spec that the live observed map renders oxygen-bounds-only and the outcome/phase encoding applies only to richer fixtures. The frontend currently implements (b): a single-lane strip when any point lacks flow, and outcome-color legends only for outcomes actually present — see `ObservedMapPanel.tsx`.
- **Mismatch to record:** the H0 mock fixture (`frontend/src/api/mock/observations.ts`) carries 14 representative points with flow and outcome; the H2 live endpoint returns 2 oxygen bounds. Any future UI regression of "14 points" would violate honesty. The frontend never conflates them; keep that either way.

## H3 delivery status

| ID | Disposition | Status | Notes |
|---|---|---|---|
| D-001 | Fixed in `backend/app/main.py` | Resolved | List fields serialized as comma-separated display strings (`", ".join(str(item) for item in val)`), eliminating Python single-quoted reprs |
| D-002 | Addressed in `backend/app/observations.py` | Resolved | BASS-II observation points enriched with provenance-backed `fuel_phase="solid"` |
