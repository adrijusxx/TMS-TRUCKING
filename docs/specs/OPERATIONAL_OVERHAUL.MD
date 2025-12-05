# Operational Overhaul: Technical Specifications
> **Status:** Draft | **Priority:** High
> **Context:** Transformation from "Admin Dashboard" to "Real-Time Carrier Console"

---

## 1. Hybrid Rate Con Parser (Optimistic AI)
**Goal:** Reduce ingestion time from 30s to <3s using a "Draft First" approach.

### 1.1 Architecture
- **Step 1 (Client):** User uploads PDF. UI immediately switches to "Processing" state (Skeleton Loader).
- **Step 2 (Server Action):** `extractRateCon(formData)`
    - **Fast Text:** Use `pdf-parse` to extract raw strings (0.5s).
    - **Fast AI:** Send raw text to `gpt-4o-mini` (or equivalent fast model) with `response_format: { type: "json_object" }`.
    - **Prompt Strategy:** "Extract load details. If unsure, mark as null. Do not hallucinate."
- **Step 3 (Client):** Receive JSON. Populate `LoadForm` with `status="DRAFT"`. User reviews & saves.

### 1.2 Data Schema (Zod)
```typescript
export const RateConSchema = z.object({
  referenceNumbers: z.object({
    rateConNumber: z.string(), // Primary Key for External
    brokerLoadId: z.string().optional(),
    brokerName: z.string(),
  }),
  financials: z.object({
    rate: z.number(),
    currency: z.enum(["USD", "CAD"]),
    detentionRate: z.number().optional(),
  }),
  stops: z.array(z.object({
    sequence: z.number(),
    type: z.enum(["PICKUP", "DELIVERY"]),
    facilityName: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip: z.string(),
    date: z.string(), // ISO String
    timeWindow: z.string().optional(), // "08:00 - 16:00"
  }))
});
2. The "War Room" Map (Clustered)
Goal: Visualize 150+ assets without DOM lag.

2.1 Technology
Library: @googlemaps/markerclusterer + @vis.gl/react-google-maps

Rendering: Client-Side Only (ssr: false).

2.2 The "Lightweight" API
Endpoint: GET /api/map-data Response: Array<MapPoint> (Max 5KB payload)

TypeScript

type MapPoint = {
  id: string;
  type: "TRUCK" | "LOAD" | "DRIVER";
  lat: number;
  lng: number;
  status: "MOVING" | "STOPPED" | "DELAYED";
  heading: number; // 0-360 for icon rotation
  clusterGroup: string; // "NorthEast", "SouthWest" (optional)
};
Constraint: NEVER fetch full load details here. On click -> Open HoverCard -> Fetch details via SWR/React Query.

3. Background Engine (Inngest)
Goal: Offload heavy calculations (Settlements, IFTA) to prevent timeouts.

3.1 Setup
SDK: inngest

Route: app/api/inngest/route.ts

3.2 Functions
generate-settlements

Trigger: Cron 0 12 * * FRI (Weekly) or Manual Button.

Logic:

Fetch all Drivers for target MC.

Sum Load.driverPay.

Subtract Deductions (Fuel, Insurance).

Generate PDF -> Upload to Blob -> Email Driver.

sync-quickbooks

Trigger: Event invoice.approved.

Logic: Push Invoice + Customer payload to QB Online API.

4. Routing Service & IFTA
Goal: True mileage accuracy & automated fuel tax reporting.

4.1 Routing Service (lib/services/routing.ts)
Provider: HERE Maps Truck API (preferred) or Mapbox Matrix.

Action: On Load.save(), calculate route.

Storage: Save polyline (string) and stateMileage (JSON) to Database.

4.2 IFTA Data Model
We do not need a separate "IFTA" table. We aggregate on the fly. Schema Addition:

Code snippet

model RouteLeg {
  id        String   @id @default(cuid())
  loadId    String
  state     String   // "TX", "CA"
  miles     Float    // 450.5
  tollCost  Float?
}
Reporting:

Query: Sum(RouteLeg.miles) GROUP BY state WHERE date in Quarter.

Compare with: Sum(FuelPurchase.gallons) GROUP BY state.

5. PDF Generation Factory
Goal: Pixel-perfect documents generated on the server.

5.1 Technology
Library: @react-pdf/renderer

File Structure: components/pdf/templates/

5.2 Templates
InvoiceTemplate.tsx

Header: Carrier Logo + MC Info.

Body: Load Details + Rate Con #.

Footer: Factoring Notice (Assignment of Claims text).

RateConfirmationTemplate.tsx

Used when we broker a load (future proofing).

SettlementTemplate.tsx

Detailed breakdown of Gross Pay vs Net Pay.

6. Driver PWA (Progressive Web App)
Goal: Mobile app experience without App Store approval.

6.1 Configuration
Manifest: /public/manifest.json (Display: standalone).

Service Worker: next-pwa caching for offline route viewing.

6.2 "Sign-on-Glass"
Library: react-signature-canvas

Flow:

Driver clicks "Complete Delivery".

Modal opens (Landscape mode forced).

Receiver signs.

Convert to Base64 -> Merge onto POD PDF.

Trigger Load.status = DELIVERED.


---

