# Data Safety

This project handles scientific evidence, not production records. The primary safety goals are **evidence fidelity**, **reproducibility**, and **clear separation between measured data, derived analysis, and context**.

## 1. Data classification

| Class | Examples | Treatment |
|---|---|---|
| Canonical evidence | PSI metadata, public experimental tables, publications | Versioned, hashed, field-level provenance |
| Curated annotation | Normalized ranges, phases, themes, evidence classes | Source-cited; every numeric value linked to source evidence with provenance |
| Derived index | SQLite/FTS5 database, BM25 results | Regenerable; never authoritative |
| Derived semantic data | MiniLM embedding matrix | Regenerable from pinned model and canonical text; hash recorded |
| Context | Apollo 1, Mir, Apollo 13, Spinoff, FM2/SoFIE program pages | Separate from measured evidence and ranking inputs |
| Anticipated | FM2 and any verified future program without a PSI record | Separate file; never plotted as measured |
| Secrets | Credentials, signed S3 URLs, API keys | Must never enter the repository |

## 2. Evidence hierarchy

When sources conflict, use this order:

1. Direct PSI experimental table or PSI detail field for the specific record.
2. PSI narrative with a verbatim excerpt.
3. Linked official NASA publication or program page.
4. Field-level script annotation with an explicit safe derivation.
5. No value — store `null` and record the gap.

A lower-ranked source must not overwrite a higher-ranked source without an explicit correction entry in [Verified Facts](VERIFIED_FACTS.md).

## 3. Provenance requirements

Every curated numeric value must preserve:

- source URL;
- source kind;
- verbatim excerpt or table/row reference;
- annotation note;
- whether the value is reported or safely derived.

Required semantic qualifiers include:

- initial versus final oxygen;
- mole fraction versus percent by volume;
- pressure unit and reference state;
- gravity level versus bracket;
- measured experiment versus model output;
- nominal/forced flow versus measured flow.

Values with unclear semantics remain `null` until clarified.

## 4. Integrity controls

- `data/snapshot.sha256` covers the canonical JSON inputs.
- CI validates the digest before building the derived database.
- The snapshot builder rejects duplicate PSI IDs and an ID set different from VF-01.
- The builder preserves table filename, version, and S3 version ID.
- Stable PSI download URLs may be stored; expiring signed URLs must not.
- A failed or truncated download aborts snapshot generation; it never yields a partial canonical snapshot.
- The snapshot update is a deliberate versioned change, not an automatic startup mutation.

## 5. Status and misuse controls

- Program-context records (`active_program` or `anticipated_in_psi`) have no evidence class and no measured observations.
- `instrument_context` records, including PSI-47, have no physical rank and never enter the observation endpoint, measured map, or default scenario candidates.
- `metadata_only` records never enter physical ranking or measured observations; any populated physical field still requires provenance.
- Modeling records are never drawn on the measured flammability map.
- Missing values are not imputed.
- The observed-domain hull is labeled “Observed test domain; not a validated flammability boundary.”
- No probability, risk tier, validated boundary, or fitted flammability curve is derived from the corpus.

## 6. Licensing and attribution

- Preserve the PSI record's `license`, `licenseIdentifier`, `licenseLink`, DOI, and source URL.
- Preserve table version metadata and identify the owning PSI investigation.
- NASA historical and Spinoff cards retain title, publisher, and source URL.
- Do not imply that a thematic Spinoff relation is direct lineage from a specific PSI investigation.
- NASA names, marks, and logos are not used in a way that implies endorsement.

## 7. Secrets and network boundaries

- The repository contains no API keys, access tokens, cloud credentials, or private PSI data.
- The default build and demo require no hosted model credential.
- The optional local-model profile may mount a host-provided artifact but may not download it during startup.
- Refresh tooling may access the public PSI API; runtime demo does not require it.
- Network-disabled rehearsal is mandatory.

## 8. Destructive-change rule

Do not delete, overwrite, or rewrite a canonical snapshot or annotations file in place without:

1. preserving the previous version under an explicit archive path or Git history;
2. recording the reason in the changelog;
3. updating the SHA-256 and verified-facts ledger;
4. regenerating and validating the derived index.

No production database or cloud resource is in scope.

## 9. Annotation extraction and provenance

Numeric annotations are produced by deterministic scripts that read PSI
experimental tables and PSI narrative endpoints. Every numeric value must carry
field-level provenance before it enters the canonical snapshot:

- `source_url` — the PSI detail or table URL.
- `source_kind` — `psi_narrative` | `psi_table` | `publication` | `nasa_program`.
- `excerpt_or_table_ref` — verbatim excerpt, or table file name + row/column.
- `value_kind` — `reported` | `safely_derived`.
- `extraction_method` — `script` | `manual` | `script_assisted_manual`.

A value without provenance is `null`. Missing provenance blocks snapshot
inclusion; it is not a warning. `scripts/check_data.py` enforces this on every
run and fails the build if any populated physical field lacks provenance.

Provenance is auditable by any third party using only the source URL and the
excerpt/table reference. No attestation of reviewer identity is recorded,
because no human review is claimed. The audit surface is the source, not a
signature.

## 10. Incident response for a bad annotation

If a wrong value reaches the snapshot:

1. stop promotion of the affected build;
2. identify every API/UI/test surface that exposed it;
3. correct the canonical annotation with provenance;
4. regenerate the hash, SQLite index, and embeddings if text changed;
5. add or update a regression test;
6. record the defect in [Problem Log](02_PROBLEM_LOG.md);
7. update the change log and verified facts.

Do not conceal the defect by editing only the generated index.
