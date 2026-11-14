from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_route():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["use_llm"] is False


def test_catalog_route():
    response = client.get("/api/catalog")
    assert response.status_code == 200
    assert response.json()["counts"]["total"] == 24


def test_investigation_route_and_missing_record():
    assert client.get("/api/investigations/PSI-25").status_code == 200
    assert client.get("/api/investigations/PSI-999").status_code == 404


def test_scenarios_route():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    assert [fixture["id"] for fixture in response.json()["scenarios"]] == [
        "A",
        "B",
        "C",
        "D",
    ]


def test_rank_route_by_scenario_id():
    response = client.post(
        "/api/rank",
        json={
            "scenario": {"oxygen_fraction": 0.30, "safety_theme": "prevention"},
            "scenario_id": "A",
        },
    )
    assert response.status_code == 200
    assert response.json()["scenario_id"] == "A"


def test_rank_route_rejects_unknown_scenario():
    response = client.post("/api/rank", json={"scenario": {}, "scenario_id": "Z"})
    assert response.status_code == 404


def test_compare_route():
    response = client.post("/api/compare", json={"psi_ids": ["PSI-25", "PSI-10"]})
    assert response.status_code == 200
    payload = response.json()
    assert payload["psi_ids"] == ["PSI-25", "PSI-10"]

    # D-001 regression: fuel_phases must be clean display strings, never Python repr like "['solid']"
    fuel_phase_row = next((r for r in payload["rows"] if r["name"] == "fuel_phases"), None)
    assert fuel_phase_row is not None
    assert fuel_phase_row["values"]["PSI-25"] == "solid"
    assert fuel_phase_row["values"]["PSI-10"] == "gas"
    for val in fuel_phase_row["values"].values():
        assert val is not None
        assert "'" not in val
        assert "[" not in val


def test_compare_route_requires_two_to_four_ids():
    assert client.post("/api/compare", json={"psi_ids": ["PSI-69"]}).status_code == 422


def test_observations_route_excludes_context_records():
    response = client.get("/api/observations")
    assert response.status_code == 200
    payload = response.json()
    assert "PSI-47" in payload["excluded_psi_ids"]
    assert "PSI-117" in payload["excluded_psi_ids"]
    assert all(point["psi_id"] not in {"PSI-47", "PSI-117"} for point in payload["points"])
    # D-002: BASS-II points carry fuel_phase="solid"
    for point in payload["points"]:
        if point["psi_id"] == "PSI-25":
            assert point["fuel_phase"] == "solid"


def test_context_route_has_no_luci_card():
    response = client.get("/api/context")
    assert response.status_code == 200
    payload = response.json()
    assert "LUCI" not in str(payload)
    assert {program["program_id"] for program in payload["programs"]} == {
        "FM2",
        "SoFIE",
        "FLARE",
    }


def test_ask_route_refuses_rocket_scope():
    response = client.post("/api/ask", json={"question": "rocket propellant?"})
    assert response.status_code == 200
    assert response.json()["refused"] is True


def test_ask_route_rejects_empty_question():
    assert client.post("/api/ask", json={"question": ""}).status_code == 422
