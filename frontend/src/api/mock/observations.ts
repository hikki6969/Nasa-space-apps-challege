import {
  OBSERVED_DOMAIN_DISCLAIMER,
  type ObservationPoint,
  type ObservationsResponse,
  type Provenance,
} from '../types'

function provenanceFor(file_name: string): Provenance {
  return {
    source_url: `https://psi.nasa.gov/data/${file_name}`,
    source_kind: 'psi_table',
    excerpt_or_table_ref: `${file_name} (representative H0 fixture)`,
    note: 'Mock adapter only. Not the canonical H2 table.',
    value_kind: 'reported',
    extraction_method: 'script',
  }
}

function point(
  psi_id: string,
  file_name: string,
  row_index: number,
  oxygen_fraction: number,
  flow_velocity_cms: number,
  fuel_phase: ObservationPoint['fuel_phase'],
  outcome: ObservationPoint['outcome'],
): ObservationPoint {
  return {
    psi_id,
    file_name,
    row_index,
    oxygen_fraction,
    pressure_psia: null,
    flow_velocity_cms,
    gravity_g: 0,
    fuel_phase,
    outcome,
    provenance: provenanceFor(file_name),
  }
}

/**
 * Representative H0 points for offline development only. Only measured,
 * completed, ranked-eligible evidence records appear here. FM2, LUCI,
 * PSI-47, PSI-117, and program context never do. The live H2 endpoint
 * reports only oxygen bounds today; this fixture carries flow and outcome
 * values so the 2-D map can be exercised offline.
 */
export const MOCK_OBSERVATIONS: ObservationsResponse = {
  points: [
    point('PSI-25', 'PSI-25_Experimental table_BASS-II.csv', 0, 0.136, 1.2, 'solid', 'ignition'),
    point('PSI-25', 'PSI-25_Experimental table_BASS-II.csv', 1, 0.18, 2.4, 'solid', 'ignition'),
    point('PSI-25', 'PSI-25_Experimental table_BASS-II.csv', 2, 0.222, 3.1, 'solid', 'extinction'),
    point('PSI-98', 'PSI-98_Experimental table_SAFFIRE-1.csv', 0, 0.21, 3.6, 'solid', 'ignition'),
    point('PSI-98', 'PSI-98_Experimental table_SAFFIRE-1.csv', 1, 0.19, 3.9, 'solid', 'extinction'),
    point('PSI-69', 'PSI-69_Experimental table_FLEX.csv', 0, 0.18, 0.4, 'liquid_droplet', 'suppression'),
    point('PSI-69', 'PSI-69_Experimental table_FLEX.csv', 1, 0.24, 0.6, 'liquid_droplet', 'extinction'),
    point('PSI-68', 'PSI-68_Experimental table_Flex2.csv', 0, 0.2, 0.5, 'liquid_droplet', 'suppression'),
    point('PSI-68', 'PSI-68_Experimental table_Flex2.csv', 1, 0.26, 0.7, 'liquid_droplet', 'extinction'),
    point('PSI-159', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv', 0, 0.3997, 0.2, 'gas', 'ignition'),
    point('PSI-159', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv', 1, 0.6, 0.3, 'gas', 'ignition'),
    point('PSI-159', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv', 2, 0.85, 0.4, 'gas', 'ignition'),
    point('PSI-10', 'PSI-10_Experimental table_Flame Design_Normal Flame.csv', 0, 0.4, 0.2, 'gas', 'ignition'),
    point('PSI-10', 'PSI-10_Experimental table_Flame Design_Inverse Flame.csv', 0, 0.849977932, 0.3, 'gas', 'ignition'),
  ],
  excluded_psi_ids: ['PSI-47', 'PSI-117', 'FM2'],
  disclaimer: OBSERVED_DOMAIN_DISCLAIMER,
  mock_notice: 'H0 representative observation fixture. Values are not the canonical H1 tables.',
}
