from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_observations_excludes_non_evidence_and_context_records():
    """T-003 / P-003: PSI-47 (DAFT instrument context), PSI-117 (modeling),

    FM2 (anticipated program context), and LUCI (unaccepted proposal) must be
    completely absent from measured observations points.
    """
    response = client.get("/api/observations")
    assert response.status_code == 200
    payload = response.json()

    points = payload["points"]
    point_psi_ids = {p["psi_id"] for p in points}

    # Points must not include PSI-47, PSI-117, FM2, or LUCI
    assert "PSI-47" not in point_psi_ids
    assert "PSI-117" not in point_psi_ids
    assert "FM2" not in point_psi_ids
    assert "LUCI" not in point_psi_ids

    # FM2 and LUCI must be completely absent from the entire observations payload
    payload_str = str(payload)
    assert "FM2" not in payload_str
    assert "LUCI" not in payload_str

    # PSI-47 and PSI-117 are explicitly recorded as excluded
    assert "PSI-47" in payload["excluded_psi_ids"]
    assert "PSI-117" in payload["excluded_psi_ids"]

    # Every point must have non-null measured values and provenance
    for point in points:
        assert point["psi_id"] not in {"PSI-47", "PSI-117"}
        assert point["provenance"] is not None
        assert point["provenance"]["source_url"]

    # Exact disclaimer must be present
    assert payload["disclaimer"] == "Observed test domain; not a validated flammability boundary."
