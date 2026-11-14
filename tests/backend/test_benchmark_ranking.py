import time
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

SCENARIOS = [
    ("A", {"oxygen_fraction": 0.30, "pressure_psia": 8.2, "gravity_g": 0.16, "fuel_phase": "solid", "safety_theme": "prevention"}),
    ("B", {"safety_theme": "detection"}),
    ("C", {"fuel_phase": "liquid_droplet", "safety_theme": "suppression"}),
    ("D", {"safety_theme": "prevention"}),
]


def test_ranking_p95_under_500ms():
    """Benchmark: ranking p95 latency over the four canonical scenarios must be strictly < 500 ms."""
    latencies: list[float] = []

    # Warmup
    for scenario_id, payload in SCENARIOS:
        client.post("/api/rank", json={"scenario": payload, "scenario_id": scenario_id})

    # Benchmark runs
    for _ in range(25):
        for scenario_id, payload in SCENARIOS:
            start = time.perf_counter()
            resp = client.post("/api/rank", json={"scenario": payload, "scenario_id": scenario_id})
            elapsed_ms = (time.perf_counter() - start) * 1000
            assert resp.status_code == 200
            latencies.append(elapsed_ms)

    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.50)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]

    print(f"\n[A4 Benchmark] n={len(latencies)}, p50={p50:.2f}ms, p95={p95:.2f}ms, p99={p99:.2f}ms")
    assert p95 < 500.0, f"p95 latency {p95:.2f}ms exceeded 500ms threshold"
