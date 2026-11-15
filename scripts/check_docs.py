#!/usr/bin/env python3
"""Validate the FireSight software documentation contract."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

REQUIRED = [
    DOCS / "00_PRODUCT_SPEC.md",
    DOCS / "01_DECISION_LOG.md",
    DOCS / "02_PROBLEM_LOG.md",
    DOCS / "03_CHANGELOG.md",
    DOCS / "04_TECH_STACK.md",
    DOCS / "05_DATA_SAFETY.md",
    DOCS / "06_VERIFICATION_PLAN.md",
    DOCS / "VERIFIED_FACTS.md",
    DOCS / "adr" / "0001-use-versioned-json-as-canonical-data.md",
    DOCS / "adr" / "0002-use-sqlite-fts5-as-derived-index.md",
    DOCS / "adr" / "0003-use-deterministic-ranking-with-coverage-penalty.md",
    DOCS / "adr" / "0004-keep-generative-llm-optional-and-off-by-default.md",
    DOCS / "adr" / "0005-reject-fitted-flammability-model.md",
]

HARDWARE_ONLY_FILES = {
    "00_ARCHITECTURE.md",
    "07_PHYSICAL_DESIGN.md",
    "08_PORTFOLIO_BIO.md",
}

EXPECTED_CORPUS = {
    "PSI-10", "PSI-20", "PSI-21", "PSI-22", "PSI-23", "PSI-25", "PSI-26",
    "PSI-39", "PSI-47", "PSI-60", "PSI-62", "PSI-68", "PSI-69", "PSI-98",
    "PSI-99", "PSI-100", "PSI-101", "PSI-102", "PSI-106", "PSI-107",
    "PSI-115", "PSI-117", "PSI-142", "PSI-159",
}
EXPECTED_CURATED = {
    "PSI-159", "PSI-10", "PSI-101", "PSI-98", "PSI-25", "PSI-69", "PSI-68",
}

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


for path in REQUIRED:
    require(path.is_file(), f"missing required document: {path.relative_to(ROOT)}")

for name in HARDWARE_ONLY_FILES:
    require(not (DOCS / name).exists(), f"hardware-only document must not exist: docs/{name}")

if all(path.is_file() for path in REQUIRED):
    facts = (DOCS / "VERIFIED_FACTS.md").read_text(encoding="utf-8")
    for token in [
        "2026-11-14T05:05:31Z",
        "Research%20Area&fvalue=Combustion%20Science",
        "hits.total = 24",
        "PSI-181",
        "PSI-108",
        "PSI-47",
        "PSI-101",
        "PSI-98",
        "PSI-69",
        "PSI-68",
        "PSI-117",
        "13.6%",
        "22.2%",
        "0.85",
        "0.849977932",
        "data/snapshot.sha256",
    ]:
        require(token in facts, f"VERIFIED_FACTS.md is missing required fact token: {token!r}")
    require(
        re.search(r"\*\*Snapshot SHA-256:\*\* `[0-9a-f]{64}`", facts) is not None,
        "VERIFIED_FACTS.md is missing a 64-hex snapshot digest",
    )

    corpus_block = re.search(r"```text\n(.*?)\n```", facts, re.DOTALL)
    require(corpus_block is not None, "VERIFIED_FACTS.md is missing the exact corpus block")
    if corpus_block:
        corpus_ids = re.findall(r"PSI-\d+", corpus_block.group(1))
        require(len(corpus_ids) == 24, "verified corpus block must contain exactly 24 IDs")
        require(len(set(corpus_ids)) == len(corpus_ids), "verified corpus block contains duplicate IDs")
        require(set(corpus_ids) == EXPECTED_CORPUS, "verified corpus ID set differs from the frozen 24-record set")
        require("PSI-181" not in corpus_ids and "PSI-108" not in corpus_ids, "false-positive PSI IDs entered the corpus block")

    spec = (DOCS / "00_PRODUCT_SPEC.md").read_text(encoding="utf-8")
    for token in [
        "class Range(StrictModel)",
        "ConfigDict(strict=True, extra=\"forbid\")",
        "class ProgramContext(StrictModel)",
        "class Scenario(StrictModel)",
        "Q(S)",
        "unit: RangeUnit",
        "coverage",
        "0.30",
        "0.20",
        "0.10",
        "direct_match",
        "contextual_only",
        "USE_LLM=false",
        "Observed test domain; not a validated flammability boundary.",
        "PSI-159",
        "PSI-10",
        "PSI-101",
        "PSI-98",
        "PSI-25",
        "PSI-69",
        "PSI-68",
    ]:
        require(token in spec, f"00_PRODUCT_SPEC.md is missing required contract token: {token!r}")

    curated_match = re.search(r"### 3\.2 Curated records\n(.*?)\n### 3\.3", spec, re.DOTALL)
    require(curated_match is not None, "product spec is missing the curated-record section")
    if curated_match:
        curated_ids = set(re.findall(r"(?m)^\| (PSI-\d+) \|", curated_match.group(1)))
        require(curated_ids == EXPECTED_CURATED, "curated-record ID set differs from the frozen seven-record set")

    program_context_block = spec.split("class ProgramContext(StrictModel):", 1)[1].split("class Scenario(StrictModel):", 1)[0]
    require("experimental_tables" not in program_context_block, "ProgramContext must not expose measured tables")
    require("instrument_context" in spec and "PSI-47" in spec, "product spec must exclude PSI-47 from physical ranking and plots")
    require("expected_units" in spec, "product spec must enforce field-specific units")

    decisions = (DOCS / "01_DECISION_LOG.md").read_text(encoding="utf-8")
    for number in range(1, 16):
        decision_id = f"D-{number:03d}"
        require(decision_id in decisions, f"decision log is missing {decision_id}")

    problems = (DOCS / "02_PROBLEM_LOG.md").read_text(encoding="utf-8")
    problem_count = problems.count("\n## P-")
    for shape in ["**Symptom:**", "**Reproduction:**", "**Root cause:**", "**Resolution:**", "**Verification:**", "**Lesson:**"]:
        require(problems.count(shape) == problem_count, f"problem-log entry shape count mismatch for {shape}")

    verification = (DOCS / "06_VERIFICATION_PLAN.md").read_text(encoding="utf-8")
    for test_id in ["T-001", "T-003", "T-004", "T-007", "T-008", "T-024", "T-029", "T-030", "T-031", "T-045"]:
        require(test_id in verification, f"verification plan is missing {test_id}")
    require("Scenario D must not claim" not in verification, "verification plan must express the Scenario D invariant positively")

    adrs = sorted((DOCS / "adr").glob("*.md"))
    require(len(adrs) == 5, f"expected 5 ADRs, found {len(adrs)}")
    for adr in adrs:
        text = adr.read_text(encoding="utf-8")
        require("- **Status:** Accepted" in text, f"ADR is not accepted: {adr.name}")
        for heading in ["## Context", "## Options considered", "## Decision", "## Consequences"]:
            require(heading in text, f"ADR {adr.name} is missing {heading}")

# Validate local Markdown links; external URLs and pure anchors are out of scope.
link_pattern = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
for markdown in DOCS.rglob("*.md"):
    text = markdown.read_text(encoding="utf-8")
    for raw_target in link_pattern.findall(text):
        target = raw_target.strip().strip("<>")
        if target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        path_part = target.split("#", 1)[0]
        if not path_part:
            continue
        resolved = (ROOT / path_part) if path_part.startswith("/") else (markdown.parent / path_part)
        require(
            resolved.exists(),
            f"broken local link in {markdown.relative_to(ROOT)}: {target}",
        )

if failures:
    print(f"Documentation check: {len(failures)} failure(s)")
    for failure in failures:
        print(f"FAIL: {failure}")
    sys.exit(1)

print(f"Documentation check: 0 failures ({len(REQUIRED)} required documents)")
