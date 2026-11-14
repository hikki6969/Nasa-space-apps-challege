"""Measured observation points endpoint generator.

Product Spec §9 / VF-03:
Only points from completed, ranked-eligible evidence records are included.
Anticipated program context (FM2), modeling (PSI-117), metadata-only, and
instrument context (PSI-47) are strictly excluded.
"""

from __future__ import annotations

from .api_models import ObservationPoint, ObservationsResponse
from .catalog import RECORDS

OBSERVED_DOMAIN_DISCLAIMER = "Observed test domain; not a validated flammability boundary."
EXCLUDED_IDS = ["PSI-47", "PSI-117"]


def get_observations_response() -> ObservationsResponse:
    points: list[ObservationPoint] = []

    # BASS-II (PSI-25) measured boundary points
    bass = RECORDS.get("PSI-25")
    if bass and bass.oxygen_fraction and "oxygen_fraction" in bass.provenance:
        prov = bass.provenance["oxygen_fraction"]
        file_name = "PSI-25_Experimental table_BASS-II.csv"
        points.append(
            ObservationPoint(
                psi_id="PSI-25",
                file_name=file_name,
                row_index=0,
                oxygen_fraction=bass.oxygen_fraction.min,
                provenance=prov,
            )
        )
        points.append(
            ObservationPoint(
                psi_id="PSI-25",
                file_name=file_name,
                row_index=1,
                oxygen_fraction=bass.oxygen_fraction.max,
                provenance=prov,
            )
        )

    return ObservationsResponse(
        points=points,
        excluded_psi_ids=EXCLUDED_IDS,
        disclaimer=OBSERVED_DOMAIN_DISCLAIMER,
    )
