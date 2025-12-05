/**
 * Diagnostic Trouble Codes (DTC) Reference Database
 * 
 * Static database of common truck fault codes with troubleshooting information.
 * Includes J1939 SPN/FMI codes (diesel trucks) and OBD-II P-codes.
 */

export interface DTCInfo {
  code: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  urgency: string;
  commonCauses: string[];
  troubleshooting: string[];
  estimatedCost: string | null;
}

// ============================================
// CATEGORY DEFINITIONS
// ============================================

export const DIAGNOSTIC_CATEGORIES = {
  engine: { label: 'Engine', color: 'red', icon: 'engine' },
  transmission: { label: 'Transmission', color: 'orange', icon: 'cog' },
  brake: { label: 'Brake System', color: 'yellow', icon: 'disc' },
  exhaust: { label: 'Exhaust/Emissions', color: 'purple', icon: 'wind' },
  electrical: { label: 'Electrical', color: 'blue', icon: 'zap' },
  aftertreatment: { label: 'Aftertreatment (DEF)', color: 'teal', icon: 'droplet' },
  fuel: { label: 'Fuel System', color: 'green', icon: 'fuel' },
  cooling: { label: 'Cooling System', color: 'cyan', icon: 'thermometer' },
  air: { label: 'Air System', color: 'gray', icon: 'wind' },
  body: { label: 'Body/Chassis', color: 'slate', icon: 'truck' },
  unknown: { label: 'Unknown', color: 'gray', icon: 'help-circle' },
} as const;

export const SEVERITY_LEVELS = {
  critical: { label: 'Critical', color: 'red', priority: 1 },
  warning: { label: 'Warning', color: 'yellow', priority: 2 },
  info: { label: 'Info', color: 'blue', priority: 3 },
} as const;

export const URGENCY_LEVELS = {
  immediate: { label: 'Immediate Action', description: 'Stop and service immediately' },
  soon: { label: 'Service Soon', description: 'Schedule service within 24-48 hours' },
  monitor: { label: 'Monitor', description: 'Keep an eye on it, service at next opportunity' },
} as const;

// ============================================
// DTC CODES DATABASE
// ============================================

export const DTC_CODES_DATABASE: Record<string, DTCInfo> = {
  // ==========================================
  // ENGINE CODES (J1939 SPN)
  // ==========================================
  'SPN91': {
    code: 'SPN91',
    name: 'Accelerator Pedal Position',
    description: 'Accelerator pedal position sensor circuit malfunction',
    category: 'engine',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Faulty accelerator pedal position sensor',
      'Wiring harness damage or loose connection',
      'ECM calibration issue',
      'Corrosion in connector',
    ],
    troubleshooting: [
      'Check accelerator pedal sensor connector for damage or corrosion',
      'Inspect wiring harness from sensor to ECM',
      'Test sensor output voltage with multimeter',
      'Check for related codes (idle validation switch)',
      'Replace sensor if testing indicates failure',
    ],
    estimatedCost: '$150-$400',
  },
  'SPN100': {
    code: 'SPN100',
    name: 'Engine Oil Pressure',
    description: 'Engine oil pressure below normal operating range',
    category: 'engine',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'Low oil level',
      'Oil pump failure',
      'Worn bearings',
      'Oil pressure sensor failure',
      'Oil filter restriction',
    ],
    troubleshooting: [
      'STOP ENGINE IMMEDIATELY if oil pressure gauge shows low',
      'Check oil level and add if low',
      'Inspect for oil leaks under vehicle',
      'Check oil pressure with mechanical gauge',
      'Inspect oil filter for restriction',
      'Have oil pump and bearings inspected if pressure still low',
    ],
    estimatedCost: '$200-$3000+',
  },
  'SPN102': {
    code: 'SPN102',
    name: 'Boost Pressure',
    description: 'Turbocharger boost pressure out of range',
    category: 'engine',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Turbocharger failure or wear',
      'Boost leak in charge air system',
      'Wastegate actuator malfunction',
      'Boost pressure sensor failure',
      'Charge air cooler leak',
    ],
    troubleshooting: [
      'Listen for unusual turbo whine or whistling sounds',
      'Inspect charge air piping for leaks or loose clamps',
      'Check intercooler/charge air cooler for damage',
      'Test boost pressure sensor',
      'Inspect turbocharger for shaft play or damage',
    ],
    estimatedCost: '$500-$3500',
  },
  'SPN110': {
    code: 'SPN110',
    name: 'Engine Coolant Temperature',
    description: 'Engine coolant temperature abnormal',
    category: 'cooling',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'Low coolant level',
      'Thermostat failure',
      'Water pump failure',
      'Radiator blockage or damage',
      'Cooling fan malfunction',
      'Coolant temperature sensor failure',
    ],
    troubleshooting: [
      'Check coolant level when engine is cool',
      'Inspect for coolant leaks',
      'Verify cooling fan operation',
      'Check thermostat operation',
      'Inspect radiator for blockage',
      'Test coolant temperature sensor',
    ],
    estimatedCost: '$100-$1500',
  },
  'SPN111': {
    code: 'SPN111',
    name: 'Coolant Level',
    description: 'Engine coolant level low',
    category: 'cooling',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'Coolant leak (hoses, radiator, water pump)',
      'Head gasket failure',
      'Heater core leak',
      'Coolant level sensor failure',
    ],
    troubleshooting: [
      'Check coolant reservoir level',
      'Inspect all hoses and connections for leaks',
      'Check radiator and cap for damage',
      'Look for coolant in oil (head gasket indicator)',
      'Pressure test cooling system',
    ],
    estimatedCost: '$50-$2500',
  },
  'SPN157': {
    code: 'SPN157',
    name: 'Injector Metering Rail Pressure',
    description: 'Fuel rail pressure out of specification',
    category: 'fuel',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Fuel filter restriction',
      'Fuel pump wear or failure',
      'Fuel pressure regulator failure',
      'Injector leak',
      'Fuel rail pressure sensor failure',
    ],
    troubleshooting: [
      'Replace fuel filters',
      'Check fuel supply pressure at pump',
      'Inspect fuel lines for restrictions or leaks',
      'Test fuel rail pressure sensor',
      'Check for injector leak-back',
    ],
    estimatedCost: '$200-$2000',
  },
  'SPN190': {
    code: 'SPN190',
    name: 'Engine Speed',
    description: 'Engine speed signal erratic or missing',
    category: 'engine',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'Crankshaft position sensor failure',
      'Camshaft position sensor failure',
      'Timing gear/belt issues',
      'Wiring problem',
      'ECM failure',
    ],
    troubleshooting: [
      'Check crankshaft position sensor connector',
      'Inspect sensor and reluctor wheel',
      'Test sensor output with oscilloscope',
      'Check related camshaft sensor',
      'Verify timing belt/chain condition',
    ],
    estimatedCost: '$150-$800',
  },

  // ==========================================
  // AFTERTREATMENT/DEF CODES
  // ==========================================
  'SPN3226': {
    code: 'SPN3226',
    name: 'DEF Tank Level',
    description: 'Diesel Exhaust Fluid (DEF) tank level low',
    category: 'aftertreatment',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Low DEF fluid level',
      'DEF level sensor failure',
      'DEF quality issue',
      'Wiring problem to sensor',
    ],
    troubleshooting: [
      'Check DEF tank level visually',
      'Add DEF fluid if low (use only API certified DEF)',
      'Check DEF quality with refractometer if available',
      'Inspect DEF level sensor connector',
      'Test sensor if level shows incorrect reading',
    ],
    estimatedCost: '$30-$500',
  },
  'SPN3361': {
    code: 'SPN3361',
    name: 'SCR Catalyst Efficiency',
    description: 'Selective Catalytic Reduction system efficiency below threshold',
    category: 'aftertreatment',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Low or contaminated DEF',
      'DEF injector failure',
      'SCR catalyst deterioration',
      'NOx sensor failure',
      'DEF pump failure',
    ],
    troubleshooting: [
      'Verify DEF tank is full with quality DEF',
      'Check for DEF system fault codes',
      'Inspect DEF injector for crystallization',
      'Test NOx sensors',
      'Check DEF pump operation',
      'May require forced regeneration or catalyst replacement',
    ],
    estimatedCost: '$500-$5000',
  },
  'SPN4364': {
    code: 'SPN4364',
    name: 'Aftertreatment SCR Operator Inducement',
    description: 'SCR system derate active - reduced engine power',
    category: 'aftertreatment',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'Continued operation with SCR fault codes',
      'Empty or low DEF tank',
      'DEF quality issue',
      'SCR system component failure',
    ],
    troubleshooting: [
      'Check and fill DEF tank immediately',
      'Address all active aftertreatment fault codes',
      'DEF quality test may be required',
      'System reset may be needed after repairs',
      'Professional diagnosis required to clear inducement',
    ],
    estimatedCost: '$100-$3000',
  },
  'SPN5246': {
    code: 'SPN5246',
    name: 'Aftertreatment DEF Quality',
    description: 'DEF quality does not meet specifications',
    category: 'aftertreatment',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Diluted or contaminated DEF',
      'Wrong fluid added to DEF tank',
      'DEF quality sensor failure',
      'Old/expired DEF',
    ],
    troubleshooting: [
      'Test DEF quality with refractometer (32.5% urea)',
      'If quality is low, drain and replace with fresh DEF',
      'Only use API certified DEF',
      'Clean DEF tank if contaminated',
      'Test quality sensor if fluid tests good',
    ],
    estimatedCost: '$100-$800',
  },

  // ==========================================
  // BRAKE SYSTEM CODES
  // ==========================================
  'SPN520200': {
    code: 'SPN520200',
    name: 'ABS Warning',
    description: 'Anti-lock Braking System malfunction',
    category: 'brake',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Wheel speed sensor failure',
      'ABS module failure',
      'Wiring damage',
      'Low brake fluid',
      'Brake system air leak',
    ],
    troubleshooting: [
      'Check for specific ABS fault codes',
      'Inspect wheel speed sensors and tone rings',
      'Check ABS module connectors',
      'Verify brake fluid level',
      'Check air system pressure',
    ],
    estimatedCost: '$200-$1500',
  },

  // ==========================================
  // TRANSMISSION CODES
  // ==========================================
  'SPN523': {
    code: 'SPN523',
    name: 'Transmission Current Gear',
    description: 'Transmission gear selection fault',
    category: 'transmission',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Gear position sensor failure',
      'Shift linkage problem',
      'Transmission control module issue',
      'Wiring problem',
    ],
    troubleshooting: [
      'Check transmission fluid level and condition',
      'Inspect shift linkage adjustment',
      'Test gear position sensor',
      'Check TCM for additional codes',
      'Verify wiring to sensors',
    ],
    estimatedCost: '$200-$2000',
  },

  // ==========================================
  // OBD-II P-CODES (Common)
  // ==========================================
  'P0087': {
    code: 'P0087',
    name: 'Fuel Rail Pressure Too Low',
    description: 'Fuel system pressure below specification',
    category: 'fuel',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Clogged fuel filter',
      'Weak fuel pump',
      'Fuel pressure regulator failure',
      'Fuel line restriction',
      'Injector leak',
    ],
    troubleshooting: [
      'Replace fuel filter',
      'Test fuel pump pressure',
      'Check fuel lines for kinks or restrictions',
      'Test fuel pressure regulator',
      'Check for injector leak-back',
    ],
    estimatedCost: '$200-$1500',
  },
  'P0101': {
    code: 'P0101',
    name: 'MAF Sensor Circuit Range/Performance',
    description: 'Mass Air Flow sensor reading out of expected range',
    category: 'engine',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Dirty MAF sensor',
      'Air intake leak',
      'MAF sensor failure',
      'Wiring issue',
    ],
    troubleshooting: [
      'Clean MAF sensor with MAF cleaner spray',
      'Inspect air intake system for leaks',
      'Check MAF sensor connector',
      'Test MAF sensor output',
      'Replace if cleaning doesnt resolve',
    ],
    estimatedCost: '$100-$400',
  },
  'P0128': {
    code: 'P0128',
    name: 'Coolant Thermostat',
    description: 'Coolant temperature below thermostat regulating temperature',
    category: 'cooling',
    severity: 'info',
    urgency: 'monitor',
    commonCauses: [
      'Thermostat stuck open',
      'Coolant temperature sensor issue',
      'Low coolant level',
    ],
    troubleshooting: [
      'Check coolant level',
      'Monitor warm-up time',
      'Test thermostat operation',
      'Replace thermostat if stuck open',
    ],
    estimatedCost: '$100-$300',
  },
  'P0299': {
    code: 'P0299',
    name: 'Turbo Underboost',
    description: 'Turbocharger not producing expected boost pressure',
    category: 'engine',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Boost leak in intake system',
      'Turbocharger failure',
      'Wastegate stuck open',
      'Intake restriction',
    ],
    troubleshooting: [
      'Inspect all charge air piping and clamps',
      'Check intercooler for leaks',
      'Listen for turbo noise',
      'Inspect turbo for shaft play',
      'Check wastegate actuator',
    ],
    estimatedCost: '$500-$3000',
  },
  'P0401': {
    code: 'P0401',
    name: 'EGR Flow Insufficient',
    description: 'Exhaust Gas Recirculation flow below expected level',
    category: 'exhaust',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Carbon buildup in EGR valve',
      'EGR valve failure',
      'EGR passages clogged',
      'EGR position sensor issue',
    ],
    troubleshooting: [
      'Clean EGR valve and passages',
      'Test EGR valve operation',
      'Check EGR cooler for restriction',
      'Inspect vacuum lines if applicable',
      'Replace EGR valve if necessary',
    ],
    estimatedCost: '$200-$800',
  },
  'P0420': {
    code: 'P0420',
    name: 'Catalyst Efficiency Below Threshold',
    description: 'Catalytic converter not operating at expected efficiency',
    category: 'exhaust',
    severity: 'warning',
    urgency: 'monitor',
    commonCauses: [
      'Worn catalytic converter',
      'Oxygen sensor failure',
      'Exhaust leak before converter',
      'Engine running rich or lean',
    ],
    troubleshooting: [
      'Check for exhaust leaks',
      'Test oxygen sensors',
      'Check fuel system for rich/lean condition',
      'Inspect converter for physical damage',
      'Replace converter if testing confirms failure',
    ],
    estimatedCost: '$500-$2500',
  },
  'P2002': {
    code: 'P2002',
    name: 'DPF Efficiency Below Threshold',
    description: 'Diesel Particulate Filter not operating efficiently',
    category: 'aftertreatment',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'DPF clogged with soot',
      'Failed regeneration attempts',
      'DPF substrate damage',
      'Pressure sensor failure',
    ],
    troubleshooting: [
      'Attempt forced regeneration',
      'Check DPF pressure differential',
      'Inspect for DPF damage',
      'Verify no exhaust leaks before DPF',
      'Professional DPF cleaning may be required',
    ],
    estimatedCost: '$300-$4000',
  },

  // ==========================================
  // ELECTRICAL SYSTEM
  // ==========================================
  'P0562': {
    code: 'P0562',
    name: 'System Voltage Low',
    description: 'Vehicle electrical system voltage below normal',
    category: 'electrical',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Weak battery',
      'Alternator failure',
      'Loose or corroded battery connections',
      'Parasitic draw',
      'Wiring issue',
    ],
    troubleshooting: [
      'Test battery voltage and condition',
      'Check alternator output',
      'Inspect battery terminals and cables',
      'Check for parasitic draw',
      'Test charging system',
    ],
    estimatedCost: '$100-$800',
  },
  'U0100': {
    code: 'U0100',
    name: 'Lost Communication with ECM',
    description: 'No communication between modules and Engine Control Module',
    category: 'electrical',
    severity: 'critical',
    urgency: 'immediate',
    commonCauses: [
      'ECM failure',
      'CAN bus wiring issue',
      'Power/ground issue to ECM',
      'Module programming issue',
    ],
    troubleshooting: [
      'Check ECM power and ground circuits',
      'Inspect CAN bus wiring for damage',
      'Check for voltage at ECM connector',
      'Scan for additional U-codes',
      'May require ECM replacement or reprogramming',
    ],
    estimatedCost: '$500-$3000',
  },

  // ==========================================
  // CHECK ENGINE LIGHT (Generic)
  // ==========================================
  'CEL': {
    code: 'CEL',
    name: 'Check Engine Light',
    description: 'Check Engine Light illuminated - specific code not reported',
    category: 'engine',
    severity: 'warning',
    urgency: 'soon',
    commonCauses: [
      'Various engine or emissions issues',
      'Loose gas cap',
      'Sensor malfunction',
      'Emissions system fault',
    ],
    troubleshooting: [
      'Have vehicle scanned for specific fault codes',
      'Check gas cap is tight',
      'Look for obvious issues (loose wires, vacuum leaks)',
      'Address all stored fault codes',
      'Clear codes and monitor for return',
    ],
    estimatedCost: 'Varies by specific fault',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get DTC info by code
 */
export function getDTCInfo(code: string): DTCInfo | null {
  const normalizedCode = code.toUpperCase().trim();
  return DTC_CODES_DATABASE[normalizedCode] || null;
}

/**
 * Parse and categorize a fault code
 */
export function categorizeFaultCode(code: string): {
  category: string;
  severity: string;
  spnId?: number;
  fmiId?: number;
} {
  const normalizedCode = code.toUpperCase().trim();
  
  // Check database first
  const dbInfo = DTC_CODES_DATABASE[normalizedCode];
  if (dbInfo) {
    return {
      category: dbInfo.category,
      severity: dbInfo.severity,
    };
  }

  // Parse SPN codes
  const spnMatch = normalizedCode.match(/^SPN(\d+)/);
  if (spnMatch) {
    const spnId = parseInt(spnMatch[1], 10);
    
    // Categorize by SPN range
    let category = 'unknown';
    let severity = 'warning';
    
    if (spnId >= 91 && spnId <= 191) {
      category = 'engine';
    } else if (spnId >= 100 && spnId <= 120) {
      category = 'engine';
      severity = 'critical'; // Oil/coolant typically critical
    } else if (spnId >= 3200 && spnId <= 5300) {
      category = 'aftertreatment';
    } else if (spnId >= 520000 && spnId <= 521000) {
      category = 'brake';
    }
    
    // Parse FMI if present
    const fmiMatch = normalizedCode.match(/FMI(\d+)/);
    const fmiId = fmiMatch ? parseInt(fmiMatch[1], 10) : undefined;
    
    return { category, severity, spnId, fmiId };
  }

  // Parse P-codes (OBD-II)
  if (normalizedCode.startsWith('P')) {
    const pCode = normalizedCode.substring(1);
    let category = 'unknown';
    let severity = 'warning';
    
    if (pCode.startsWith('0')) {
      // P0xxx - Generic powertrain codes
      const subCode = parseInt(pCode.substring(1, 2), 10);
      switch (subCode) {
        case 1: category = 'fuel'; break;
        case 2: category = 'fuel'; break;
        case 3: category = 'engine'; break;
        case 4: category = 'exhaust'; break;
        case 5: category = 'engine'; break;
        case 6: category = 'electrical'; break;
        case 7: category = 'transmission'; break;
        default: category = 'engine';
      }
    } else if (pCode.startsWith('2')) {
      category = 'aftertreatment';
    }
    
    return { category, severity };
  }

  // Parse U-codes (Network)
  if (normalizedCode.startsWith('U')) {
    return { category: 'electrical', severity: 'critical' };
  }

  // Parse C-codes (Chassis)
  if (normalizedCode.startsWith('C')) {
    return { category: 'brake', severity: 'warning' };
  }

  // Parse B-codes (Body)
  if (normalizedCode.startsWith('B')) {
    return { category: 'body', severity: 'info' };
  }

  return { category: 'unknown', severity: 'warning' };
}

/**
 * Get all codes by category
 */
export function getCodesByCategory(category: string): DTCInfo[] {
  return Object.values(DTC_CODES_DATABASE).filter(
    code => code.category === category
  );
}

/**
 * Search codes by keyword
 */
export function searchCodes(query: string): DTCInfo[] {
  const normalizedQuery = query.toLowerCase();
  return Object.values(DTC_CODES_DATABASE).filter(
    code =>
      code.code.toLowerCase().includes(normalizedQuery) ||
      code.name.toLowerCase().includes(normalizedQuery) ||
      code.description.toLowerCase().includes(normalizedQuery)
  );
}

