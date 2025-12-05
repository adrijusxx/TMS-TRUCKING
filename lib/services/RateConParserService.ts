/**
 * Rate Confirmation Parser Service
 * 
 * Extracts data from rate confirmation PDFs using GPT-4o-mini.
 * Handles multi-stop loads and various formats.
 * Calculates mileage from zipcodes if not provided in the document.
 */

import { AIService } from './AIService';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';

// ============================================
// CONFIGURATION
// ============================================

const MAX_PDF_CHARS = 15000;
const MAX_TOKENS = 2500;

// ============================================
// TYPES
// ============================================

interface ExtractedStop {
  type: 'PICKUP' | 'DELIVERY';
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  date: string | null;
  time: string | null;
}

interface Extraction {
  loadNumber: string | null;
  brokerName: string | null;
  rate: number | null;
  stops: ExtractedStop[];
  weight: number | null;
  pieces: number | null;
  commodity: string | null;
  miles: number | null;
  equipment: string | null;
}

export interface ParseRateConResult {
  success: boolean;
  loadFormData: Record<string, unknown> | null;
  meta: {
    confidence: 'high' | 'medium' | 'low';
    extractedFieldCount: number;
    processingTimeMs: number;
  };
  warnings: string[];
  error?: string;
}

// ============================================
// SERVICE
// ============================================

export class RateConParserService extends AIService {
  
  async parseRateCon(buffer: Buffer): Promise<ParseRateConResult> {
    const startTime = Date.now();
    
    try {
      console.log('[RateCon] Extracting PDF text...');
      const pdfText = await this.extractTextFromPDF(buffer);
      
      if (!pdfText || pdfText.trim().length < 50) {
        return this.errorResult('PDF is empty or unreadable', startTime);
      }
      
      console.log('[RateCon] Text length:', pdfText.length);
      console.log('[RateCon] Calling AI...');
      
      const extracted = await this.extractWithAI(pdfText.substring(0, MAX_PDF_CHARS));
      
      // Calculate miles from zipcodes if not extracted
      if (!extracted.miles && extracted.stops.length >= 2) {
        console.log('[RateCon] Calculating miles from zipcodes...');
        extracted.miles = await this.calculateMilesFromStops(extracted.stops);
      }
      
      const loadFormData = this.toLoadFormData(extracted);
      const fieldCount = this.countFields(extracted);
      
      const processingTimeMs = Date.now() - startTime;
      console.log(`[RateCon] Done in ${processingTimeMs}ms, ${fieldCount} fields`);
      
      return {
        success: true,
        loadFormData,
        meta: {
          confidence: fieldCount >= 10 ? 'high' : fieldCount >= 5 ? 'medium' : 'low',
          extractedFieldCount: fieldCount,
          processingTimeMs,
        },
        warnings: this.buildWarnings(extracted, loadFormData),
      };
    } catch (error) {
      console.error('[RateCon] Error:', error);
      return this.errorResult(
        error instanceof Error ? error.message : 'Extraction failed',
        startTime
      );
    }
  }
  
  private async extractWithAI(text: string): Promise<Extraction> {
    const prompt = `Extract from this rate confirmation:

${text}

Return JSON:
{
  "loadNumber": "PRO#, Load#, or Reference# (e.g. 52695)",
  "brokerName": "company name at TOP of document (letterhead/logo area)",
  "rate": 4300.00,
  "stops": [
    {"type": "PICKUP", "company": "name", "address": "street", "city": "city", "state": "CA", "zip": "90052", "date": "2024-02-13", "time": "04:30"},
    {"type": "DELIVERY", "company": "name", "address": "street", "city": "city", "state": "ID", "zip": "83708", "date": "2024-02-14", "time": "03:30"}
  ],
  "weight": 45000,
  "pieces": 120,
  "commodity": "US MAIL",
  "miles": 1464,
  "equipment": "DRY_VAN"
}

Rules:
- brokerName = company at TOP (who issued this rate con)
- rate = LINE HAUL RATE or TOTAL RATE amount
- Include ALL stops in order (PICK first, then STOPs/deliveries)
- Use null for missing fields`;

    const result = await this.callAI<any>(prompt, {
      temperature: 0,
      maxTokens: MAX_TOKENS,
      systemPrompt: 'Extract trucking rate confirmation data. Return only valid JSON.',
      jsonMode: true,
    });
    
    return this.normalize(result.data);
  }
  
  private normalize(raw: any): Extraction {
    return {
      loadNumber: this.str(raw?.loadNumber),
      brokerName: this.str(raw?.brokerName),
      rate: this.num(raw?.rate),
      stops: this.normalizeStops(raw?.stops),
      weight: this.num(raw?.weight),
      pieces: this.int(raw?.pieces),
      commodity: this.str(raw?.commodity),
      miles: this.num(raw?.miles),
      equipment: this.equip(raw?.equipment),
    };
  }
  
  private normalizeStops(stops: any[]): ExtractedStop[] {
    if (!Array.isArray(stops)) return [];
    return stops.map(s => ({
      type: String(s?.type || '').toUpperCase().includes('PICK') ? 'PICKUP' : 'DELIVERY',
      company: this.str(s?.company),
      address: this.str(s?.address),
      city: this.str(s?.city),
      state: this.str(s?.state)?.toUpperCase().slice(0, 2) || null,
      zip: this.str(s?.zip),
      date: this.str(s?.date),
      time: this.str(s?.time),
    }));
  }
  
  private toLoadFormData(e: Extraction): Record<string, unknown> {
    const pickup = e.stops.find(s => s.type === 'PICKUP');
    const deliveries = e.stops.filter(s => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];
    const isMultiStop = e.stops.length > 2;
    
    // Calculate miles from zipcodes if not provided
    let miles = e.miles;
    if (!miles && e.stops.length >= 2) {
      // Miles will be calculated separately - mark for calculation
      miles = null;
    }
    
    const data: Record<string, unknown> = {
      loadNumber: e.loadNumber || '',
      customerName: e.brokerName || '',
      revenue: e.rate || 0,
      weight: e.weight || undefined,
      pieces: e.pieces || undefined,
      commodity: e.commodity || '',
      totalMiles: miles || undefined,
      equipmentType: e.equipment || 'DRY_VAN',
      loadType: 'FTL',
    };
    
    if (isMultiStop) {
      data.stops = e.stops.map((s, i) => ({
        stopType: s.type,
        sequence: i + 1,
        company: s.company || '',
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        zip: s.zip || '',
        earliestArrival: this.formatDT(s.date, s.time),
      }));
    } else {
      if (pickup) {
        data.pickupLocation = pickup.company || '';
        data.pickupAddress = pickup.address || '';
        data.pickupCity = pickup.city || '';
        data.pickupState = pickup.state || '';
        data.pickupZip = pickup.zip || '';
        data.pickupDate = this.formatDT(pickup.date, pickup.time);
        data.pickupCompany = pickup.company || '';
      }
      if (lastDelivery) {
        data.deliveryLocation = lastDelivery.company || '';
        data.deliveryAddress = lastDelivery.address || '';
        data.deliveryCity = lastDelivery.city || '';
        data.deliveryState = lastDelivery.state || '';
        data.deliveryZip = lastDelivery.zip || '';
        data.deliveryDate = this.formatDT(lastDelivery.date, lastDelivery.time);
        data.deliveryCompany = lastDelivery.company || '';
      }
    }
    
    return data;
  }
  
  private buildWarnings(e: Extraction, data: Record<string, unknown>): string[] {
    const w: string[] = [];
    if (!e.rate) w.push('Revenue not found - enter manually');
    if (!e.loadNumber) w.push('Load number not found');
    if (!e.brokerName) w.push('Broker not identified');
    if (!e.weight) w.push('Weight not found');
    if (!e.miles) w.push('Miles not found - will calculate if zipcodes available');
    return w;
  }
  
  private countFields(e: Extraction): number {
    let c = 0;
    if (e.loadNumber) c++;
    if (e.brokerName) c++;
    if (e.rate) c++;
    if (e.weight) c++;
    if (e.pieces) c++;
    if (e.miles) c++;
    if (e.commodity) c++;
    e.stops.forEach(s => {
      if (s.address) c++;
      if (s.city) c++;
      if (s.zip) c++;
      if (s.date) c++;
    });
    return c;
  }
  
  private errorResult(error: string, startTime: number): ParseRateConResult {
    return {
      success: false,
      loadFormData: null,
      meta: { confidence: 'low', extractedFieldCount: 0, processingTimeMs: Date.now() - startTime },
      warnings: [],
      error,
    };
  }
  
  // Helpers
  private str(v: unknown): string | null {
    if (v === null || v === undefined || v === '') return null;
    return String(v).trim();
  }
  
  private num(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'string' ? parseFloat(v.replace(/[,$]/g, '')) : Number(v);
    return isNaN(n) ? null : n;
  }
  
  private int(v: unknown): number | null {
    const n = this.num(v);
    return n !== null ? Math.round(n) : null;
  }
  
  private equip(v: unknown): string {
    const s = String(v || '').toUpperCase();
    if (s.includes('REEFER')) return 'REEFER';
    if (s.includes('FLAT')) return 'FLATBED';
    return 'DRY_VAN';
  }
  
  private formatDT(date: string | null, time: string | null): string | undefined {
    if (!date) return undefined;
    let d = date;
    
    // MM/DD/YY -> YYYY-MM-DD
    if (d.includes('/')) {
      const [m, day, y] = d.split('/');
      d = `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return time ? `${d}T${time}` : d;
  }
  
  /**
   * Calculate total miles from stop zipcodes using Google Maps Distance Matrix
   */
  private async calculateMilesFromStops(stops: ExtractedStop[]): Promise<number | null> {
    try {
      // Need at least 2 stops with location data
      const stopsWithLocation = stops.filter(s => 
        (s.zip && s.zip.length >= 5) || (s.city && s.state)
      );
      
      if (stopsWithLocation.length < 2) {
        console.log('[RateCon] Not enough location data for mileage calculation');
        return null;
      }
      
      let totalMiles = 0;
      
      // Calculate distance between consecutive stops
      for (let i = 0; i < stopsWithLocation.length - 1; i++) {
        const origin = stopsWithLocation[i];
        const dest = stopsWithLocation[i + 1];
        
        // Build location objects
        const originLoc = origin.zip 
          ? { city: origin.zip, state: origin.state || 'US' }
          : { city: origin.city!, state: origin.state! };
        const destLoc = dest.zip
          ? { city: dest.zip, state: dest.state || 'US' }
          : { city: dest.city!, state: dest.state! };
        
        const results = await calculateDistanceMatrix({
          origins: [originLoc],
          destinations: [destLoc],
          mode: 'driving',
          units: 'imperial',
        });
        
        if (results?.[0]?.[0]?.distance) {
          // Convert meters to miles
          const miles = results[0][0].distance * 0.000621371;
          totalMiles += miles;
          console.log(`[RateCon] Leg ${i + 1}: ${miles.toFixed(0)} miles`);
        }
      }
      
      if (totalMiles > 0) {
        console.log(`[RateCon] Total calculated miles: ${totalMiles.toFixed(0)}`);
        return Math.round(totalMiles);
      }
      
      return null;
    } catch (error) {
      console.error('[RateCon] Mileage calculation error:', error);
      return null;
    }
  }
}

// Singleton
let instance: RateConParserService | null = null;
export function getRateConParserService(): RateConParserService {
  if (!instance) instance = new RateConParserService();
  return instance;
}
