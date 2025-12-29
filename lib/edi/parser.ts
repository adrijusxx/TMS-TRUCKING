/**
 * EDI Parser and Generator
 * 
 * Supports common EDI transaction sets:
 * - 204: Motor Carrier Load Tender
 * - 210: Motor Carrier Freight Invoice
 * - 214: Transportation Carrier Shipment Status Message
 */

interface EDISegment {
  id: string;
  elements: string[];
}

interface EDITransaction {
  type: '204' | '210' | '214';
  segments: EDISegment[];
  senderId?: string;
  receiverId?: string;
  controlNumber?: string;
}

/**
 * Parse EDI file content into structured format
 */
export function parseEDI(content: string): EDITransaction {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const segments: EDISegment[] = [];

  // Determine delimiters (usually in ISA segment)
  const isaLine = lines[0];
  const elementDelimiter = isaLine[3] || '*';
  const segmentDelimiter = isaLine[105] || '~';

  // Parse segments
  for (const line of lines) {
    if (!line.trim()) continue;

    const segmentParts = line.split(segmentDelimiter);
    for (const segment of segmentParts) {
      if (!segment.trim()) continue;

      const elements = segment.split(elementDelimiter);
      if (elements.length > 0) {
        segments.push({
          id: elements[0],
          elements: elements.slice(1),
        });
      }
    }
  }

  // Determine transaction type from ST segment
  const stSegment = segments.find((s) => s.id === 'ST');
  const transactionType = stSegment?.elements[0] as '204' | '210' | '214' | undefined;

  return {
    type: transactionType || '204',
    segments,
  };
}

/**
 * Generate EDI 204 (Load Tender) from load data
 */
export function generateEDI204(load: {
  loadNumber: string;
  customer: {
    name: string;
    scac?: string;
  };
  pickupCity: string;
  pickupState: string;
  pickupDate: Date;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date;
  commodity?: string;
  weight?: number;
  revenue: number;
}): string {
  const segments: string[] = [];
  const elementDelimiter = '*';
  const segmentDelimiter = '~';

  // ISA - Interchange Header
  segments.push(
    `ISA${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}ZZ${elementDelimiter}${load.customer.scac || 'CUSTOMER'}${elementDelimiter}ZZ${elementDelimiter}TMS${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}${elementDelimiter}00501${elementDelimiter}000000001${elementDelimiter}0${elementDelimiter}P${elementDelimiter}>${segmentDelimiter}`
  );

  // GS - Functional Group Header
  segments.push(
    `GS${elementDelimiter}SM${elementDelimiter}${load.customer.scac || 'CUSTOMER'}${elementDelimiter}TMS${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}1${elementDelimiter}X${elementDelimiter}005010${segmentDelimiter}`
  );

  // ST - Transaction Set Header
  segments.push(
    `ST${elementDelimiter}204${elementDelimiter}0001${segmentDelimiter}`
  );

  // B2 - Beginning Segment for Shipment Information
  segments.push(
    `B2${elementDelimiter}${elementDelimiter}${load.loadNumber}${elementDelimiter}${elementDelimiter}${load.pickupDate.toISOString().slice(0, 8).replace(/-/g, '')}${segmentDelimiter}`
  );

  // N1 - Name (Shipper)
  segments.push(
    `N1${elementDelimiter}SH${elementDelimiter}${load.customer.name}${segmentDelimiter}`
  );

  // N3 - Address Information (Pickup)
  segments.push(
    `N3${elementDelimiter}${load.pickupCity}${elementDelimiter}${load.pickupState}${segmentDelimiter}`
  );

  // N1 - Name (Consignee)
  segments.push(
    `N1${elementDelimiter}CN${elementDelimiter}${load.customer.name}${segmentDelimiter}`
  );

  // N3 - Address Information (Delivery)
  segments.push(
    `N3${elementDelimiter}${load.deliveryCity}${elementDelimiter}${load.deliveryState}${segmentDelimiter}`
  );

  // L11 - Reference Numbers (Rate)
  segments.push(
    `L11${elementDelimiter}${load.revenue.toFixed(2)}${segmentDelimiter}`
  );

  if (load.commodity) {
    // G62 - Date/Time Reference
    segments.push(
      `G62${elementDelimiter}10${elementDelimiter}${load.pickupDate.toISOString().slice(0, 8).replace(/-/g, '')}${segmentDelimiter}`
    );
  }

  if (load.weight) {
    // L3 - Weight Information
    segments.push(
      `L3${elementDelimiter}${load.weight}${elementDelimiter}L${segmentDelimiter}`
    );
  }

  // SE - Transaction Set Trailer
  segments.push(
    `SE${elementDelimiter}${segments.length}${elementDelimiter}0001${segmentDelimiter}`
  );

  // GE - Functional Group Trailer
  segments.push(
    `GE${elementDelimiter}1${elementDelimiter}1${segmentDelimiter}`
  );

  // IEA - Interchange Trailer
  segments.push(
    `IEA${elementDelimiter}1${elementDelimiter}000000001${segmentDelimiter}`
  );

  return segments.join('\n');
}

/**
 * Generate EDI 214 (Shipment Status) from load status
 */
export function generateEDI214(load: {
  loadNumber: string;
  status: string;
  location?: string;
  timestamp: Date;
  customer?: {
    scac?: string;
  };
}): string {
  const segments: string[] = [];
  const elementDelimiter = '*';
  const segmentDelimiter = '~';

  // ISA - Interchange Header
  segments.push(
    `ISA${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}ZZ${elementDelimiter}TMS${elementDelimiter}ZZ${elementDelimiter}${load.customer?.scac || 'CUSTOMER'}${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}${elementDelimiter}00501${elementDelimiter}000000001${elementDelimiter}0${elementDelimiter}P${elementDelimiter}>${segmentDelimiter}`
  );

  // GS - Functional Group Header
  segments.push(
    `GS${elementDelimiter}QM${elementDelimiter}TMS${elementDelimiter}${load.customer?.scac || 'CUSTOMER'}${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}1${elementDelimiter}X${elementDelimiter}005010${segmentDelimiter}`
  );

  // ST - Transaction Set Header
  segments.push(
    `ST${elementDelimiter}214${elementDelimiter}0001${segmentDelimiter}`
  );

  // B10 - Beginning Segment for Transportation Carrier Shipment Status Message
  segments.push(
    `B10${elementDelimiter}${load.loadNumber}${segmentDelimiter}`
  );

  // Map status to EDI status code
  const statusMap: Record<string, string> = {
    PENDING: 'OR',
    ASSIGNED: 'OR',
    EN_ROUTE_PICKUP: 'IT',
    AT_PICKUP: 'AR',
    LOADED: 'AE',
    EN_ROUTE_DELIVERY: 'IT',
    AT_DELIVERY: 'AR',
    DELIVERED: 'DL',
    INVOICED: 'DL',
    PAID: 'DL',
  };

  const ediStatus = statusMap[load.status] || 'OR';

  // E20 - Shipment Status Detail
  segments.push(
    `E20${elementDelimiter}${ediStatus}${elementDelimiter}${load.timestamp.toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${load.timestamp.toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}${load.location || ''}${segmentDelimiter}`
  );

  // SE - Transaction Set Trailer
  segments.push(
    `SE${elementDelimiter}${segments.length}${elementDelimiter}0001${segmentDelimiter}`
  );

  // GE - Functional Group Trailer
  segments.push(
    `GE${elementDelimiter}1${elementDelimiter}1${segmentDelimiter}`
  );

  // IEA - Interchange Trailer
  segments.push(
    `IEA${elementDelimiter}1${elementDelimiter}000000001${segmentDelimiter}`
  );

  return segments.join('\n');
}

/**
 * Generate EDI 210 (Invoice) from invoice data
 */
export function generateEDI210(invoice: {
  invoiceNumber: string;
  invoiceDate: Date;
  customer: {
    name: string;
    scac?: string;
  };
  loads: Array<{
    loadNumber: string;
    revenue: number;
  }>;
  total: number;
}): string {
  const segments: string[] = [];
  const elementDelimiter = '*';
  const segmentDelimiter = '~';

  // ISA - Interchange Header
  segments.push(
    `ISA${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}00${elementDelimiter}          ${elementDelimiter}ZZ${elementDelimiter}TMS${elementDelimiter}ZZ${elementDelimiter}${invoice.customer.scac || 'CUSTOMER'}${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}${elementDelimiter}00501${elementDelimiter}000000001${elementDelimiter}0${elementDelimiter}P${elementDelimiter}>${segmentDelimiter}`
  );

  // GS - Functional Group Header
  segments.push(
    `GS${elementDelimiter}IN${elementDelimiter}TMS${elementDelimiter}${invoice.customer.scac || 'CUSTOMER'}${elementDelimiter}${new Date().toISOString().slice(0, 8).replace(/-/g, '')}${elementDelimiter}${new Date().toTimeString().slice(0, 6).replace(/:/g, '')}${elementDelimiter}1${elementDelimiter}X${elementDelimiter}005010${segmentDelimiter}`
  );

  // ST - Transaction Set Header
  segments.push(
    `ST${elementDelimiter}210${elementDelimiter}0001${segmentDelimiter}`
  );

  // B3 - Beginning Segment for Invoice
  segments.push(
    `B3${elementDelimiter}${invoice.invoiceNumber}${elementDelimiter}${invoice.invoiceDate.toISOString().slice(0, 8).replace(/-/g, '')}${segmentDelimiter}`
  );

  // N1 - Name (Bill To)
  segments.push(
    `N1${elementDelimiter}BT${elementDelimiter}${invoice.customer.name}${segmentDelimiter}`
  );

  // Add line items for each load
  invoice.loads.forEach((load, idx) => {
    // L0 - Line Item
    segments.push(
      `L0${elementDelimiter}${idx + 1}${elementDelimiter}${load.loadNumber}${elementDelimiter}${load.revenue.toFixed(2)}${segmentDelimiter}`
    );
  });

  // L1 - Summary
  segments.push(
    `L1${elementDelimiter}${invoice.total.toFixed(2)}${segmentDelimiter}`
  );

  // SE - Transaction Set Trailer
  segments.push(
    `SE${elementDelimiter}${segments.length}${elementDelimiter}0001${segmentDelimiter}`
  );

  // GE - Functional Group Trailer
  segments.push(
    `GE${elementDelimiter}1${elementDelimiter}1${segmentDelimiter}`
  );

  // IEA - Interchange Trailer
  segments.push(
    `IEA${elementDelimiter}1${elementDelimiter}000000001${segmentDelimiter}`
  );

  return segments.join('\n');
}

