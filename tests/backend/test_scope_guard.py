import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


@pytest.mark.parametrize(
    "query",
    [
        "rocket",
        "RP-1/LOX",
        "turbopump",
        "combustion chamber",
        "What is the turbopump pressure limit?",
        "Explain RP-1/LOX propellant ignition",
        "How does combustion chamber pressure affect rocket thrust?",
    ],
)
def test_scope_guard_refuses_out_of_scope_questions(query: str):
    response = client.post("/api/ask", json={"question": query})
    assert response.status_code == 200
    payload = response.json()
    assert payload["refused"] is True
    assert payload["scope"] == "rocket_propellant"
    assert "rocket" in payload["refusal_reason"] or "propellant" in payload["refusal_reason"]
