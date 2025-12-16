# Load Status State Machine - Visual Diagram

## Current Implementation

```mermaid
stateDiagram-v2
    [*] --> PENDING: Load Created
    
    PENDING --> ASSIGNED: Driver/Truck Assigned
    PENDING --> CANCELLED: Load Cancelled
    
    ASSIGNED --> EN_ROUTE_PICKUP: Driver En Route
    ASSIGNED --> CANCELLED: Load Cancelled
    
    EN_ROUTE_PICKUP --> AT_PICKUP: Arrived at Pickup
    
    AT_PICKUP --> LOADED: Loading Complete
    
    LOADED --> EN_ROUTE_DELIVERY: Driver En Route
    
    EN_ROUTE_DELIVERY --> AT_DELIVERY: Arrived at Delivery
    
    AT_DELIVERY --> DELIVERED: Delivery Complete
    
    DELIVERED --> INVOICED: Invoice Generated
    
    INVOICED --> PAID: Payment Received
    
    PAID --> [*]: Complete
    
    CANCELLED --> [*]: Terminated
```

## Recommended Implementation (With Missing States)

```mermaid
stateDiagram-v2
    [*] --> PENDING: Load Created
    
    PENDING --> ASSIGNED: Driver/Truck Assigned
    PENDING --> CANCELLED: Load Cancelled
    
    ASSIGNED --> EN_ROUTE_PICKUP: Driver En Route
    ASSIGNED --> CANCELLED: Load Cancelled
    
    EN_ROUTE_PICKUP --> AT_PICKUP: Arrived at Pickup
    
    AT_PICKUP --> LOADED: Loading Complete
    note right of AT_PICKUP
        ⏱️ Detention Clock Starts
        (actualArrival recorded)
    end note
    
    LOADED --> EN_ROUTE_DELIVERY: Driver En Route
    note right of LOADED
        ⏱️ Detention Clock Stops
        IF (Departure - Arrival) > 2h
        THEN: 🚨 Alert Dispatch
        Create PENDING Detention Charge
    end note
    
    EN_ROUTE_DELIVERY --> AT_DELIVERY: Arrived at Delivery
    
    AT_DELIVERY --> DELIVERED: Delivery Complete
    
    DELIVERED --> READY_TO_BILL: ✅ Audit Gate Passed
    DELIVERED --> BILLING_HOLD: ⚠️ Accessorial Added
    note right of DELIVERED
        🔍 Audit Gate Checks:
        - POD Present?
        - BOL Present?
        - Weight Match?
        - Rate Con Match?
        
        If Lumper/Detention Added:
        → BILLING_HOLD
        (Rate Con Update Required)
    end note
    
    BILLING_HOLD --> READY_TO_BILL: ✅ Rate Con Updated
    note right of BILLING_HOLD
        🚫 Blocks Invoice Generation
        Triggered When:
        - Lumper receipt uploaded
        - Detention detected
        - Accessorial charge added
        
        Requires Rate Con Update
    end note
    
    READY_TO_BILL --> INVOICED: Invoice Generated
    
    INVOICED --> PAID: Payment Received
    
    PAID --> [*]: Complete
    
    CANCELLED --> [*]: Terminated
```

## Status Transition Matrix

| Current Status | Allowed Next Statuses |
|----------------|----------------------|
| PENDING | ASSIGNED, CANCELLED |
| ASSIGNED | EN_ROUTE_PICKUP, CANCELLED |
| EN_ROUTE_PICKUP | AT_PICKUP |
| AT_PICKUP | LOADED |
| LOADED | EN_ROUTE_DELIVERY |
| EN_ROUTE_DELIVERY | AT_DELIVERY |
| AT_DELIVERY | DELIVERED |
| DELIVERED | READY_TO_BILL, BILLING_HOLD, INVOICED |
| BILLING_HOLD | READY_TO_BILL |
| READY_TO_BILL | INVOICED |
| INVOICED | PAID |
| PAID | (Terminal) |
| CANCELLED | (Terminal) |

## Key Business Rules

### Detention Detection
- **Trigger:** When `LoadStop.actualDeparture` is set
- **Calculation:** `detentionHours = (actualDeparture - actualArrival) - 2 hours free time`
- **Action:** If `detentionHours > 0`:
  - Create `AccessorialCharge` with `status: PENDING`
  - Alert dispatch
  - Set `BILLING_HOLD` if load is `DELIVERED`

### Billing Hold
- **Trigger:** When `AccessorialCharge` of type `LUMPER` or `DETENTION` is created
- **Action:**
  - Change load status to `BILLING_HOLD`
  - Block invoice generation
  - Notify accounting
- **Clear:** When `RateConfirmation` is updated with new total

### Audit Gate
- **Trigger:** When load status changes to `DELIVERED`
- **Checks:**
  - POD document present?
  - BOL document present?
  - Entered weight matches BOL weight?
  - System rate matches Rate Con amount?
- **Pass:** Status → `READY_TO_BILL`
- **Fail:** Status → `BILLING_HOLD` or `REQUIRES_REVIEW`



















