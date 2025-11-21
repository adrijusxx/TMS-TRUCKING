# Breakdown Management System - Detailed Documentation

## Overview

The Breakdown Management System is the core incident management component of Fleet Management. It treats every breakdown as an urgent event requiring rapid response, clear communication, and systematic resolution.

## Core Principles

1. **Speed First:** Minimize time from report to resolution
2. **Communication:** Keep all stakeholders informed in real-time
3. **Documentation:** Complete audit trail of every action
4. **Prevention:** Learn from each breakdown to prevent future ones
5. **Cost Control:** Track and optimize breakdown expenses

---

## 🚨 Active Breakdowns Dashboard

### Purpose
Real-time dashboard showing all current breakdown situations. This is the **default landing page** for Fleet Management.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Active Breakdowns Dashboard                            │
│  [Last Updated: 2:45 PM] [Auto-refresh: ON]            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Critical: 2  │  │ High: 5      │  │ Medium: 3    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Live Breakdown Map                                 │ │
│  │  [Map showing truck locations with status pins]     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Breakdown List (Sorted by Priority & Time)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL - Truck #3219                          │ │
│  │    Location: I-80, Mile Marker 145, Iowa          │ │
│  │    Issue: Engine won't start                       │ │
│  │    Driver: Mike Johnson                            │ │
│  │    Reported: 2:15 PM (30 min ago)                 │ │
│  │    Status: Tech dispatched - ETA 15 min            │ │
│  │    [Call Driver] [Call Vendor] [View Details]     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 🟡 HIGH - Truck #0170                              │ │
│  │    Location: US-30, Near Des Moines, IA            │ │
│  │    Issue: Flat tire                                │ │
│  │    Driver: Sarah Martinez                          │ │
│  │    Reported: 2:30 PM (15 min ago)                  │ │
│  │    Status: Waiting for tow truck                   │ │
│  │    [Call Driver] [Call Vendor] [View Details]      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Features

#### Real-Time Updates
- Auto-refresh every 30 seconds
- WebSocket push for immediate updates
- Visual indicators for new/updated breakdowns
- Sound alerts for critical breakdowns (optional)

#### Status Indicators
- **🔴 Critical:** Safety hazard, immobilized, high-value load, hazmat
- **🟡 High:** Can limp, but needs immediate attention
- **🟢 Medium:** Non-urgent, can wait for scheduled service

#### Quick Actions (Per Breakdown)
- **Call Driver** - One-click SIP call
- **Text Driver** - SMS template or custom
- **Call Vendor** - Direct vendor contact
- **View Details** - Full breakdown case
- **Escalate** - Move to manager
- **Resolve** - Mark as fixed

#### Filters
- By status (Critical/High/Medium/All)
- By assigned staff member
- By vendor
- By location/region
- By time range

#### Map View
- Interactive map showing all active breakdowns
- Color-coded pins by priority
- Click pin to see breakdown details
- Show nearest vendors on map
- Traffic and weather overlay

---

## 📞 Breakdown Request Form

### Purpose
Quick entry form for logging new breakdowns. Should take under 1 minute to complete.

### Form Fields

#### Auto-Populated (From Communication Channel)
- Driver name and contact info
- Current truck assignment
- GPS location (if available)
- Current load information
- Timestamp of first contact

#### User Input Required
1. **Truck/Trailer Number** (Dropdown with search)
   - Shows: Truck #, Make/Model, Current Driver
   - Auto-fills if driver is known

2. **Problem Description** (Text area + Templates)
   - Common templates:
     - "Won't start"
     - "Flat tire"
     - "Engine light on"
     - "Overheating"
     - "Accident"
     - "Electrical issue"
     - "Brake problem"
     - "Other" (custom)

3. **Urgency Level** (Radio buttons)
   - 🔴 **Immobilized** - Cannot move, blocking traffic
   - 🟡 **Can Limp** - Can drive slowly to safe location
   - 🟢 **Safety Hazard** - Immediate safety concern
   - ⚪ **Non-Urgent** - Can wait for scheduled service

4. **Location** (Auto-fill from GPS or manual)
   - Address or landmark
   - GPS coordinates
   - Nearest mile marker
   - City/State

5. **Load Status** (Important for prioritization)
   - Loaded / Empty
   - Appointment time (if loaded)
   - Customer name
   - Load value

6. **Photos** (Optional but recommended)
   - Upload from driver's phone
   - Multiple photos allowed
   - Auto-attach to case

7. **Additional Notes** (Optional)
   - Free text for extra details

### Form Flow

```
Step 1: Driver Contact
  ↓
Auto-create case with basic info
  ↓
Step 2: Quick Form (1 minute)
  - Select truck
  - Select problem type
  - Set urgency
  - Add location if needed
  - Upload photos if available
  ↓
Step 3: Auto-Assign
  - Route to on-call staff
  - Send notifications
  - Create communication timeline entry
```

### Case Number Format
- Format: `BD-YYYY-XXXX`
- Example: `BD-2024-1234`
- Auto-incrementing
- Unique per company

---

## 🔧 Service Vendor Network

### Vendor Directory

#### Vendor Information
- **Basic Info:**
  - Company name
  - Contact person
  - Phone numbers (primary, mobile, after-hours)
  - Email
  - Address
  - Service area (radius or specific regions)

- **Service Types:**
  - Towing
  - Mobile mechanic
  - Tire service
  - Roadside assistance
  - Fuel delivery
  - Lockout service

- **Specialties:**
  - Heavy-duty trucks
  - Light-duty vehicles
  - Trailers
  - Specific makes/models

- **Availability:**
  - Business hours
  - 24/7 availability
  - After-hours contact method
  - Current status (available, on call, unavailable)

#### Vendor Performance Tracking
- Average response time
- Average resolution time
- Cost per service
- Customer satisfaction rating
- Number of jobs completed
- On-time percentage

#### Preferred Vendors
- Mark vendors as "preferred" by region
- Auto-suggest preferred vendors based on location
- Priority routing for preferred vendors

#### Quick Dispatch
- One-click to call vendor
- One-click to text vendor
- Send breakdown details via SMS/email
- Get ETA from vendor
- Track vendor en route status

---

## 👨‍🔧 Dispatch & Coordination

### Dispatch Board

#### Active Cases View
- List of all active breakdowns
- Assigned staff member
- Current status
- Time elapsed
- Next action needed

#### Assignment
- Assign breakdown to on-call staff
- Reassign if needed
- Escalate to manager
- Auto-assign based on workload

#### Communication Timeline
Every breakdown case shows complete communication history:

```
11/21/24 2:15 PM - Inbound call from Driver Mike (3m 42s)
                   "Won't start, I'm at mile marker 145"
                   
11/21/24 2:18 PM - SMS sent: "Creating your case now"
                   
11/21/24 2:20 PM - Telegram message from Mike: [Photo attached]
                   
11/21/24 2:22 PM - Outbound call to Joe's Towing (1m 15s)
                   "Need tow for Truck 3219 at I-80 MM 145"
                   
11/21/24 2:25 PM - SMS sent: "Tech ETA 45 minutes"
                   
11/21/24 3:10 PM - Telegram from Mike: "Tech arrived"
                   
11/21/24 4:30 PM - Inbound call from Mike (45s) - "All fixed, back on road"
                   
11/21/24 4:31 PM - SMS sent: "Great! Drive safe!"
```

#### Parts Sourcing
- Search for parts by truck make/model
- Find nearest parts supplier
- Order parts and track delivery
- Link parts to breakdown case

#### Rental Truck Coordination
- Check rental truck availability
- Book rental truck
- Coordinate delivery to driver
- Track rental costs

#### Driver Accommodation
- Book hotel if overnight repair
- Arrange transportation
- Meal vouchers if needed
- Track accommodation costs

#### Estimated Downtime Calculator
- Based on problem type
- Based on vendor ETA
- Based on parts availability
- Updates as situation changes

#### Cost Tracking
- Track all expenses:
  - Towing costs
  - Repair costs
  - Parts costs
  - Rental truck costs
  - Hotel costs
  - Meals
- Approval workflow for high-cost items
- Budget alerts

---

## 📍 Breakdown History

### Search & Filter

#### Search Options
- By truck number
- By driver name
- By location
- By date range
- By problem type
- By vendor
- By cost range
- By resolution time

#### Filters
- Status (resolved, in-progress, cancelled)
- Priority level
- Assigned staff
- Vendor used
- Cost range
- Date range

### Analysis Features

#### Recurring Failure Analysis
- Identify trucks with frequent breakdowns
- Same problem recurring on same truck
- Flag high-risk vehicles
- Suggest preventive actions

#### Breakdown Frequency
- Breakdowns per truck
- Breakdowns per driver
- Breakdowns per route
- Time between breakdowns (MTBF)

#### Cost Analysis
- Cost per breakdown
- Cost per truck
- Cost per problem type
- Monthly breakdown spend
- Year-over-year trends

#### Resolution Time Metrics
- Average time to dispatch
- Average time to arrival
- Average time to resolution
- Compare by vendor
- Compare by problem type

#### Root Cause Analysis
- Tag breakdowns with root cause
- Identify patterns
- Generate reports for management
- Suggest preventive measures

### Export
- Export to Excel/CSV
- Generate PDF reports
- Email reports to stakeholders
- Scheduled reports

---

## Integration Points

### With Trucks View
- Show last breakdown date on truck list
- Breakdown frequency score badge
- Quick access to breakdown history
- High-risk vehicle flagging

### With Maintenance
- Link breakdowns to maintenance records
- Identify maintenance gaps
- Schedule follow-up maintenance
- Track warranty repairs

### With Inspections
- Link breakdowns to failed inspections
- Identify inspection gaps
- Flag trucks with inspection issues

### With Communication Hub
- Auto-create cases from communications
- Log all interactions
- Unified timeline view

---

## Database Schema (Proposed)

```prisma
model Breakdown {
  id              String   @id @default(cuid())
  caseNumber      String   @unique // BD-YYYY-XXXX
  truckId         String
  truck           Truck    @relation(fields: [truckId], references: [id])
  trailerId       String?
  trailer         Trailer? @relation(fields: [trailerId], references: [id])
  driverId        String
  driver          Driver   @relation(fields: [driverId], references: [id])
  
  reportedAt      DateTime @default(now())
  reportedBy      String   // Communication channel
  location        String
  gpsLatitude     Float?
  gpsLongitude    Float?
  
  problemType     String
  problemDescription String
  urgencyLevel    UrgencyLevel // CRITICAL, HIGH, MEDIUM, LOW
  
  loadStatus      String?  // Loaded/Empty
  appointmentTime DateTime?
  customerName    String?
  loadValue       Float?
  
  status          BreakdownStatus // REPORTED, DISPATCHED, IN_PROGRESS, RESOLVED, CANCELLED
  assignedTo      String?  // Staff member ID
  vendorId        String?
  vendor          Vendor?   @relation(fields: [vendorId], references: [id])
  
  estimatedArrival DateTime?
  actualArrival    DateTime?
  resolvedAt       DateTime?
  resolutionNotes  String?
  
  totalCost       Float    @default(0)
  
  photos          BreakdownPhoto[]
  communications  Communication[]
  costs           BreakdownCost[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum UrgencyLevel {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum BreakdownStatus {
  REPORTED
  DISPATCHED
  IN_PROGRESS
  RESOLVED
  CANCELLED
}

model BreakdownPhoto {
  id           String    @id @default(cuid())
  breakdownId  String
  breakdown    Breakdown @relation(fields: [breakdownId], references: [id])
  url          String
  uploadedAt   DateTime  @default(now())
}

model BreakdownCost {
  id           String    @id @default(cuid())
  breakdownId  String
  breakdown    Breakdown @relation(fields: [breakdownId], references: [id])
  category     String    // TOWING, REPAIR, PARTS, RENTAL, HOTEL, MEALS
  amount       Float
  vendorId     String?
  vendor       Vendor?   @relation(fields: [vendorId], references: [id])
  description  String?
  approved     Boolean   @default(false)
  approvedBy   String?
  approvedAt   DateTime?
}

model Vendor {
  id              String      @id @default(cuid())
  name            String
  contactPerson   String?
  phone           String
  mobile          String?
  email           String?
  address         String
  serviceArea     String      // JSON array of regions or radius
  serviceTypes    String[]    // TOWING, MOBILE_MECHANIC, etc.
  specialties     String[]    // Heavy-duty, light-duty, etc.
  is24x7          Boolean     @default(false)
  isPreferred     Boolean     @default(false)
  preferredRegions String[]  // Regions where preferred
  
  averageResponseTime Int?    // minutes
  averageCost         Float?
  rating              Float?
  
  breakdowns          Breakdown[]
  costs               BreakdownCost[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

---

## API Endpoints (Proposed)

### Breakdowns
- `GET /api/fleet/breakdowns` - List active breakdowns
- `GET /api/fleet/breakdowns/active` - Active breakdowns dashboard
- `GET /api/fleet/breakdowns/history` - Breakdown history
- `GET /api/fleet/breakdowns/[id]` - Breakdown details
- `POST /api/fleet/breakdowns` - Create new breakdown
- `PATCH /api/fleet/breakdowns/[id]` - Update breakdown
- `POST /api/fleet/breakdowns/[id]/assign` - Assign to staff
- `POST /api/fleet/breakdowns/[id]/dispatch` - Dispatch vendor
- `POST /api/fleet/breakdowns/[id]/resolve` - Mark as resolved
- `POST /api/fleet/breakdowns/[id]/escalate` - Escalate to manager

### Vendors
- `GET /api/fleet/vendors` - List vendors
- `GET /api/fleet/vendors/[id]` - Vendor details
- `POST /api/fleet/vendors` - Create vendor
- `PATCH /api/fleet/vendors/[id]` - Update vendor
- `GET /api/fleet/vendors/nearby` - Find nearby vendors

### Communication
- `GET /api/fleet/breakdowns/[id]/communications` - Communication timeline
- `POST /api/fleet/breakdowns/[id]/call` - Initiate call
- `POST /api/fleet/breakdowns/[id]/sms` - Send SMS
- `POST /api/fleet/breakdowns/[id]/telegram` - Send Telegram message

---

## UI Components Needed

1. **ActiveBreakdownsDashboard** - Main landing page
2. **BreakdownRequestForm** - Quick entry form
3. **BreakdownDetailView** - Full case view
4. **BreakdownTimeline** - Communication timeline
5. **VendorDirectory** - Vendor list and search
6. **DispatchBoard** - Assignment and coordination
7. **BreakdownHistory** - Search and analysis
8. **BreakdownMap** - Live map view
9. **CostTracker** - Expense tracking
10. **VendorSelector** - Quick vendor selection

---

**Last Updated:** December 2024
**Status:** Planning Phase

