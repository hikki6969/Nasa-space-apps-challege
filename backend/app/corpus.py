"""Frozen corpus constants shared by builders, validators, and tests."""

EXPECTED_IDS = frozenset(
    {
        "PSI-10", "PSI-20", "PSI-21", "PSI-22", "PSI-23", "PSI-25", "PSI-26",
        "PSI-39", "PSI-47", "PSI-60", "PSI-62", "PSI-68", "PSI-69", "PSI-98",
        "PSI-99", "PSI-100", "PSI-101", "PSI-102", "PSI-106", "PSI-107",
        "PSI-115", "PSI-117", "PSI-142", "PSI-159",
    }
)
CURATED_IDS = frozenset(
    {"PSI-159", "PSI-10", "PSI-101", "PSI-98", "PSI-25", "PSI-69", "PSI-68"}
)
INSTRUMENT_CONTEXT = frozenset({"PSI-47"})
LICENSE_RULINGS = {
    "PSI-10": (
        "The PSI detail record exposes no license. Metadata and narrative may be "
        "cited, but table rows must not be redistributed."
    )
}
