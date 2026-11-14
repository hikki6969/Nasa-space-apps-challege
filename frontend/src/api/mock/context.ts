import type { ContextCard, ContextResponse } from '../types'

const incidents: ContextCard[] = [
  {
    id: 'incident-apollo-1',
    kind: 'incident',
    title: 'Apollo 1',
    summary:
      'A crew fire during a ground test. FireSight uses Apollo 1 as an explanatory precedent for high-oxygen fire-risk awareness, never as a scoring input.',
    source_url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1',
    source_label: 'NASA SMA — Apollo 1',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'incident-mir',
    kind: 'incident',
    title: 'Mir fire',
    summary:
      'A fire aboard the Mir space station. The incident is historical context for spacecraft fire response, not a measured PSI investigation.',
    source_url: 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/',
    source_label: 'NASA History — Mir fire',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'incident-apollo-13',
    kind: 'incident',
    title: 'Apollo 13',
    summary:
      'An oxygen-system failure in flight. It is included as mission-safety context and is not treated as combustion evidence.',
    source_url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-13',
    source_label: 'NASA SMA — Apollo 13',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
]

const spinoff: ContextCard[] = [
  {
    id: 'spinoff-incipient-fire',
    kind: 'spinoff',
    title: 'Incipient fire detector',
    summary:
      'A terrestrial detector that discriminates combustion particles from dust. The link to spacecraft fire-safety work is thematic.',
    source_url: 'https://spinoff.nasa.gov/node/9407',
    source_label: 'NASA Spinoff — incipient fire detector',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'spinoff-oxygen-regulators',
    kind: 'spinoff',
    title: 'Oxygen-safety gas regulators',
    summary:
      'Oxygen-safety equipment with a thematic connection to high-oxygen material handling. No direct PSI lineage is claimed.',
    source_url: 'https://spinoff.nasa.gov/Spinoff2019/ps_2.html',
    source_label: 'NASA Spinoff 2019 — oxygen safety',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'spinoff-public-safety',
    kind: 'spinoff',
    title: 'Public-safety equipment',
    summary:
      'Public-safety equipment related thematically to spacecraft fire work. It is not a measured observation or ranking input.',
    source_url: 'https://spinoff.nasa.gov/Spinoff2020/pdf/Spinoff2020.pdf',
    source_label: 'NASA Spinoff 2020 — public safety',
    status: null,
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
]

const programContext: ContextCard[] = [
  {
    id: 'program-fm2',
    kind: 'program',
    title: 'FM2 — Flammability of Materials on the Moon',
    summary:
      'Anticipated lunar flammability research. FM2 is not a record in the 24-record PSI catalog and can never appear as a measured observation.',
    source_url:
      'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/',
    source_label: 'NASA — FM2',
    status: 'anticipated_in_psi',
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'program-sofie',
    kind: 'program',
    title: 'SoFIE — Solid Fuel Ignition and Extinction',
    summary:
      'Active program context. No current PSI record is present in the 24-record catalog, so SoFIE is outside numerical ranking.',
    source_url:
      'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/',
    source_label: 'NASA — SoFIE',
    status: 'active_program',
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
  {
    id: 'program-flare',
    kind: 'program',
    title: 'FLARE — Flammability Limits at Reduced Gravity Experiment',
    summary:
      'Active program context. FLARE has no current PSI record in the catalog and is never plotted as a measured observation.',
    source_url:
      'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-limits-at-reduced-g-experiment-flare/',
    source_label: 'NASA — FLARE',
    status: 'active_program',
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
]

const instrumentContext: ContextCard[] = [
  {
    id: 'instrument-daft',
    kind: 'instrument',
    title: 'DAFT / DAFT-2 (PSI-47)',
    summary:
      'Dust and aerosol measurement instrument context. PSI-47 is retained in the exact 24-record catalog but is excluded from physical ranking and measured plots.',
    source_url: 'https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-47',
    source_label: 'NASA PSI — PSI-47',
    status: 'instrument_context',
    link_kind: 'thematic',
    evidence_scope: 'context_only',
  },
]

export const MOCK_CONTEXT: ContextResponse = {
  incidents,
  spinoff,
  program_context: programContext,
  instrument_context: instrumentContext,
  mock_notice:
    'H0 representative context fixture. Historical and program cards are never ranking inputs.',
}
