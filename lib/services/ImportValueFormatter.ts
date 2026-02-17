/**
 * ImportValueFormatter
 *
 * Optional AI-powered value normalization for import data.
 * Invoked after row mapping, before persistence.
 * Only runs when ENABLE_IMPORT_AI_FORMATTING=true to control cost/latency.
 */

import { AIService } from './AIService';
import { parseImportDate, parseImportNumber } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

const ENABLED = process.env.ENABLE_IMPORT_AI_FORMATTING === 'true';

export interface FormatLoadInput {
  pickupDate?: Date | string | null;
  deliveryDate?: Date | string | null;
  lastUpdate?: Date | string | null;
  pickupState?: string | null;
  deliveryState?: string | null;
  revenue?: number | string | null;
  driverPay?: number | string | null;
  weight?: number | string | null;
  totalMiles?: number | string | null;
}

export interface FormatLoadOutput {
  pickupDate?: Date | null;
  deliveryDate?: Date | null;
  lastUpdate?: Date | null;
  pickupState?: string | null;
  deliveryState?: string | null;
  revenue?: number | null;
  driverPay?: number | null;
  weight?: number | null;
  totalMiles?: number | null;
}

export class ImportValueFormatter extends AIService {
  /**
   * Format load values using deterministic parsing first, then AI fallback for failures.
   * Only calls AI when env ENABLE_IMPORT_AI_FORMATTING=true.
   */
  async formatLoadValues(input: FormatLoadInput): Promise<FormatLoadOutput> {
    const output: FormatLoadOutput = {};
    const needsAI: string[] = [];
    const aiPayload: Record<string, string> = {};

    // Dates
    const pd = input.pickupDate;
    if (pd != null && pd !== '') {
      const parsed = pd instanceof Date ? pd : parseImportDate(pd);
      if (parsed) output.pickupDate = parsed;
      else if (typeof pd === 'string') {
        needsAI.push('pickupDate');
        aiPayload.pickupDate = pd;
      }
    }

    const dd = input.deliveryDate;
    if (dd != null && dd !== '') {
      const parsed = dd instanceof Date ? dd : parseImportDate(dd);
      if (parsed) output.deliveryDate = parsed;
      else if (typeof dd === 'string') {
        needsAI.push('deliveryDate');
        aiPayload.deliveryDate = dd;
      }
    }

    const lu = input.lastUpdate;
    if (lu != null && lu !== '') {
      const parsed = lu instanceof Date ? lu : parseImportDate(lu);
      if (parsed) output.lastUpdate = parsed;
      else if (typeof lu === 'string') {
        needsAI.push('lastUpdate');
        aiPayload.lastUpdate = lu;
      }
    }

    // States (2-letter codes)
    const ps = input.pickupState;
    if (ps != null && String(ps).trim()) {
      const norm = normalizeState(ps);
      if (norm && norm.length === 2) output.pickupState = norm;
      else {
        needsAI.push('pickupState');
        aiPayload.pickupState = String(ps);
      }
    }

    const ds = input.deliveryState;
    if (ds != null && String(ds).trim()) {
      const norm = normalizeState(ds);
      if (norm && norm.length === 2) output.deliveryState = norm;
      else {
        needsAI.push('deliveryState');
        aiPayload.deliveryState = String(ds);
      }
    }

    // Numerics
    const rev = input.revenue;
    if (rev != null && rev !== '') {
      const parsed = typeof rev === 'number' ? rev : parseImportNumber(rev);
      if (parsed != null && !isNaN(parsed)) output.revenue = parsed;
      else {
        needsAI.push('revenue');
        aiPayload.revenue = String(rev);
      }
    }

    const dp = input.driverPay;
    if (dp != null && dp !== '') {
      const parsed = typeof dp === 'number' ? dp : parseImportNumber(dp);
      if (parsed != null && !isNaN(parsed)) output.driverPay = parsed;
      else {
        needsAI.push('driverPay');
        aiPayload.driverPay = String(dp);
      }
    }

    const wt = input.weight;
    if (wt != null && wt !== '') {
      const parsed = typeof wt === 'number' ? wt : parseImportNumber(wt);
      if (parsed != null && !isNaN(parsed)) output.weight = parsed;
      else {
        needsAI.push('weight');
        aiPayload.weight = String(wt);
      }
    }

    const tm = input.totalMiles;
    if (tm != null && tm !== '') {
      const parsed = typeof tm === 'number' ? tm : parseImportNumber(tm);
      if (parsed != null && !isNaN(parsed)) output.totalMiles = parsed;
      else {
        needsAI.push('totalMiles');
        aiPayload.totalMiles = String(tm);
      }
    }

    if (!ENABLED || needsAI.length === 0) return output;

    try {
      const aiResult = await this.formatWithAI(aiPayload);
      Object.assign(output, aiResult);
    } catch (e) {
      console.warn('[ImportValueFormatter] AI formatting failed, using original values:', e);
    }

    return output;
  }

  private async formatWithAI(payload: Record<string, string>): Promise<Partial<FormatLoadOutput>> {
    const prompt = `Normalize these import values to proper formats. Return ONLY a JSON object.

Input: ${JSON.stringify(payload)}

Rules:
- Dates: Output ISO date string (YYYY-MM-DD) only. Parse formats like "Jan 15 2024", "15-Jan-24", "01/15/2024".
- States: Output 2-letter US state code (e.g. CA, TX). Parse full names or abbreviations.
- Numbers: Output numeric value only. Remove $, commas, "lbs", "miles" etc.

Fields: ${Object.keys(payload).join(', ')}
Return keys matching input keys. Omit any you cannot parse.`;

    const result = await this.callAI(prompt, {
      systemPrompt: 'Return ONLY valid JSON. No markdown. No explanation.',
      jsonMode: true,
      temperature: 0
    });

    const parsed = result?.data as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};

    const out: Partial<FormatLoadOutput> = {};

    for (const [key, val] of Object.entries(parsed)) {
      if (val == null) continue;
      if (key === 'pickupDate' || key === 'deliveryDate' || key === 'lastUpdate') {
        const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
        if (d && !isNaN(d.getTime())) (out as any)[key] = d;
      } else if (key === 'pickupState' || key === 'deliveryState') {
        const s = String(val).trim().toUpperCase();
        if (s.length === 2) (out as any)[key] = s;
      } else if (key === 'revenue' || key === 'driverPay' || key === 'weight' || key === 'totalMiles') {
        const n = typeof val === 'number' ? val : parseFloat(String(val));
        if (!isNaN(n)) (out as any)[key] = n;
      }
    }

    return out;
  }
}
