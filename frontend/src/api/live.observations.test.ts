import { describe, expect, it, vi } from 'vitest'
import { createLiveApi } from './live'
import type { Provenance } from './types'

const oxygenProvenance: Provenance = {
  source_url: 'https://psi.nasa.gov/baas2-csv',
  source_kind: 'psi_table',
  excerpt_or_table_ref: "BASS-II 'Calibrated initial O2 % by vol' column.",
  note: null,
  value_kind: 'reported',
  extraction_method: 'script',
}

const phaseProvenance: Provenance = {
  source_url: 'https://psi.nasa.gov/investigations/PSI-25',
  source_kind: 'psi_narrative',
  excerpt_or_table_ref: 'BASS-II used a solid fuel sample.',
  note: null,
  value_kind: 'reported',
  extraction_method: 'script',
}

describe('live observation provenance', () => {
  it('keeps oxygen and fuel-phase provenance separate', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          points: [
            {
              psi_id: 'PSI-25',
              file_name: 'PSI-25_Experimental table_BASS-II.csv',
              row_index: 0,
              oxygen_fraction: 0.136,
              pressure_psia: null,
              flow_velocity_cms: null,
              gravity_g: null,
              fuel_phase: 'solid',
              provenance: oxygenProvenance,
              field_provenance: {
                oxygen_fraction: oxygenProvenance,
                fuel_phases: phaseProvenance,
              },
            },
          ],
          excluded_psi_ids: [],
          disclaimer:
            'Observed test domain; not a validated flammability boundary.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const api = createLiveApi({ baseUrl: '/api', fetchImpl })

    const response = await api.getObservations()

    expect(response.points[0]?.provenance).toEqual(oxygenProvenance)
    expect(response.points[0]?.field_provenance).toEqual({
      oxygen_fraction: oxygenProvenance,
      fuel_phases: phaseProvenance,
    })
  })
})
