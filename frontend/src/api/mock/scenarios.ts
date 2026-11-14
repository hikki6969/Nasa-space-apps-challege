import type { Scenario } from '../types'

/** The four canonical scenarios from docs/00_PRODUCT_SPEC.md §7. */
export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: 'A',
    name: 'Lunar habitat',
    short_name: 'Scenario A',
    summary:
      'A solid-fuel, 30% O₂, 8.2 psia, 0.16 g lunar-habitat scenario. Flow is intentionally unspecified.',
    inputs: {
      oxygen_fraction: 0.3,
      pressure_psia: 8.2,
      gravity_g: 0.16,
      flow_velocity_cms: null,
      fuel_phase: 'solid',
      safety_theme: 'prevention',
    },
    expected_invariants: [
      'No completed PSI record directly covers the full combination.',
      'The unspecified flow value is an explicit gap, not a silent default.',
      'FM2 is anticipated program context, never a measured result.',
    ],
  },
  {
    id: 'B',
    name: 'Cabin detection',
    short_name: 'Scenario B',
    summary:
      'Cabin smoke/fire detection theme. Numeric physical inputs are intentionally not specified.',
    inputs: {
      oxygen_fraction: null,
      pressure_psia: null,
      gravity_g: null,
      flow_velocity_cms: null,
      fuel_phase: null,
      safety_theme: 'detection',
    },
    expected_invariants: [
      'SAME-R appears as completed detection-instrumentation evidence.',
      'DAFT remains instrument context and is never a ranked candidate.',
      'Detector evidence is not presented as flame-spread evidence.',
    ],
  },
  {
    id: 'C',
    name: 'Droplet suppression',
    short_name: 'Scenario C',
    summary:
      'Liquid-droplet suppression theme. Numeric physical inputs are intentionally not specified.',
    inputs: {
      oxygen_fraction: null,
      pressure_psia: null,
      gravity_g: null,
      flow_velocity_cms: null,
      fuel_phase: 'liquid_droplet',
      safety_theme: 'suppression',
    },
    expected_invariants: [
      'FLEX and FLEX-2 appear as completed evidence.',
      'PSI-117, if shown, is labeled modeling-only with no measured table.',
    ],
  },
  {
    id: 'D',
    name: 'Apollo 1 reconstruction',
    short_name: 'Scenario D',
    summary:
      'Prevention theme for an explanatory Apollo 1 reconstruction. Apollo 1 is context, never a scoring input.',
    inputs: {
      oxygen_fraction: null,
      pressure_psia: null,
      gravity_g: null,
      flow_velocity_cms: null,
      fuel_phase: null,
      safety_theme: 'prevention',
    },
    expected_invariants: [
      'No completed PSI record claims to reconstruct Apollo 1.',
      'High-O₂ gaseous context and solid-fuel context remain separated.',
      'Apollo 1 appears only in the context panel.',
    ],
  },
]
