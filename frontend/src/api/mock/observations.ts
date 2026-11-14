import {
  OBSERVED_DOMAIN_DISCLAIMER,
  type ObservationPoint,
  type ObservationsResponse,
} from '../types'

function point(
  id: string,
  psi_id: string,
  label: string,
  oxygen_fraction: number,
  flow_velocity_cms: number,
  fuel_phase: ObservationPoint['fuel_phase'],
  outcome: ObservationPoint['outcome'],
  source_table: string,
): ObservationPoint {
  return {
    id,
    psi_id,
    label,
    oxygen_fraction,
    flow_velocity_cms,
    fuel_phase,
    outcome,
    source_table,
  }
}

/**
 * Representative H0 points. Only measured, completed, ranked-eligible evidence
 * records appear here. FM2, LUCI, PSI-47, PSI-117, and program context never do.
 */
export const MOCK_OBSERVATIONS: ObservationsResponse = {
  points: [
    point('obs-bass-1', 'PSI-25', 'BASS-II O12', 0.136, 1.2, 'solid', 'ignition', 'PSI-25_Experimental table_BASS-II.csv'),
    point('obs-bass-2', 'PSI-25', 'BASS-II mid-oxygen', 0.18, 2.4, 'solid', 'ignition', 'PSI-25_Experimental table_BASS-II.csv'),
    point('obs-bass-3', 'PSI-25', 'BASS-II upper initial O₂', 0.222, 3.1, 'solid', 'extinction', 'PSI-25_Experimental table_BASS-II.csv'),
    point('obs-saffire-1', 'PSI-98', 'SAFFIRE-I sample ignition', 0.21, 3.6, 'solid', 'ignition', 'PSI-98_Experimental table_SAFFIRE-1.csv'),
    point('obs-saffire-2', 'PSI-98', 'SAFFIRE-I spread limit', 0.19, 3.9, 'solid', 'extinction', 'PSI-98_Experimental table_SAFFIRE-1.csv'),
    point('obs-flex-1', 'PSI-69', 'FLEX droplet suppression', 0.18, 0.4, 'liquid_droplet', 'suppression', 'PSI-69_Experimental table_FLEX.csv'),
    point('obs-flex-2', 'PSI-69', 'FLEX limiting oxygen index', 0.24, 0.6, 'liquid_droplet', 'extinction', 'PSI-69_Experimental table_FLEX.csv'),
    point('obs-flex2-1', 'PSI-68', 'FLEX-2 bi-component droplet', 0.2, 0.5, 'liquid_droplet', 'suppression', 'PSI-68_Experimental table_Flex2.csv'),
    point('obs-flex2-2', 'PSI-68', 'FLEX-2 extinction', 0.26, 0.7, 'liquid_droplet', 'extinction', 'PSI-68_Experimental table_Flex2.csv'),
    point('obs-cfig-1', 'PSI-159', 'CFI-G inverse flame', 0.3997, 0.2, 'gas', 'ignition', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv'),
    point('obs-cfig-2', 'PSI-159', 'CFI-G high-O₂ inverse flame', 0.6, 0.3, 'gas', 'ignition', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv'),
    point('obs-cfig-3', 'PSI-159', 'CFI-G maximum XO2', 0.85, 0.4, 'gas', 'ignition', 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv'),
    point('obs-flamedesign-1', 'PSI-10', 'Flame Design normal flame', 0.4, 0.2, 'gas', 'ignition', 'PSI-10_Experimental table_Flame Design_Normal Flame.csv'),
    point('obs-flamedesign-2', 'PSI-10', 'Flame Design maximum XO2', 0.849977932, 0.3, 'gas', 'ignition', 'PSI-10_Experimental table_Flame Design_Inverse Flame.csv'),
  ],
  axes: {
    x: { key: 'oxygen_fraction', label: 'Oxygen fraction', unit: 'fraction' },
    y: { key: 'flow_velocity_cms', label: 'Flow velocity', unit: 'cm/s' },
  },
  excluded: [
    { id: 'PSI-47', reason: 'instrument_context; never a measured observation' },
    { id: 'PSI-117', reason: 'modeling-only; no experimental table' },
    { id: 'FM2', reason: 'anticipated_in_psi program context; outside the 24-record catalog' },
    { id: 'SoFIE', reason: 'active_program context; no current PSI record' },
    { id: 'FLARE', reason: 'active_program context; no current PSI record' },
    { id: 'LUCI', reason: 'unverified program context; not plotted' },
  ],
  disclaimer: OBSERVED_DOMAIN_DISCLAIMER,
  mock_notice: 'H0 representative observation fixture. Values are not the canonical H1 tables.',
}
