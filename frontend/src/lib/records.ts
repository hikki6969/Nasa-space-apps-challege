import type { InvestigationSummary } from '../api/types'

export interface RankEligibility {
  eligible: boolean
  reason: string | null
}

/**
 * A record can appear in the catalog but still be ineligible for physical
 * ranking. Metadata-only annotations and instrument-context roles must never
 * render as measured evidence.
 */
export function rankEligibility(
  record: Pick<InvestigationSummary, 'annotation_status' | 'catalog_role'>,
): RankEligibility {
  if (record.catalog_role === 'instrument_context') {
    return { eligible: false, reason: 'instrument context' }
  }
  if (record.annotation_status === 'metadata_only') {
    return { eligible: false, reason: 'metadata only' }
  }
  return { eligible: true, reason: null }
}
