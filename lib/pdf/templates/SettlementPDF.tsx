/**
 * Settlement PDF Template
 *
 * Re-exports from the canonical root-level SettlementPDF to avoid duplication.
 * The root version (lib/pdf/SettlementPDF.tsx) is the one used by the PDF API route
 * and includes the full feature set (deduction rules, logo, pickup/delivery dates).
 */

import React from 'react';
import { SettlementPDF } from '../SettlementPDF';

export { SettlementPDF, SettlementPDF as default };

/** Type alias for backwards compatibility with the templates interface */
export type SettlementPDFData = React.ComponentProps<typeof SettlementPDF>;
