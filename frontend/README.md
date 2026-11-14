# FireSight frontend

React + Vite + TypeScript + Tailwind CSS shell for the NASA PSI Fire Safety
Evidence Synthesizer. Plotly renders the parallel-coordinates comparison and
the observed flammability map; no second component library is used.

## Status

This is the **B0 frontend foundation**. It runs against the typed H0 mock
adapter, which serves representative fixture data shaped like the frozen
contract — not the canonical NASA PSI snapshot. The UI keeps an `H0 mock`
label visible on every data surface.

## Commands

```bash
npm install
npm run dev        # Vite dev server
npm run typecheck  # tsc -b
npm run lint       # oxlint src
npm test           # vitest run
npm run build      # tsc -b && vite build
npm run check      # typecheck + lint + test + build
```

## API modes

Copy `.env.example` to `.env` and adjust as needed.

- `VITE_API_MODE=mock` (default) — typed mock adapter; no backend required.
- `VITE_API_MODE=http` — calls the FastAPI contract at `VITE_API_BASE_URL`
  (`/api` by default). The dev server proxies `/api` to `VITE_PROXY_TARGET`.
- `VITE_MOCK_LATENCY_MS` controls artificial mock latency (default `160`).

The only UI-facing contract lives in `src/api/client.ts` and `src/api/types.ts`.
Feature panels never import mock fixtures directly.

## Layout

```text
src/api/            H0 types, HTTP client, mock adapter, provider
src/components/     charts, layout, shared UI, investigation primitives
src/features/       one lazy panel per tab
src/hooks/          useAsyncData request lifecycle
src/lib/            tab metadata, formatting, labels, chart theme, geometry
src/test/           Vitest setup
```

## Evidence constraints encoded in the UI

- Exactly the 24 VF-01 accessions; PSI-47 stays `instrument_context` and is
  never ranked.
- Scores are physical proximity only, never applicability or a probability.
- Unspecified scenario values remain explicit gaps and cannot create a direct
  match.
- BASS-II is never described as covering 30% O₂; its curated initial range is
  0.136–0.222.
- The observed map draws measured points and an optional descriptive hull only.
  Its disclaimer is exactly: **Observed test domain; not a validated
  flammability boundary.**
- FM2, SoFIE, FLARE, LUCI, PSI-117, and PSI-47 never appear as measured
  observations.
