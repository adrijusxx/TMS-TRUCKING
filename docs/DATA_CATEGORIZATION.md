# Data Categorization by MC Number

Each MC Number has its own isolated data across 5 main categories:

## 1. HR MANAGEMENT 👥

**Purpose**: Manage employees, drivers, and human resources

### Entities:
- **Drivers** (`Driver`)
  - Driver profiles, licenses, certifications
  - Employee status, assignment status
  - Pay rates, tariffs, pay-to information
  - Emergency contacts
  - Performance metrics (rating, total loads, miles, on-time %)
  - HR Manager assignments
  - Driver comments and notes

- **Users/Employees** (`User`)
  - Dispatchers, accountants, admins
  - User roles and permissions
  - MC Number assignments

- **Driver Comments** (`DriverComment`)
  - Notes and comments about drivers

- **HOS Records** (`HOSRecord`)
  - Hours of Service logs
  - Drive time, on-duty, off-duty, sleeper berth

- **Driver Truck History** (`DriverTruckHistory`)
  - Historical truck assignments

- **Driver Trailer History** (`DriverTrailerHistory`)
  - Historical trailer assignments

- **Settlements** (`Settlement`)
  - Driver pay settlements
  - Gross pay, deductions, advances, net pay
  - Settlement periods

- **Driver Tags** (`DriverTag`)
  - Tags for organizing drivers

---

## 2. FLEET MANAGEMENT 🚛

**Purpose**: Manage trucks, trailers, maintenance, and fleet operations

### Entities:
- **Trucks** (`Truck`)
  - Truck details (VIN, make, model, year)
  - Registration, insurance, inspection expiry
  - Status, fleet status
  - Current driver assignments
  - Odometer readings
  - ELD/GPS installation

- **Trailers** (`Trailer`)
  - Trailer details (VIN, make, model, year)
  - Registration, insurance, inspection expiry
  - Assigned truck
  - Operator driver
  - Status, fleet status

- **Maintenance Records** (`MaintenanceRecord`)
  - Scheduled and completed maintenance
  - Maintenance types (oil change, tire rotation, brake service, etc.)
  - Costs, mileage, vendors
  - Invoice numbers

- **Fuel Entries** (`FuelEntry`)
  - Fuel purchases
  - Gallons, cost per gallon, total cost
  - Location, odometer reading
  - Receipt numbers

- **Breakdowns** (`Breakdown`)
  - Vehicle breakdown reports
  - Breakdown types, priority, status
  - Location, reported by, resolved by
  - Associated loads

- **Inspections** (`Inspection`)
  - Vehicle inspections (DOT, state, company)
  - Inspection types, status, results
  - OOS items, severity
  - Next inspection due dates

- **Truck Tags** (`TruckTag`)
  - Tags for organizing trucks

---

## 3. SAFETY 🛡️

**Purpose**: Manage safety incidents, training, and compliance

### Entities:
- **Safety Incidents** (`SafetyIncident`)
  - Accident and incident reports
  - Incident types, severity
  - Location, date, time
  - Injuries, fatalities, vehicle/property damage
  - Investigation status, root cause, corrective actions
  - DOT reportable, police reports
  - Insurance claims, estimated costs

- **Safety Trainings** (`SafetyTraining`)
  - Driver safety training records
  - Training types, names, dates
  - Completion status, expiry dates
  - Providers, instructors, certificates
  - Scores, pass/fail status

- **Inspections** (`Inspection`)
  - Safety inspections (DOT, company)
  - Inspection results and violations
  - OOS (Out of Service) items

---

## 4. ACCOUNTING 💰

**Purpose**: Manage financial transactions, invoices, payments, and accounting

### Entities:
- **Invoices** (`Invoice`)
  - Customer invoices
  - Invoice numbers, dates, due dates
  - Subtotal, tax, total
  - Amount paid, balance
  - Status, reconciliation status
  - Associated loads
  - MC Number

- **Payments** (`Payment`)
  - Customer payments
  - Payment methods (check, wire, ACH, etc.)
  - Payment dates, amounts
  - Reference numbers

- **Invoice Batches** (`InvoiceBatch`)
  - Batches of invoices for posting
  - Batch numbers, post status
  - Total amounts
  - Factoring company information

- **Reconciliations** (`Reconciliation`)
  - Invoice payment reconciliations
  - Reconciled amounts, dates
  - Reconciliation status

- **Settlements** (`Settlement`)
  - Driver pay settlements (also in HR)
  - Settlement numbers, periods
  - Gross pay, deductions, net pay

- **Customers** (`Customer`)
  - Customer billing information
  - Payment terms, credit limits
  - Billing addresses, emails
  - Customer contacts

- **Vendors** (`Vendor`)
  - Vendor/supplier information
  - Payment terms, credit limits
  - Billing information
  - Vendor contacts

- **Expense Categories** (`ExpenseCategory`)
  - Categories for expenses

- **Expense Types** (`ExpenseType`)
  - Types of expenses

- **Tariffs** (`Tariff`)
  - Pricing rules and tariffs
  - Tariff rules

---

## 5. LOAD MANAGEMENT 📦

**Purpose**: Manage loads, shipments, and dispatch operations

### Entities:
- **Loads** (`Load`)
  - Load details and status
  - Load numbers, shipment IDs
  - Pickup and delivery information
  - Customer, driver, truck, trailer assignments
  - Revenue, driver pay, expenses, profit
  - Miles (loaded, empty, total)
  - Status history
  - MC Number

- **Load Stops** (`LoadStop`)
  - Multi-stop load information
  - Stop sequence, type (pickup/delivery)
  - Location, timing, contacts
  - Items, pieces, weight
  - Status, signatures, POD

- **Load Status History** (`LoadStatusHistory`)
  - Historical status changes
  - Status, notes, location, timestamps

- **Routes** (`Route`)
  - Route planning and optimization
  - Distance, estimated time
  - Fuel costs, toll costs
  - Waypoints

- **Customers** (`Customer`)
  - Customer information for loads
  - Customer contacts

- **Locations** (`Location`)
  - Pickup and delivery locations
  - Location details, contacts

- **Load Tags** (`LoadTag`)
  - Tags for organizing loads

---

## MC Number Filtering

All entities listed above should be filtered by MC Number when:
- A specific MC Number is selected → Show only data for that MC
- "All MC Numbers" is selected → Show all data across all MCs

### Entities with Direct MC Number Field:
- Loads (`mcNumber`)
- Customers (`mcNumber`)
- Trucks (`mcNumber`)
- Trailers (`mcNumber`)
- Drivers (`mcNumber`)
- Invoices (`mcNumber`)
- Invoice Batches (`mcNumber`)
- Settlements (`mcNumber`)

### Entities Filtered Indirectly:
- Load Stops → via Load
- Load Status History → via Load
- Routes → via Load
- Payments → via Invoice → via Customer
- Reconciliations → via Invoice
- Invoice Batch Items → via Invoice Batch
- Safety Incidents → via Driver/Truck/Load
- Safety Trainings → via Driver
- Maintenance Records → via Truck
- Fuel Entries → via Truck
- Breakdowns → via Truck
- Inspections → via Truck/Driver
- Documents → via Load/Driver/Truck/etc.
- Driver Comments → via Driver
- HOS Records → via Driver
- Driver Truck/Trailer History → via Driver

---

## 6. SETTINGS ⚙️

**Purpose**: MC-specific configurations and settings

### Entities:
- **Default Configurations** (`DefaultConfiguration`)
  - Category-based default values
  - Categories: "LOAD", "DRIVER", "INVOICE", etc.
  - Key-value pairs for defaults

- **Safety Configurations** (`SafetyConfiguration`)
  - Safety-related settings
  - Categories: "TRAINING", "COMPLIANCE", "INCIDENT"
  - Key-value pairs for safety rules

- **Payment Configurations** (`PaymentConfiguration`)
  - Payment method settings
  - Payment terms and rules

- **Document Templates** (`DocumentTemplate`)
  - Custom document templates
  - BOL, POD, invoices, etc.
  - Template content and variables

- **Report Templates** (`ReportTemplate`)
  - Custom report templates
  - Report types, formats, fields, filters

- **Report Constructors** (`ReportConstructor`)
  - Custom report builders
  - Drag-and-drop layouts
  - Field selections, filters, grouping, sorting

- **Net Profit Formulas** (`NetProfitFormula`)
  - Custom profit calculation formulas
  - Formula expressions and variables

- **Work Order Types** (`WorkOrderType`)
  - Custom work order types
  - Categories, priorities, estimated hours

- **Expense Categories** (`ExpenseCategory`)
  - Expense categorization

- **Expense Types** (`ExpenseType`)
  - Types of expenses

- **Tariffs** (`Tariff`)
  - Pricing rules and tariffs
  - Tariff rules

- **Order Payment Types** (`OrderPaymentType`)
  - Payment type configurations

- **Classifications** (`Classification`)
  - Custom classifications

---

## Implementation Notes

1. **Import**: When importing data, tag it with the currently selected MC Number
2. **Filtering**: Use `buildMcNumberWhereClause()` to filter by MC Number
3. **Settings**: Each MC Number should have its own isolated settings
4. **Views**: Organize UI by these 5 categories + Settings
5. **Navigation**: Create category-based navigation for each MC Number

## Settings Per MC Number

Each MC Number should have its own:
- Default configurations
- Safety configurations
- Payment configurations
- Document templates
- Report templates
- Report constructors
- Net profit formulas
- Work order types
- Expense categories/types
- Tariffs
- Order payment types
- Classifications

This allows different MC Numbers to have different:
- Default values
- Business rules
- Templates
- Formulas
- Workflows

