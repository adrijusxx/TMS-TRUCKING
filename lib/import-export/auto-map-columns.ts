/**
 * Shared auto-mapping logic for import UIs.
 * Maps CSV/Excel column headers to system field keys using normalization and semantic matching.
 *
 * Uses priority-based scoring to find the BEST match for each header,
 * then deduplicates so no two headers map to the same system field.
 */

import type { SystemField } from './field-utils';

/**
 * Normalize string for simple matching: lowercase, remove non-alphanumeric.
 */
function normalizeSimple(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Advanced normalization: handle "number" vs "id" vs "#" common in trucking.
 */
function normalizeAdvanced(str: string): string {
  let s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  s = s.replace(/number/g, 'id').replace(/no/g, 'id').replace(/#/g, 'id');
  return s;
}

/**
 * Auto-map Excel/CSV column headers to system field keys.
 *
 * Matching priority (highest to lowest):
 *   100 — Exact match on normalized field key
 *    90 — Exact match on a suggestedCsvHeaders entry
 *    80 — Advanced semantic match (e.g. load_id ↔ load_number)
 *    50 — Substring match on field key (strings > 3 chars)
 *    40 — Substring match on a suggestedCsvHeaders entry (strings > 3 chars)
 *
 * A +5 bonus is applied when the normalized header also overlaps the normalized
 * field key as a substring, so closer-named headers win ties.
 *
 * After scoring, a greedy assignment ensures each system field is used at most once.
 */
export function autoMapColumns(
  headers: string[],
  systemFields: Array<{ key: string; label?: string; suggestedCsvHeaders?: string[] }>
): Record<string, string> {
  const candidates: Array<{ header: string; fieldKey: string; priority: number; headerIdx: number }> = [];

  for (let hIdx = 0; hIdx < headers.length; hIdx++) {
    const header = headers[hIdx];
    const normHeader = normalizeSimple(header);
    const normHeaderAdv = normalizeAdvanced(header);

    for (const f of systemFields) {
      const normKey = normalizeSimple(f.key);
      const normKeyAdv = normalizeAdvanced(f.key);
      let priority = 0;

      // Priority 100: Exact key match (normalized)
      if (normHeader === normKey) {
        priority = 100;
      }
      // Priority 90: Exact match on a suggestedCsvHeaders entry
      else if (f.suggestedCsvHeaders?.some(s => normalizeSimple(s) === normHeader)) {
        priority = 90;
      }
      // Priority 80: Advanced semantic match (load_id == load_number)
      else if (normHeaderAdv === normKeyAdv) {
        priority = 80;
      }
      // Priority 50: Substring match on field key
      else if (
        normHeader.length > 3 && normKey.length > 3 &&
        (normHeader.includes(normKey) || normKey.includes(normHeader))
      ) {
        priority = 50;
      }
      // Priority 40: Substring match on a suggestedCsvHeaders entry
      else if (
        f.suggestedCsvHeaders?.some(s => {
          const ns = normalizeSimple(s);
          return ns.length > 3 && normHeader.length > 3 &&
            (normHeader.includes(ns) || ns.includes(normHeader));
        })
      ) {
        priority = 40;
      }

      if (priority > 0) {
        // Bonus: prefer headers whose normalized form overlaps the field key
        if (priority >= 40 && (normKey.includes(normHeader) || normHeader.includes(normKey))) {
          priority += 5;
        }
        candidates.push({ header, fieldKey: f.key, priority, headerIdx: hIdx });
      }
    }
  }

  // Sort by priority descending; ties broken by header order (earlier header wins)
  candidates.sort((a, b) => b.priority - a.priority || a.headerIdx - b.headerIdx);

  // Greedy assignment — each header and each field used at most once
  const result: Record<string, string> = {};
  const usedFields = new Set<string>();

  for (const c of candidates) {
    if (!result[c.header] && !usedFields.has(c.fieldKey)) {
      result[c.header] = c.fieldKey;
      usedFields.add(c.fieldKey);
    }
  }

  return result;
}
