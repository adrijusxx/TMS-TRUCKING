# Database Mapping Audit Report

Generated: 2025-11-23T20:18:32.386Z

## Summary

- Total Files Audited: 286
- Total Issues: 3881
- Errors: 3636
- Warnings: 245

## Issues by File

### app\api\work-order-types\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 61** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 80** [ERROR]: Invalid enum value 'validatedData' for field 'defaultPriority' (WorkOrderPriority)
  - Model: WorkOrderType
  - Field: defaultPriority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

### app\api\vendors\route.ts

- **Line 77** [ERROR]: Relation 'include' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 79** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 79** [ERROR]: Relation 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available relations: Company...

- **Line 80** [ERROR]: Field 'isPrimary' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: isPrimary
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 80** [ERROR]: Relation 'isPrimary' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: isPrimary
  - Suggestion: Available relations: Company...

- **Line 147** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 166** [ERROR]: Relation 'include' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: include
  - Suggestion: Available relations: Company...

### app\api\trucks\route.ts

- **Line 56** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 61** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 105** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 106** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 106** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 110** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 111** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 111** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 135** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 175** [ERROR]: Relation 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 177** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 179** [ERROR]: Relation 'driverNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 180** [ERROR]: Relation 'user' does not exist on model 'Truck'
  - Model: Truck
  - Field: user
  - Suggestion: Available relations: Company, McNumber...

- **Line 181** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 182** [ERROR]: Relation 'firstName' does not exist on model 'Truck'
  - Model: Truck
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber...

- **Line 183** [ERROR]: Relation 'lastName' does not exist on model 'Truck'
  - Model: Truck
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber...

- **Line 218** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 230** [ERROR]: Invalid enum value '401' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 245** [ERROR]: Invalid enum value '403' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 254** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 260** [ERROR]: Field 'success' does not exist on model 'Truck'
  - Model: Truck
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 261** [ERROR]: Field 'error' does not exist on model 'Truck'
  - Model: Truck
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 262** [ERROR]: Field 'code' does not exist on model 'Truck'
  - Model: Truck
  - Field: code
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 263** [ERROR]: Field 'message' does not exist on model 'Truck'
  - Model: Truck
  - Field: message
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 266** [ERROR]: Invalid enum value '409' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 272** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 278** [ERROR]: Field 'success' does not exist on model 'Truck'
  - Model: Truck
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 279** [ERROR]: Field 'error' does not exist on model 'Truck'
  - Model: Truck
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 280** [ERROR]: Field 'code' does not exist on model 'Truck'
  - Model: Truck
  - Field: code
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 281** [ERROR]: Field 'message' does not exist on model 'Truck'
  - Model: Truck
  - Field: message
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 284** [ERROR]: Invalid enum value '409' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 291** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 350** [ERROR]: Invalid enum value '201' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 363** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 373** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\trailers\route.ts

- **Line 42** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 79** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 80** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 80** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 85** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 86** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 86** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 132** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 140** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 172** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 181** [ERROR]: Field 'trailerNumber' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: trailerNumber
  - Suggestion: Did you mean: number?

- **Line 182** [ERROR]: Field 'make' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: make
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 183** [ERROR]: Field 'model' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: model
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 184** [ERROR]: Field 'licensePlate' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: licensePlate
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 185** [ERROR]: Field 'vin' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: vin
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 205** [ERROR]: Relation 'include' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 207** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 209** [ERROR]: Relation 'number' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: number
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 210** [ERROR]: Relation 'companyName' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: companyName
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 214** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 216** [ERROR]: Relation 'truckNumber' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: truckNumber
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 220** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 222** [ERROR]: Relation 'driverNumber' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 223** [ERROR]: Relation 'user' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: user
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 224** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 225** [ERROR]: Relation 'firstName' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 226** [ERROR]: Relation 'lastName' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 261** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 262** [ERROR]: Field 'trailerId' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: trailerId
  - Suggestion: Did you mean: id?

- **Line 276** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 277** [ERROR]: Field 'trailerId' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: trailerId
  - Suggestion: Did you mean: id?

- **Line 313** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 316** [ERROR]: Field 'trailerId' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: trailerId
  - Suggestion: Did you mean: id?

- **Line 329** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 332** [ERROR]: Field 'trailerId' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: trailerId
  - Suggestion: Did you mean: id?

- **Line 488** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 511** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

### app\api\tasks\route.ts

- **Line 52** [ERROR]: Relation 'include' does not exist on model 'Task'
  - Model: Task
  - Field: include
  - Suggestion: Available relations: Project, User...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 57** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 71** [ERROR]: Invalid enum value '500' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 82** [ERROR]: Invalid enum value '401' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 91** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 101** [ERROR]: Invalid enum value '404' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 109** [ERROR]: Invalid enum value 'validatedData' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 110** [ERROR]: Invalid enum value 'validatedData' for field 'priority' (TaskPriority)
  - Model: Task
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 113** [ERROR]: Relation 'include' does not exist on model 'Task'
  - Model: Task
  - Field: include
  - Suggestion: Available relations: Project, User...

- **Line 115** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 118** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 121** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 131** [ERROR]: Invalid enum value '400' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 137** [ERROR]: Invalid enum value '500' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

### app\api\tariffs\route.ts

- **Line 36** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 40** [ERROR]: Relation 'include' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 44** [ERROR]: Relation 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available relations: Company, McNumber...

- **Line 48** [ERROR]: Relation 'error' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: error
  - Suggestion: Available relations: Company, McNumber...

- **Line 69** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 85** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 103** [ERROR]: Relation 'include' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 106** [ERROR]: Relation 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available relations: Company, McNumber...

- **Line 110** [ERROR]: Relation 'error' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: error
  - Suggestion: Available relations: Company, McNumber...

### app\api\tags\route.ts

- **Line 91** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

### app\api\settlements\route.ts

- **Line 41** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 42** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 42** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 46** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 47** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 73** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 81** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 99** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 101** [ERROR]: Field 'driver' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: driver
  - Suggestion: Did you mean: drivers?

- **Line 115** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 117** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 119** [ERROR]: Relation 'driverNumber' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: driverNumber
  - Suggestion: Available relations: Driver, User...

- **Line 120** [ERROR]: Relation 'user' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: user
  - Suggestion: Available relations: Driver, User...

- **Line 121** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 122** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 123** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 158** [ERROR]: Invalid enum value '500' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

### app\api\search\route.ts

- **Line 42** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 52** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 55** [ERROR]: Invalid enum value 'true' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 66** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 75** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 79** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 80** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 81** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 99** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 110** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 118** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

### app\api\safety-configurations\route.ts

- **Line 67** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\report-templates\route.ts

- **Line 44** [ERROR]: Invalid enum value 'asc' for field 'type' (ReportType)
  - Model: ReportTemplate
  - Field: type
  - Suggestion: Valid values: LOADS, DRIVERS, FINANCIAL, SAFETY, MAINTENANCE, CUSTOM

- **Line 72** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Invalid enum value 'validatedData' for field 'type' (ReportType)
  - Model: ReportTemplate
  - Field: type
  - Suggestion: Valid values: LOADS, DRIVERS, FINANCIAL, SAFETY, MAINTENANCE, CUSTOM

- **Line 103** [ERROR]: Invalid enum value 'validatedData' for field 'format' (ReportFormat)
  - Model: ReportTemplate
  - Field: format
  - Suggestion: Valid values: PDF, EXCEL, CSV, HTML

### app\api\report-constructors\route.ts

- **Line 45** [ERROR]: Invalid enum value 'asc' for field 'entityType' (EntityType)
  - Model: ReportConstructor
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

- **Line 73** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 92** [ERROR]: Invalid enum value 'validatedData' for field 'format' (ReportFormat)
  - Model: ReportConstructor
  - Field: format
  - Suggestion: Valid values: PDF, EXCEL, CSV, HTML

### app\api\reconciliation\route.ts

- **Line 42** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 44** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 45** [ERROR]: Relation 'customer' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: customer
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 46** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 48** [ERROR]: Relation 'name' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: name
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 49** [ERROR]: Relation 'customerNumber' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 55** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 56** [ERROR]: Relation 'createdBy' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: createdBy
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 57** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 59** [ERROR]: Relation 'firstName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: firstName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 60** [ERROR]: Relation 'lastName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: lastName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 66** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 68** [ERROR]: Relation 'firstName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: firstName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 69** [ERROR]: Relation 'lastName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: lastName
  - Suggestion: Available relations: Invoice, Payment, User...

### app\api\rate-confirmations\route.ts

- **Line 53** [ERROR]: Relation 'include' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: include
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 55** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 57** [ERROR]: Relation 'loadNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 58** [ERROR]: Relation 'customer' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 60** [ERROR]: Relation 'name' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 61** [ERROR]: Relation 'customerNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customerNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 69** [ERROR]: Relation 'invoiceNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 70** [ERROR]: Relation 'total' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: total
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 74** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 76** [ERROR]: Relation 'firstName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 77** [ERROR]: Relation 'lastName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 81** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 83** [ERROR]: Relation 'fileName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 84** [ERROR]: Relation 'fileUrl' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileUrl
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 155** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 167** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 173** [ERROR]: Field 'where' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 179** [ERROR]: Field 'success' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: success
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 180** [ERROR]: Field 'error' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: error
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 181** [ERROR]: Field 'code' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: code
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 182** [ERROR]: Field 'message' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: message
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 211** [ERROR]: Relation 'include' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: include
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 213** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 215** [ERROR]: Relation 'loadNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 216** [ERROR]: Relation 'customer' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 217** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 218** [ERROR]: Relation 'name' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 224** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 226** [ERROR]: Relation 'fileName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 227** [ERROR]: Relation 'fileUrl' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileUrl
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

### app\api\projects\route.ts

- **Line 45** [ERROR]: Relation 'include' does not exist on model 'Project'
  - Model: Project
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 50** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 56** [ERROR]: Invalid enum value 'asc' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 64** [ERROR]: Invalid enum value '500' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 75** [ERROR]: Invalid enum value '401' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 83** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 93** [ERROR]: Invalid enum value '400' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 102** [ERROR]: Invalid enum value 'validatedData' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 103** [ERROR]: Invalid enum value 'validatedData' for field 'priority' (ProjectPriority)
  - Model: Project
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 107** [ERROR]: Relation 'include' does not exist on model 'Project'
  - Model: Project
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 109** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 112** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 122** [ERROR]: Invalid enum value '400' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 128** [ERROR]: Invalid enum value '500' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

### app\api\payments\route.ts

- **Line 138** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 140** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 141** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 142** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 144** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 145** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 151** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 153** [ERROR]: Relation 'date' does not exist on model 'Payment'
  - Model: Payment
  - Field: date
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 154** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 155** [ERROR]: Relation 'truck' does not exist on model 'Payment'
  - Model: Payment
  - Field: truck
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 156** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 157** [ERROR]: Relation 'truckNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: truckNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 163** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 165** [ERROR]: Relation 'breakdownNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: breakdownNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 166** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 170** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 172** [ERROR]: Relation 'number' does not exist on model 'Payment'
  - Model: Payment
  - Field: number
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 173** [ERROR]: Relation 'companyName' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 177** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 179** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 180** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 262** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 265** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 276** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 284** [ERROR]: Field 'where' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, driverId, driver...

- **Line 287** [ERROR]: Field 'companyId' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 306** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 319** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 327** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 354** [ERROR]: Invalid enum value 'validated' for field 'type' (PaymentType)
  - Model: Payment
  - Field: type
  - Suggestion: Valid values: INVOICE, FUEL, BREAKDOWN, OTHER

- **Line 361** [ERROR]: Invalid enum value 'validated' for field 'paymentMethod' (PaymentMethod)
  - Model: Payment
  - Field: paymentMethod
  - Suggestion: Valid values: CHECK, WIRE, ACH, CREDIT_CARD, CASH, OTHER, FACTOR, QUICK_PAY

- **Line 371** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 373** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 374** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 375** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 377** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 378** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 384** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 386** [ERROR]: Relation 'date' does not exist on model 'Payment'
  - Model: Payment
  - Field: date
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 387** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 391** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 393** [ERROR]: Relation 'breakdownNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: breakdownNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 394** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 398** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 400** [ERROR]: Relation 'number' does not exist on model 'Payment'
  - Model: Payment
  - Field: number
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 401** [ERROR]: Relation 'companyName' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 405** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 407** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 408** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 427** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 428** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 431** [ERROR]: Invalid enum value 'newStatus' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 443** [ERROR]: Invalid enum value '201' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 456** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 466** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\order-payment-types\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 40** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 105** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 116** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 144** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\notifications\route.ts

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Notification'
  - Model: Notification
  - Field: where
  - Suggestion: Available fields: id, userId, type, title, message...

- **Line 76** [ERROR]: Field 'where' does not exist on model 'Notification'
  - Model: Notification
  - Field: where
  - Suggestion: Available fields: id, userId, type, title, message...

- **Line 87** [ERROR]: Field 'where' does not exist on model 'Notification'
  - Model: Notification
  - Field: where
  - Suggestion: Available fields: id, userId, type, title, message...

### app\api\net-profit-formulas\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 60** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 76** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\mc-numbers\route.ts

- **Line 31** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 35** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 50** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 89** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 162** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 171** [ERROR]: Field 'where' does not exist on model 'UserCompany'
  - Model: UserCompany
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 175** [ERROR]: Relation 'include' does not exist on model 'UserCompany'
  - Model: UserCompany
  - Field: include
  - Suggestion: Available relations: User, Company...

- **Line 215** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

### app\api\maintenance\route.ts

- **Line 67** [ERROR]: Relation 'include' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: include
  - Suggestion: Available relations: Truck, Company...

- **Line 69** [ERROR]: Relation 'select' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: select
  - Suggestion: Available relations: Truck, Company...

- **Line 71** [ERROR]: Relation 'truckNumber' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company...

- **Line 72** [ERROR]: Relation 'make' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: make
  - Suggestion: Available relations: Truck, Company...

- **Line 73** [ERROR]: Relation 'model' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: model
  - Suggestion: Available relations: Truck, Company...

- **Line 139** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 149** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 164** [ERROR]: Relation 'include' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: include
  - Suggestion: Available relations: Truck, Company...

- **Line 166** [ERROR]: Relation 'select' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: select
  - Suggestion: Available relations: Truck, Company...

- **Line 168** [ERROR]: Relation 'truckNumber' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company...

- **Line 169** [ERROR]: Relation 'make' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: make
  - Suggestion: Available relations: Truck, Company...

- **Line 170** [ERROR]: Relation 'model' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: model
  - Suggestion: Available relations: Truck, Company...

- **Line 179** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 180** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 192** [ERROR]: Invalid enum value '201' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 205** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 218** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\locations\route.ts

- **Line 150** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 153** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

### app\api\loads\route.ts

- **Line 66** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 67** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 71** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 72** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 72** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 84** [ERROR]: Field 'orConditions' does not exist on model 'User'
  - Model: User
  - Field: orConditions
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 122** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 222** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 225** [ERROR]: Invalid enum value 'true' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 247** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 249** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 250** [ERROR]: Relation 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 254** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 256** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 257** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 258** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 259** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 260** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 266** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 268** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 272** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 274** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 275** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 276** [ERROR]: Relation 'email' does not exist on model 'Load'
  - Model: Load
  - Field: email
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 280** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 282** [ERROR]: Relation 'stopType' does not exist on model 'Load'
  - Model: Load
  - Field: stopType
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 283** [ERROR]: Relation 'sequence' does not exist on model 'Load'
  - Model: Load
  - Field: sequence
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 284** [ERROR]: Relation 'city' does not exist on model 'Load'
  - Model: Load
  - Field: city
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 285** [ERROR]: Relation 'state' does not exist on model 'Load'
  - Model: Load
  - Field: state
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 290** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 291** [ERROR]: Field 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 291** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 293** [ERROR]: Field 'type' does not exist on model 'Load'
  - Model: Load
  - Field: type
  - Suggestion: Did you mean: loadType, equipmentType?

- **Line 293** [ERROR]: Relation 'type' does not exist on model 'Load'
  - Model: Load
  - Field: type
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 294** [ERROR]: Field 'title' does not exist on model 'Load'
  - Model: Load
  - Field: title
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 294** [ERROR]: Relation 'title' does not exist on model 'Load'
  - Model: Load
  - Field: title
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 295** [ERROR]: Field 'fileName' does not exist on model 'Load'
  - Model: Load
  - Field: fileName
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 295** [ERROR]: Relation 'fileName' does not exist on model 'Load'
  - Model: Load
  - Field: fileName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 296** [ERROR]: Field 'fileUrl' does not exist on model 'Load'
  - Model: Load
  - Field: fileUrl
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 296** [ERROR]: Relation 'fileUrl' does not exist on model 'Load'
  - Model: Load
  - Field: fileUrl
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 302** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 329** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 405** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 417** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 432** [ERROR]: Invalid enum value '403' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 441** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 457** [ERROR]: Invalid enum value '409' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 623** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 625** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 627** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 628** [ERROR]: Relation 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 644** [ERROR]: Invalid enum value '201' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 657** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 667** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\invoices\route.ts

- **Line 67** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 68** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 68** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 73** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 74** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 74** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 95** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 96** [ERROR]: Field 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 96** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 111** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 112** [ERROR]: Field 'customerId' does not exist on model 'Customer'
  - Model: Customer
  - Field: customerId
  - Suggestion: Did you mean: id?

- **Line 112** [ERROR]: Relation 'customerId' does not exist on model 'Customer'
  - Model: Customer
  - Field: customerId
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 183** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 185** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 187** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 188** [ERROR]: Relation 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 192** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 194** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 227** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\inventory\route.ts

- **Line 66** [ERROR]: Relation 'include' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: include
  - Suggestion: Available relations: Company, Vendor...

- **Line 68** [ERROR]: Relation 'select' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: select
  - Suggestion: Available relations: Company, Vendor...

- **Line 71** [ERROR]: Relation 'vendorNumber' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber
  - Suggestion: Available relations: Company, Vendor...

- **Line 137** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 157** [ERROR]: Relation 'include' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: include
  - Suggestion: Available relations: Company, Vendor...

- **Line 159** [ERROR]: Relation 'select' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: select
  - Suggestion: Available relations: Company, Vendor...

- **Line 162** [ERROR]: Relation 'vendorNumber' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber
  - Suggestion: Available relations: Company, Vendor...

### app\api\inspections\route.ts

- **Line 94** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 96** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 98** [ERROR]: Relation 'truckNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: truckNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 99** [ERROR]: Relation 'make' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: make
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 100** [ERROR]: Relation 'model' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: model
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 104** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 106** [ERROR]: Relation 'driverNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: driverNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 107** [ERROR]: Relation 'user' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: user
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 108** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 109** [ERROR]: Relation 'firstName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: firstName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 110** [ERROR]: Relation 'lastName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: lastName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 147** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 162** [ERROR]: Invalid enum value '401' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 169** [ERROR]: Invalid enum value '403' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 178** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 188** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 195** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 217** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 219** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 221** [ERROR]: Relation 'truckNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: truckNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 222** [ERROR]: Relation 'make' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: make
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 223** [ERROR]: Relation 'model' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: model
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 227** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 229** [ERROR]: Relation 'driverNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: driverNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 230** [ERROR]: Relation 'user' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: user
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 231** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 232** [ERROR]: Relation 'firstName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: firstName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 233** [ERROR]: Relation 'lastName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: lastName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 246** [ERROR]: Invalid enum value '201' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 259** [ERROR]: Invalid enum value '400' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 272** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

### app\api\fleet-board\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 43** [ERROR]: Relation 'driverNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 44** [ERROR]: Relation 'user' does not exist on model 'Truck'
  - Model: Truck
  - Field: user
  - Suggestion: Available relations: Company, McNumber...

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 46** [ERROR]: Relation 'firstName' does not exist on model 'Truck'
  - Model: Truck
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber...

- **Line 47** [ERROR]: Relation 'lastName' does not exist on model 'Truck'
  - Model: Truck
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber...

- **Line 53** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 62** [ERROR]: Relation 'loadNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: loadNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 63** [ERROR]: Invalid enum value 'true' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 64** [ERROR]: Relation 'pickupCity' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupCity
  - Suggestion: Available relations: Company, McNumber...

- **Line 65** [ERROR]: Relation 'pickupState' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupState
  - Suggestion: Available relations: Company, McNumber...

- **Line 66** [ERROR]: Relation 'deliveryCity' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveryCity
  - Suggestion: Available relations: Company, McNumber...

- **Line 67** [ERROR]: Relation 'deliveryState' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveryState
  - Suggestion: Available relations: Company, McNumber...

- **Line 68** [ERROR]: Relation 'pickupDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupDate
  - Suggestion: Available relations: Company, McNumber...

- **Line 69** [ERROR]: Relation 'deliveryDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveryDate
  - Suggestion: Available relations: Company, McNumber...

- **Line 73** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 74** [ERROR]: Field 'completedDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: completedDate
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 75** [ERROR]: Field 'scheduledDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: scheduledDate
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 118** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\factoring-companies\route.ts

- **Line 17** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

### app\api\expense-types\route.ts

- **Line 42** [ERROR]: Relation 'include' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 43** [ERROR]: Relation 'orderBy' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: orderBy
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 46** [ERROR]: Relation 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 50** [ERROR]: Relation 'error' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: error
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 71** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 93** [ERROR]: Relation 'include' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 96** [ERROR]: Relation 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 100** [ERROR]: Relation 'error' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: error
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

### app\api\expense-categories\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 32** [ERROR]: Relation 'include' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 39** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 43** [ERROR]: Relation 'include' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 115** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\dynamic-statuses\route.ts

- **Line 45** [ERROR]: Invalid enum value 'asc' for field 'entityType' (EntityType)
  - Model: DynamicStatus
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

- **Line 73** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 75** [ERROR]: Invalid enum value 'validatedData' for field 'entityType' (EntityType)
  - Model: DynamicStatus
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

- **Line 90** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 92** [ERROR]: Invalid enum value 'validatedData' for field 'entityType' (EntityType)
  - Model: DynamicStatus
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

### app\api\drivers\route.ts

- **Line 62** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 66** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 76** [ERROR]: Relation 'user' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: user
  - Suggestion: Available relations: Company...

- **Line 84** [ERROR]: Relation 'mcNumber' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: mcNumber
  - Suggestion: Available relations: Company...

- **Line 172** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 181** [ERROR]: Invalid enum value 'true' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 182** [ERROR]: Invalid enum value 'true' for field 'employeeStatus' (EmployeeStatus)
  - Model: Driver
  - Field: employeeStatus
  - Suggestion: Valid values: ACTIVE, TERMINATED, APPLICANT

- **Line 183** [ERROR]: Invalid enum value 'true' for field 'assignmentStatus' (AssignmentStatus)
  - Model: Driver
  - Field: assignmentStatus
  - Suggestion: Valid values: READY_TO_GO, NOT_READY, TERMINATED

- **Line 184** [ERROR]: Invalid enum value 'true' for field 'dispatchStatus' (DispatchStatus)
  - Model: Driver
  - Field: dispatchStatus
  - Suggestion: Valid values: DISPATCHED, ENROUTE, TERMINATION, REST, AVAILABLE

- **Line 185** [ERROR]: Invalid enum value 'true' for field 'driverType' (DriverType)
  - Model: Driver
  - Field: driverType
  - Suggestion: Valid values: COMPANY_DRIVER, LEASE, OWNER_OPERATOR

- **Line 187** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 189** [ERROR]: Relation 'number' does not exist on model 'Driver'
  - Model: Driver
  - Field: number
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 203** [ERROR]: Invalid enum value 'true' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 211** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 213** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 218** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 220** [ERROR]: Relation 'trailerNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: trailerNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 224** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 225** [ERROR]: Relation 'revenue' does not exist on model 'Driver'
  - Model: Driver
  - Field: revenue
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 226** [ERROR]: Relation 'driverPay' does not exist on model 'Driver'
  - Model: Driver
  - Field: driverPay
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 228** [ERROR]: Relation 'loadedMiles' does not exist on model 'Driver'
  - Model: Driver
  - Field: loadedMiles
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 229** [ERROR]: Relation 'emptyMiles' does not exist on model 'Driver'
  - Model: Driver
  - Field: emptyMiles
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 230** [ERROR]: Relation 'serviceFee' does not exist on model 'Driver'
  - Model: Driver
  - Field: serviceFee
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 235** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 237** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 238** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 239** [ERROR]: Relation 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 240** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 254** [ERROR]: Invalid enum value 'driver' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 294** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 306** [ERROR]: Invalid enum value '401' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 321** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 330** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 336** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 337** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 338** [ERROR]: Field 'code' does not exist on model 'User'
  - Model: User
  - Field: code
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 339** [ERROR]: Field 'message' does not exist on model 'User'
  - Model: User
  - Field: message
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 348** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 354** [ERROR]: Field 'success' does not exist on model 'Driver'
  - Model: Driver
  - Field: success
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 355** [ERROR]: Field 'error' does not exist on model 'Driver'
  - Model: Driver
  - Field: error
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 356** [ERROR]: Field 'code' does not exist on model 'Driver'
  - Model: Driver
  - Field: code
  - Suggestion: Did you mean: zipCode?

- **Line 357** [ERROR]: Field 'message' does not exist on model 'Driver'
  - Model: Driver
  - Field: message
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 360** [ERROR]: Invalid enum value '409' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 367** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 440** [ERROR]: Invalid enum value 'validated' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 448** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 450** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 452** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 453** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 454** [ERROR]: Relation 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 455** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 466** [ERROR]: Invalid enum value '201' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 479** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 489** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\documents\route.ts

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Document'
  - Model: Document
  - Field: include
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Document'
  - Model: Document
  - Field: select
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 42** [ERROR]: Relation 'loadNumber' does not exist on model 'Document'
  - Model: Document
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

### app\api\document-templates\route.ts

- **Line 42** [ERROR]: Invalid enum value 'asc' for field 'type' (DocumentType)
  - Model: DocumentTemplate
  - Field: type
  - Suggestion: Valid values: BOL // Bill of Lading, POD // Proof of Delivery, INVOICE, RATE_CONFIRMATION, DRIVER_LICENSE, MEDICAL_CARD, INSURANCE, REGISTRATION, INSPECTION, LEASE_AGREEMENT, W9, COI // Certificate of Insurance, OTHER

- **Line 70** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 86** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 88** [ERROR]: Invalid enum value 'validatedData' for field 'type' (DocumentType)
  - Model: DocumentTemplate
  - Field: type
  - Suggestion: Valid values: BOL // Bill of Lading, POD // Proof of Delivery, INVOICE, RATE_CONFIRMATION, DRIVER_LICENSE, MEDICAL_CARD, INSURANCE, REGISTRATION, INSPECTION, LEASE_AGREEMENT, W9, COI // Certificate of Insurance, OTHER

### app\api\default-configurations\route.ts

- **Line 67** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\customers\route.ts

- **Line 59** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 60** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 64** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 65** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 65** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 77** [ERROR]: Field 'orConditions' does not exist on model 'User'
  - Model: User
  - Field: orConditions
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 106** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 159** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 163** [ERROR]: Invalid enum value 'true' for field 'type' (CustomerType)
  - Model: Customer
  - Field: type
  - Suggestion: Valid values: DIRECT, BROKER, FREIGHT_FORWARDER, THIRD_PARTY_LOGISTICS

- **Line 260** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 266** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 267** [ERROR]: Field 'error' does not exist on model 'Customer'
  - Model: Customer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 268** [ERROR]: Field 'code' does not exist on model 'Customer'
  - Model: Customer
  - Field: code
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 269** [ERROR]: Field 'message' does not exist on model 'Customer'
  - Model: Customer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 311** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 317** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 318** [ERROR]: Field 'error' does not exist on model 'Customer'
  - Model: Customer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 319** [ERROR]: Field 'code' does not exist on model 'Customer'
  - Model: Customer
  - Field: code
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 320** [ERROR]: Field 'message' does not exist on model 'Customer'
  - Model: Customer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

### app\api\companies\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 22** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 22** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 25** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 50** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 89** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 89** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

### app\api\classifications\route.ts

- **Line 48** [ERROR]: Relation 'include' does not exist on model 'Classification'
  - Model: Classification
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 49** [ERROR]: Invalid enum value 'asc' for field 'type' (ClassificationType)
  - Model: Classification
  - Field: type
  - Suggestion: Valid values: EQUIPMENT, COMMODITY, SERVICE_TYPE, CUSTOMER_SEGMENT, COST_CENTER, CUSTOM

- **Line 52** [ERROR]: Relation 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 56** [ERROR]: Relation 'error' does not exist on model 'Classification'
  - Model: Classification
  - Field: error
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 77** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 79** [ERROR]: Invalid enum value 'validatedData' for field 'type' (ClassificationType)
  - Model: Classification
  - Field: type
  - Suggestion: Valid values: EQUIPMENT, COMMODITY, SERVICE_TYPE, CUSTOMER_SEGMENT, COST_CENTER, CUSTOM

- **Line 99** [ERROR]: Relation 'include' does not exist on model 'Classification'
  - Model: Classification
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 102** [ERROR]: Relation 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 106** [ERROR]: Relation 'error' does not exist on model 'Classification'
  - Model: Classification
  - Field: error
  - Suggestion: Available relations: Company, McNumber, Classification...

### app\api\breakdowns\route.ts

- **Line 111** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 113** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 115** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 116** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 117** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 121** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 123** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 127** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 129** [ERROR]: Relation 'user' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: user
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 130** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 131** [ERROR]: Relation 'firstName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: firstName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 132** [ERROR]: Relation 'lastName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: lastName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 138** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 140** [ERROR]: Relation 'number' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: number
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 141** [ERROR]: Relation 'companyName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: companyName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 145** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 147** [ERROR]: Relation 'paymentNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 148** [ERROR]: Relation 'amount' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: amount
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 149** [ERROR]: Relation 'paymentDate' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentDate
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 150** [ERROR]: Relation 'paymentMethod' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentMethod
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 151** [ERROR]: Relation 'type' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: type
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 186** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 201** [ERROR]: Invalid enum value '401' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 208** [ERROR]: Invalid enum value '403' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 218** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 274** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 276** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 278** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 279** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 280** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 284** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 286** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 290** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 292** [ERROR]: Relation 'user' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: user
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 293** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 294** [ERROR]: Relation 'firstName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: firstName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 295** [ERROR]: Relation 'lastName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: lastName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 301** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 303** [ERROR]: Relation 'number' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: number
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 304** [ERROR]: Relation 'companyName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: companyName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 308** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 310** [ERROR]: Relation 'paymentNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 311** [ERROR]: Relation 'amount' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: amount
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 312** [ERROR]: Relation 'paymentDate' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentDate
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 313** [ERROR]: Relation 'paymentMethod' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentMethod
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 314** [ERROR]: Relation 'type' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: type
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 325** [ERROR]: Invalid enum value '201' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 338** [ERROR]: Invalid enum value '400' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 351** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\batches\route.ts

- **Line 51** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 55** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 56** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 60** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 61** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 62** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 63** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 64** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 66** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 134** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 137** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 140** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 154** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 160** [ERROR]: Field 'where' does not exist on model 'InvoiceBatchItem'
  - Model: InvoiceBatchItem
  - Field: where
  - Suggestion: Available fields: id, batchId, batch, invoiceId, invoice...

- **Line 202** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 204** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 206** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 207** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 211** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 212** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 213** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 214** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 215** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 217** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

### app\api\advances\route.ts

- **Line 44** [ERROR]: Relation 'include' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: include
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 46** [ERROR]: Relation 'include' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: include
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 47** [ERROR]: Relation 'user' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: user
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: select
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 49** [ERROR]: Relation 'firstName' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: firstName
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 50** [ERROR]: Relation 'lastName' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: lastName
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 56** [ERROR]: Relation 'select' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: select
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 57** [ERROR]: Relation 'firstName' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: firstName
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 58** [ERROR]: Relation 'lastName' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: lastName
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 62** [ERROR]: Relation 'select' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: select
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 63** [ERROR]: Relation 'loadNumber' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: loadNumber
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: select
  - Suggestion: Available relations: Driver, User, Load, Settlement...

- **Line 68** [ERROR]: Relation 'settlementNumber' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: settlementNumber
  - Suggestion: Available relations: Driver, User, Load, Settlement...

### app\api\accessorial-charges\route.ts

- **Line 57** [ERROR]: Relation 'include' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: include
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 61** [ERROR]: Relation 'loadNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 62** [ERROR]: Relation 'customer' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 63** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 64** [ERROR]: Relation 'name' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 65** [ERROR]: Relation 'customerNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customerNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 71** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 73** [ERROR]: Relation 'invoiceNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 77** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 79** [ERROR]: Relation 'firstName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 80** [ERROR]: Relation 'lastName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 108** [ERROR]: Invalid enum value '500' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 120** [ERROR]: Invalid enum value '401' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 148** [ERROR]: Invalid enum value '400' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 154** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 166** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 192** [ERROR]: Invalid enum value 'AccessorialChargeStatus' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 194** [ERROR]: Relation 'include' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: include
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 196** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 198** [ERROR]: Relation 'loadNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 199** [ERROR]: Relation 'customer' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 200** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 201** [ERROR]: Relation 'name' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 220** [ERROR]: Invalid enum value '500' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

### app\api\work-order-types\[id]\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 73** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 89** [ERROR]: Field 'data' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 92** [ERROR]: Field 'success' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 96** [ERROR]: Field 'success' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 97** [ERROR]: Field 'status' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 122** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 137** [ERROR]: Field 'where' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 138** [ERROR]: Field 'data' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 141** [ERROR]: Field 'success' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 143** [ERROR]: Field 'error' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 145** [ERROR]: Field 'success' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 146** [ERROR]: Field 'status' does not exist on model 'WorkOrderType'
  - Model: WorkOrderType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\vendors\[id]\route.ts

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 57** [ERROR]: Relation 'include' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 116** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 131** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 132** [ERROR]: Field 'data' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: data
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 133** [ERROR]: Field 'include' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: include
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 133** [ERROR]: Relation 'include' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 193** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 208** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 209** [ERROR]: Field 'data' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: data
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 213** [ERROR]: Field 'success' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 214** [ERROR]: Field 'message' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: message
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 216** [ERROR]: Field 'error' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: error
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 217** [ERROR]: Field 'vendor' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: vendor
  - Suggestion: Did you mean: vendorNumber?

- **Line 220** [ERROR]: Field 'success' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 221** [ERROR]: Field 'error' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: error
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 222** [ERROR]: Field 'code' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: code
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 223** [ERROR]: Field 'message' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: message
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

### app\api\trucks\[id]\route.ts

- **Line 24** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 29** [ERROR]: Relation 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 31** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 33** [ERROR]: Relation 'driverNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 34** [ERROR]: Relation 'user' does not exist on model 'Truck'
  - Model: Truck
  - Field: user
  - Suggestion: Available relations: Company, McNumber...

- **Line 35** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 36** [ERROR]: Relation 'firstName' does not exist on model 'Truck'
  - Model: Truck
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber...

- **Line 37** [ERROR]: Relation 'lastName' does not exist on model 'Truck'
  - Model: Truck
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber...

- **Line 38** [ERROR]: Relation 'email' does not exist on model 'Truck'
  - Model: Truck
  - Field: email
  - Suggestion: Available relations: Company, McNumber...

- **Line 39** [ERROR]: Relation 'phone' does not exist on model 'Truck'
  - Model: Truck
  - Field: phone
  - Suggestion: Available relations: Company, McNumber...

- **Line 45** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 53** [ERROR]: Relation 'loadNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: loadNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 54** [ERROR]: Invalid enum value 'true' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 55** [ERROR]: Relation 'pickupCity' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupCity
  - Suggestion: Available relations: Company, McNumber...

- **Line 56** [ERROR]: Relation 'pickupState' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupState
  - Suggestion: Available relations: Company, McNumber...

- **Line 57** [ERROR]: Relation 'deliveryCity' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveryCity
  - Suggestion: Available relations: Company, McNumber...

- **Line 58** [ERROR]: Relation 'deliveryState' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveryState
  - Suggestion: Available relations: Company, McNumber...

- **Line 76** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 91** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 106** [ERROR]: Invalid enum value '401' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 112** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 125** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 140** [ERROR]: Invalid enum value '403' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 167** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 168** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 169** [ERROR]: Field 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 169** [ERROR]: Relation 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 171** [ERROR]: Field 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 171** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 173** [ERROR]: Field 'driverNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: driverNumber
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 173** [ERROR]: Relation 'driverNumber' does not exist on model 'Truck'
  - Model: Truck
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber...

- **Line 174** [ERROR]: Field 'user' does not exist on model 'Truck'
  - Model: Truck
  - Field: user
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 174** [ERROR]: Relation 'user' does not exist on model 'Truck'
  - Model: Truck
  - Field: user
  - Suggestion: Available relations: Company, McNumber...

- **Line 175** [ERROR]: Field 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 175** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 176** [ERROR]: Field 'firstName' does not exist on model 'Truck'
  - Model: Truck
  - Field: firstName
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 176** [ERROR]: Relation 'firstName' does not exist on model 'Truck'
  - Model: Truck
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber...

- **Line 177** [ERROR]: Field 'lastName' does not exist on model 'Truck'
  - Model: Truck
  - Field: lastName
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 177** [ERROR]: Relation 'lastName' does not exist on model 'Truck'
  - Model: Truck
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber...

- **Line 200** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 210** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 225** [ERROR]: Invalid enum value '401' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 231** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 244** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 259** [ERROR]: Invalid enum value '403' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 265** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 266** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 270** [ERROR]: Field 'success' does not exist on model 'Truck'
  - Model: Truck
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 271** [ERROR]: Field 'message' does not exist on model 'Truck'
  - Model: Truck
  - Field: message
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 274** [ERROR]: Field 'error' does not exist on model 'Truck'
  - Model: Truck
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 277** [ERROR]: Field 'success' does not exist on model 'Truck'
  - Model: Truck
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 278** [ERROR]: Field 'error' does not exist on model 'Truck'
  - Model: Truck
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 280** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\trucks\stats\route.ts

- **Line 48** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 54** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 60** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 83** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\trailers\[id]\route.ts

- **Line 46** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 51** [ERROR]: Relation 'include' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 55** [ERROR]: Relation 'truckNumber' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: truckNumber
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 61** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 63** [ERROR]: Relation 'driverNumber' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: driverNumber
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 64** [ERROR]: Relation 'user' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: user
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 65** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 66** [ERROR]: Relation 'firstName' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: firstName
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 67** [ERROR]: Relation 'lastName' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: lastName
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 68** [ERROR]: Relation 'email' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: email
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 69** [ERROR]: Relation 'phone' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: phone
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 75** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 81** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 83** [ERROR]: Relation 'loadNumber' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: loadNumber
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 85** [ERROR]: Relation 'pickupCity' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: pickupCity
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 86** [ERROR]: Relation 'pickupState' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: pickupState
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 87** [ERROR]: Relation 'deliveryCity' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: deliveryCity
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 88** [ERROR]: Relation 'deliveryState' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: deliveryState
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 153** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 192** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 193** [ERROR]: Field 'data' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 197** [ERROR]: Field 'success' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 198** [ERROR]: Field 'data' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 204** [ERROR]: Field 'success' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 205** [ERROR]: Field 'error' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 206** [ERROR]: Field 'code' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: code
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 207** [ERROR]: Field 'message' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 208** [ERROR]: Field 'details' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: details
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 257** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 276** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 297** [ERROR]: Invalid enum value '409' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 303** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 304** [ERROR]: Field 'data' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 308** [ERROR]: Field 'success' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 309** [ERROR]: Field 'message' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 311** [ERROR]: Field 'error' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 312** [ERROR]: Field 'error' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 315** [ERROR]: Field 'success' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 316** [ERROR]: Field 'error' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 317** [ERROR]: Field 'code' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: code
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 318** [ERROR]: Field 'message' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

### app\api\trailers\bulk\route.ts

- **Line 46** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 61** [ERROR]: Relation 'error' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: error
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 72** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 82** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 114** [ERROR]: Invalid enum value '409' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 120** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

### app\api\tasks\[id]\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Task'
  - Model: Task
  - Field: where
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 35** [ERROR]: Field 'companyId' does not exist on model 'Task'
  - Model: Task
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Task'
  - Model: Task
  - Field: include
  - Suggestion: Available relations: Project, User...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 44** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 55** [ERROR]: Invalid enum value '404' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 64** [ERROR]: Invalid enum value '500' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 77** [ERROR]: Invalid enum value '401' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 85** [ERROR]: Field 'where' does not exist on model 'Task'
  - Model: Task
  - Field: where
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 88** [ERROR]: Field 'companyId' does not exist on model 'Task'
  - Model: Task
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 97** [ERROR]: Invalid enum value '404' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 112** [ERROR]: Field 'where' does not exist on model 'Task'
  - Model: Task
  - Field: where
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 113** [ERROR]: Field 'data' does not exist on model 'Task'
  - Model: Task
  - Field: data
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 114** [ERROR]: Field 'include' does not exist on model 'Task'
  - Model: Task
  - Field: include
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 114** [ERROR]: Relation 'include' does not exist on model 'Task'
  - Model: Task
  - Field: include
  - Suggestion: Available relations: Project, User...

- **Line 116** [ERROR]: Field 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 116** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 119** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 122** [ERROR]: Relation 'select' does not exist on model 'Task'
  - Model: Task
  - Field: select
  - Suggestion: Available relations: Project, User...

- **Line 132** [ERROR]: Invalid enum value '400' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 138** [ERROR]: Invalid enum value '500' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 151** [ERROR]: Invalid enum value '401' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 156** [ERROR]: Field 'where' does not exist on model 'Task'
  - Model: Task
  - Field: where
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 159** [ERROR]: Field 'companyId' does not exist on model 'Task'
  - Model: Task
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 168** [ERROR]: Invalid enum value '404' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

- **Line 173** [ERROR]: Field 'where' does not exist on model 'Task'
  - Model: Task
  - Field: where
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 174** [ERROR]: Field 'data' does not exist on model 'Task'
  - Model: Task
  - Field: data
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 177** [ERROR]: Field 'success' does not exist on model 'Task'
  - Model: Task
  - Field: success
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 179** [ERROR]: Field 'error' does not exist on model 'Task'
  - Model: Task
  - Field: error
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 181** [ERROR]: Field 'success' does not exist on model 'Task'
  - Model: Task
  - Field: success
  - Suggestion: Available fields: id, projectId, project, name, description...

- **Line 182** [ERROR]: Invalid enum value '500' for field 'status' (TaskStatus)
  - Model: Task
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

### app\api\tariffs\[id]\route.ts

- **Line 39** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 44** [ERROR]: Relation 'include' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 49** [ERROR]: Relation 'error' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: error
  - Suggestion: Available relations: Company, McNumber...

- **Line 81** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 97** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 116** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 117** [ERROR]: Field 'data' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 118** [ERROR]: Field 'include' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: include
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 118** [ERROR]: Relation 'include' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 121** [ERROR]: Field 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 121** [ERROR]: Relation 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available relations: Company, McNumber...

- **Line 125** [ERROR]: Field 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 125** [ERROR]: Relation 'error' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: error
  - Suggestion: Available relations: Company, McNumber...

- **Line 126** [ERROR]: Field 'status' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 151** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 166** [ERROR]: Field 'where' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 167** [ERROR]: Field 'data' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 170** [ERROR]: Field 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 172** [ERROR]: Field 'error' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 174** [ERROR]: Field 'success' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 175** [ERROR]: Field 'status' does not exist on model 'Tariff'
  - Model: Tariff
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\tags\[id]\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 67** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 83** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 100** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 101** [ERROR]: Field 'data' does not exist on model 'Tag'
  - Model: Tag
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 104** [ERROR]: Field 'success' does not exist on model 'Tag'
  - Model: Tag
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 108** [ERROR]: Field 'success' does not exist on model 'Tag'
  - Model: Tag
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 109** [ERROR]: Field 'status' does not exist on model 'Tag'
  - Model: Tag
  - Field: status
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 133** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 148** [ERROR]: Field 'where' does not exist on model 'Tag'
  - Model: Tag
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 149** [ERROR]: Field 'data' does not exist on model 'Tag'
  - Model: Tag
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 152** [ERROR]: Field 'success' does not exist on model 'Tag'
  - Model: Tag
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 154** [ERROR]: Field 'error' does not exist on model 'Tag'
  - Model: Tag
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 156** [ERROR]: Field 'success' does not exist on model 'Tag'
  - Model: Tag
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, color...

- **Line 157** [ERROR]: Field 'status' does not exist on model 'Tag'
  - Model: Tag
  - Field: status
  - Suggestion: Available fields: id, companyId, company, name, color...

### app\api\settlements\[id]\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 31** [ERROR]: Field 'companyId' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 36** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 38** [ERROR]: Relation 'driverNumber' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: driverNumber
  - Suggestion: Available relations: Driver, User...

- **Line 39** [ERROR]: Relation 'user' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: user
  - Suggestion: Available relations: Driver, User...

- **Line 40** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 41** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 42** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 43** [ERROR]: Relation 'email' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: email
  - Suggestion: Available relations: Driver, User...

- **Line 59** [ERROR]: Invalid enum value '404' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 65** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 68** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 79** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 80** [ERROR]: Relation 'totalDistance' does not exist on model 'Load'
  - Model: Load
  - Field: totalDistance
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 101** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 116** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 123** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 126** [ERROR]: Field 'companyId' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 137** [ERROR]: Invalid enum value '404' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 154** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 155** [ERROR]: Field 'data' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: data
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 159** [ERROR]: Field 'success' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: success
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 160** [ERROR]: Field 'data' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: data
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 166** [ERROR]: Field 'success' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: success
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 167** [ERROR]: Field 'error' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: error
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 168** [ERROR]: Field 'code' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: code
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 169** [ERROR]: Field 'message' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: message
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 170** [ERROR]: Field 'details' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: details
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 173** [ERROR]: Invalid enum value '400' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 183** [ERROR]: Invalid enum value '500' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

### app\api\settlements\generate-auto\route.ts

- **Line 49** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 110** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 122** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\settlements\pending-approval\route.ts

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 36** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 37** [ERROR]: Relation 'user' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: user
  - Suggestion: Available relations: Driver, User...

- **Line 38** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 39** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 40** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 92** [ERROR]: Invalid enum value '500' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

### app\api\settlements\generate\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 40** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 41** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 42** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 54** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 60** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 77** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 159** [ERROR]: Invalid enum value '201' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 172** [ERROR]: Invalid enum value '400' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 182** [ERROR]: Invalid enum value '500' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

### app\api\settings\users\route.ts

- **Line 113** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 119** [ERROR]: Invalid enum value 'true' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

- **Line 125** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 127** [ERROR]: Relation 'number' does not exist on model 'User'
  - Model: User
  - Field: number
  - Suggestion: Available relations: Company, McNumber...

- **Line 128** [ERROR]: Relation 'companyName' does not exist on model 'User'
  - Model: User
  - Field: companyName
  - Suggestion: Available relations: Company, McNumber...

- **Line 132** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 186** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 192** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 193** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 194** [ERROR]: Field 'code' does not exist on model 'User'
  - Model: User
  - Field: code
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 195** [ERROR]: Field 'message' does not exist on model 'User'
  - Model: User
  - Field: message
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 205** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 254** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 260** [ERROR]: Invalid enum value 'true' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

- **Line 265** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 267** [ERROR]: Relation 'number' does not exist on model 'User'
  - Model: User
  - Field: number
  - Suggestion: Available relations: Company, McNumber...

- **Line 268** [ERROR]: Relation 'companyName' does not exist on model 'User'
  - Model: User
  - Field: companyName
  - Suggestion: Available relations: Company, McNumber...

### app\api\settings\security\route.ts

- **Line 38** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 100** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 113** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 114** [ERROR]: Field 'data' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: data
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

### app\api\settings\notifications\route.ts

- **Line 49** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 122** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 135** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 136** [ERROR]: Field 'data' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: data
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

### app\api\settings\general\route.ts

- **Line 41** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 106** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 119** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 120** [ERROR]: Field 'data' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: data
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

### app\api\settings\custom-fields\route.ts

- **Line 88** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 91** [ERROR]: Invalid enum value 'validated' for field 'entityType' (CustomFieldEntityType)
  - Model: CustomField
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, CUSTOMER, TRUCK, TRAILER, INVOICE

- **Line 110** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 112** [ERROR]: Invalid enum value 'validated' for field 'entityType' (CustomFieldEntityType)
  - Model: CustomField
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, CUSTOMER, TRUCK, TRAILER, INVOICE

- **Line 122** [ERROR]: Invalid enum value 'validated' for field 'type' (CustomFieldType)
  - Model: CustomField
  - Field: type
  - Suggestion: Valid values: TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA, EMAIL, PHONE, URL

- **Line 123** [ERROR]: Invalid enum value 'validated' for field 'entityType' (CustomFieldEntityType)
  - Model: CustomField
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, CUSTOMER, TRUCK, TRAILER, INVOICE

### app\api\settings\company\route.ts

- **Line 31** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 32** [ERROR]: Field 'select' does not exist on model 'Company'
  - Model: Company
  - Field: select
  - Suggestion: Did you mean: randomSelections?

- **Line 32** [ERROR]: Relation 'select' does not exist on model 'Company'
  - Model: Company
  - Field: select
  - Suggestion: Available relations: ...

- **Line 103** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 104** [ERROR]: Field 'data' does not exist on model 'Company'
  - Model: Company
  - Field: data
  - Suggestion: Did you mean: dataQSubmissions?

- **Line 108** [ERROR]: Field 'success' does not exist on model 'Company'
  - Model: Company
  - Field: success
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 109** [ERROR]: Field 'data' does not exist on model 'Company'
  - Model: Company
  - Field: data
  - Suggestion: Did you mean: dataQSubmissions?

- **Line 115** [ERROR]: Field 'success' does not exist on model 'Company'
  - Model: Company
  - Field: success
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 116** [ERROR]: Field 'error' does not exist on model 'Company'
  - Model: Company
  - Field: error
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 117** [ERROR]: Field 'code' does not exist on model 'Company'
  - Model: Company
  - Field: code
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 118** [ERROR]: Field 'message' does not exist on model 'Company'
  - Model: Company
  - Field: message
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 119** [ERROR]: Field 'details' does not exist on model 'Company'
  - Model: Company
  - Field: details
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

### app\api\settings\appearance\route.ts

- **Line 39** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 102** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 115** [ERROR]: Field 'where' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: where
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

- **Line 116** [ERROR]: Field 'data' does not exist on model 'CompanySettings'
  - Model: CompanySettings
  - Field: data
  - Suggestion: Available fields: id, companyId, company, generalSettings, notificationSettings...

### app\api\safety-configurations\[id]\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 91** [ERROR]: Field 'data' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 94** [ERROR]: Field 'success' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 98** [ERROR]: Field 'success' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 99** [ERROR]: Field 'status' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 124** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 139** [ERROR]: Field 'where' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 140** [ERROR]: Field 'data' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 143** [ERROR]: Field 'success' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 145** [ERROR]: Field 'error' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 147** [ERROR]: Field 'success' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 148** [ERROR]: Field 'status' does not exist on model 'SafetyConfiguration'
  - Model: SafetyConfiguration
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\safety\trainings\route.ts

- **Line 68** [ERROR]: Relation 'include' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 70** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 72** [ERROR]: Relation 'driverNumber' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber
  - Suggestion: Available relations: Company, Driver...

- **Line 73** [ERROR]: Relation 'user' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 74** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 75** [ERROR]: Relation 'firstName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName
  - Suggestion: Available relations: Company, Driver...

- **Line 76** [ERROR]: Relation 'lastName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName
  - Suggestion: Available relations: Company, Driver...

- **Line 113** [ERROR]: Invalid enum value '500' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 128** [ERROR]: Invalid enum value '401' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 135** [ERROR]: Invalid enum value '403' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 144** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 154** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 166** [ERROR]: Relation 'include' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 168** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 170** [ERROR]: Relation 'driverNumber' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber
  - Suggestion: Available relations: Company, Driver...

- **Line 171** [ERROR]: Relation 'user' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 172** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 173** [ERROR]: Relation 'firstName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName
  - Suggestion: Available relations: Company, Driver...

- **Line 174** [ERROR]: Relation 'lastName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName
  - Suggestion: Available relations: Company, Driver...

- **Line 187** [ERROR]: Invalid enum value '201' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 200** [ERROR]: Invalid enum value '400' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 213** [ERROR]: Invalid enum value '500' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

### app\api\safety\near-misses\route.ts

- **Line 24** [ERROR]: Relation 'include' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 26** [ERROR]: Relation 'include' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 27** [ERROR]: Relation 'user' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 83** [ERROR]: Relation 'include' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 85** [ERROR]: Relation 'include' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 86** [ERROR]: Relation 'user' does not exist on model 'NearMiss'
  - Model: NearMiss
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

### app\api\safety\incidents\route.ts

- **Line 48** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 50** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 51** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 56** [ERROR]: Relation 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 58** [ERROR]: Invalid enum value 'true' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 82** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 100** [ERROR]: Invalid enum value 'body' for field 'incidentType' (SafetyIncidentType)
  - Model: SafetyIncident
  - Field: incidentType
  - Suggestion: Valid values: ACCIDENT, COLLISION, ROLLOVER, FIRE, SPILL, INJURY, FATALITY, HAZMAT_INCIDENT, EQUIPMENT_FAILURE, DRIVER_ERROR, OTHER

- **Line 101** [ERROR]: Invalid enum value 'body' for field 'severity' (SafetySeverity)
  - Model: SafetyIncident
  - Field: severity
  - Suggestion: Valid values: MINOR, MODERATE, MAJOR, CRITICAL, FATAL

- **Line 113** [ERROR]: Invalid enum value 'body' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 115** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 117** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 118** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 125** [ERROR]: Invalid enum value '201' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 130** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

### app\api\safety\defects\route.ts

- **Line 32** [ERROR]: Relation 'include' does not exist on model 'Defect'
  - Model: Defect
  - Field: include
  - Suggestion: Available relations: Company, Truck...

- **Line 36** [ERROR]: Invalid enum value 'desc' for field 'severity' (DefectSeverity)
  - Model: Defect
  - Field: severity
  - Suggestion: Valid values: CRITICAL, NON_CRITICAL

- **Line 46** [ERROR]: Invalid enum value '500' for field 'status' (DefectStatus)
  - Model: Defect
  - Field: status
  - Suggestion: Valid values: OPEN, IN_PROGRESS, RESOLVED, CLOSED

### app\api\safety\dashboard\route.ts

- **Line 24** [ERROR]: Field 'where' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 28** [ERROR]: Field 'some' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: some
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 29** [ERROR]: Field 'dataQStatus' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: dataQStatus
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 50** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 60** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 73** [ERROR]: Field 'where' does not exist on model 'Document'
  - Model: Document
  - Field: where
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 85** [ERROR]: Field 'where' does not exist on model 'CSAScore'
  - Model: CSAScore
  - Field: where
  - Suggestion: Available fields: id, companyId, company, scoreDate, basicCategory...

- **Line 103** [ERROR]: Invalid enum value 'score' for field 'trend' (CSATrend)
  - Model: CSAScore
  - Field: trend
  - Suggestion: Valid values: IMPROVING, DECLINING, STABLE

### app\api\safety\alerts\route.ts

- **Line 32** [ERROR]: Invalid enum value 'desc' for field 'severity' (AlertSeverity)
  - Model: ComplianceAlert
  - Field: severity
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 43** [ERROR]: Invalid enum value '500' for field 'status' (AlertStatus)
  - Model: ComplianceAlert
  - Field: status
  - Suggestion: Valid values: ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED

- **Line 63** [ERROR]: Invalid enum value '201' for field 'status' (AlertStatus)
  - Model: ComplianceAlert
  - Field: status
  - Suggestion: Valid values: ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED

- **Line 68** [ERROR]: Invalid enum value '500' for field 'status' (AlertStatus)
  - Model: ComplianceAlert
  - Field: status
  - Suggestion: Valid values: ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED

### app\api\routes\optimize\route.ts

- **Line 185** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 190** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 202** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 203** [ERROR]: Relation 'totalDistance' does not exist on model 'Load'
  - Model: Load
  - Field: totalDistance
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 218** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 239** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 337** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 347** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\routes\calculate\route.ts

- **Line 135** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 144** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 145** [ERROR]: Field 'update' does not exist on model 'Load'
  - Model: Load
  - Field: update
  - Suggestion: Did you mean: pickupDate, lastUpdate, updatedAt?

- **Line 146** [ERROR]: Field 'totalDistance' does not exist on model 'Load'
  - Model: Load
  - Field: totalDistance
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 147** [ERROR]: Field 'estimatedTime' does not exist on model 'Load'
  - Model: Load
  - Field: estimatedTime
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 148** [ERROR]: Field 'fuelCost' does not exist on model 'Load'
  - Model: Load
  - Field: fuelCost
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 149** [ERROR]: Field 'waypoints' does not exist on model 'Load'
  - Model: Load
  - Field: waypoints
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 150** [ERROR]: Field 'optimized' does not exist on model 'Load'
  - Model: Load
  - Field: optimized
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 187** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 197** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\report-templates\[id]\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 74** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 92** [ERROR]: Invalid enum value 'existing' for field 'type' (ReportType)
  - Model: ReportTemplate
  - Field: type
  - Suggestion: Valid values: LOADS, DRIVERS, FINANCIAL, SAFETY, MAINTENANCE, CUSTOM

- **Line 115** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 116** [ERROR]: Field 'data' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 119** [ERROR]: Field 'success' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 123** [ERROR]: Field 'success' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 124** [ERROR]: Field 'status' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 149** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 164** [ERROR]: Field 'where' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 165** [ERROR]: Field 'data' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 168** [ERROR]: Field 'success' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 170** [ERROR]: Field 'error' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 172** [ERROR]: Field 'success' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 173** [ERROR]: Field 'status' does not exist on model 'ReportTemplate'
  - Model: ReportTemplate
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\report-constructors\[id]\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 75** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 111** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 112** [ERROR]: Field 'data' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 115** [ERROR]: Field 'success' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 119** [ERROR]: Field 'success' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 120** [ERROR]: Field 'status' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 145** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 160** [ERROR]: Field 'where' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 161** [ERROR]: Field 'data' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 164** [ERROR]: Field 'success' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 166** [ERROR]: Field 'error' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 168** [ERROR]: Field 'success' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 169** [ERROR]: Field 'status' does not exist on model 'ReportConstructor'
  - Model: ReportConstructor
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\reconciliation\reconcile\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 32** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 47** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 54** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 102** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 104** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 105** [ERROR]: Relation 'customer' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: customer
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 106** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 108** [ERROR]: Relation 'name' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: name
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 109** [ERROR]: Relation 'customerNumber' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 115** [ERROR]: Relation 'include' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: include
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 116** [ERROR]: Relation 'createdBy' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: createdBy
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 117** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 119** [ERROR]: Relation 'firstName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: firstName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 120** [ERROR]: Relation 'lastName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: lastName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 126** [ERROR]: Relation 'select' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: select
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 128** [ERROR]: Relation 'firstName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: firstName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 129** [ERROR]: Relation 'lastName' does not exist on model 'Reconciliation'
  - Model: Reconciliation
  - Field: lastName
  - Suggestion: Available relations: Invoice, Payment, User...

- **Line 144** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 145** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 146** [ERROR]: Invalid enum value 'reconciliationStatus' for field 'reconciliationStatus' (ReconciliationStatus)
  - Model: Invoice
  - Field: reconciliationStatus
  - Suggestion: Valid values: NOT_RECONCILED, PARTIALLY_RECONCILED, FULLY_RECONCILED

- **Line 156** [ERROR]: Invalid enum value '201' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 169** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 179** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\reconciliation\bulk\route.ts

- **Line 41** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 44** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 47** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 63** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 115** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 116** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 117** [ERROR]: Invalid enum value 'reconciliationStatus' for field 'reconciliationStatus' (ReconciliationStatus)
  - Model: Invoice
  - Field: reconciliationStatus
  - Suggestion: Valid values: NOT_RECONCILED, PARTIALLY_RECONCILED, FULLY_RECONCILED

- **Line 151** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 161** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\rate-confirmations\[id]\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: include
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 27** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 29** [ERROR]: Relation 'loadNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 30** [ERROR]: Relation 'customer' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 31** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 32** [ERROR]: Relation 'name' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 33** [ERROR]: Relation 'customerNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customerNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 39** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 41** [ERROR]: Relation 'invoiceNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 42** [ERROR]: Relation 'total' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: total
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 46** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 48** [ERROR]: Relation 'fileName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 49** [ERROR]: Relation 'fileUrl' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileUrl
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 55** [ERROR]: Relation 'firstName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 56** [ERROR]: Relation 'lastName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 119** [ERROR]: Field 'where' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 151** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 154** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 171** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 199** [ERROR]: Field 'where' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 200** [ERROR]: Field 'data' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: data
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 201** [ERROR]: Field 'include' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: include
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 201** [ERROR]: Relation 'include' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: include
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 203** [ERROR]: Field 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 203** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 205** [ERROR]: Field 'loadNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber
  - Suggestion: Did you mean: load?

- **Line 205** [ERROR]: Relation 'loadNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 206** [ERROR]: Field 'customer' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 206** [ERROR]: Relation 'customer' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 207** [ERROR]: Field 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 207** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 208** [ERROR]: Field 'name' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 208** [ERROR]: Relation 'name' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 209** [ERROR]: Field 'customerNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customerNumber
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 209** [ERROR]: Relation 'customerNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customerNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 215** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 217** [ERROR]: Relation 'invoiceNumber' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 218** [ERROR]: Relation 'total' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: total
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 222** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 224** [ERROR]: Relation 'fileName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 225** [ERROR]: Relation 'fileUrl' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: fileUrl
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 229** [ERROR]: Relation 'select' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: select
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 231** [ERROR]: Relation 'firstName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

- **Line 232** [ERROR]: Relation 'lastName' does not exist on model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Document, Invoice, User...

### app\api\projects\[id]\route.ts

- **Line 31** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 36** [ERROR]: Relation 'include' does not exist on model 'Project'
  - Model: Project
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 38** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 52** [ERROR]: Invalid enum value '404' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 61** [ERROR]: Invalid enum value '500' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 72** [ERROR]: Invalid enum value '401' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 82** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 92** [ERROR]: Invalid enum value '404' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 105** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 106** [ERROR]: Field 'data' does not exist on model 'Project'
  - Model: Project
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 107** [ERROR]: Field 'include' does not exist on model 'Project'
  - Model: Project
  - Field: include
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 107** [ERROR]: Relation 'include' does not exist on model 'Project'
  - Model: Project
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 109** [ERROR]: Field 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 109** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 112** [ERROR]: Relation 'select' does not exist on model 'Project'
  - Model: Project
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 122** [ERROR]: Invalid enum value '400' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 128** [ERROR]: Invalid enum value '500' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 139** [ERROR]: Invalid enum value '401' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 146** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 156** [ERROR]: Invalid enum value '404' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

- **Line 161** [ERROR]: Field 'where' does not exist on model 'Project'
  - Model: Project
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 162** [ERROR]: Field 'data' does not exist on model 'Project'
  - Model: Project
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 165** [ERROR]: Field 'success' does not exist on model 'Project'
  - Model: Project
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 167** [ERROR]: Field 'error' does not exist on model 'Project'
  - Model: Project
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 169** [ERROR]: Field 'success' does not exist on model 'Project'
  - Model: Project
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, description...

- **Line 170** [ERROR]: Invalid enum value '500' for field 'status' (ProjectStatus)
  - Model: Project
  - Field: status
  - Suggestion: Valid values: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

### app\api\payments\mark\route.ts

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 38** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 49** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 75** [ERROR]: Invalid enum value 'validated' for field 'paymentMethod' (PaymentMethod)
  - Model: Payment
  - Field: paymentMethod
  - Suggestion: Valid values: CHECK, WIRE, ACH, CREDIT_CARD, CASH, OTHER, FACTOR, QUICK_PAY

- **Line 80** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 82** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 83** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 84** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 86** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 87** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 93** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 95** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 96** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 102** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 103** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 106** [ERROR]: Invalid enum value 'newStatus' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 118** [ERROR]: Invalid enum value '201' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 131** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 141** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\payments\[id]\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 33** [ERROR]: Field 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 34** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 40** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 41** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 42** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 44** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 45** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 53** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 54** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 106** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 109** [ERROR]: Field 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 110** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 114** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 143** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 144** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 147** [ERROR]: Invalid enum value 'newStatus' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 154** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 155** [ERROR]: Field 'data' does not exist on model 'Payment'
  - Model: Payment
  - Field: data
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 158** [ERROR]: Invalid enum value 'validated' for field 'paymentMethod' (PaymentMethod)
  - Model: Payment
  - Field: paymentMethod
  - Suggestion: Valid values: CHECK, WIRE, ACH, CREDIT_CARD, CASH, OTHER, FACTOR, QUICK_PAY

- **Line 162** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 164** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 165** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 166** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 168** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 169** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 175** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 177** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 178** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 231** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 234** [ERROR]: Field 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 235** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 239** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 284** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 287** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 288** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 291** [ERROR]: Invalid enum value 'newStatus' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 299** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

### app\api\order-payment-types\[id]\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 42** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 101** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 122** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 134** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 149** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 150** [ERROR]: Field 'data' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 153** [ERROR]: Field 'success' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 157** [ERROR]: Field 'success' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 158** [ERROR]: Field 'status' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 185** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 195** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 214** [ERROR]: Field 'where' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 215** [ERROR]: Field 'data' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 218** [ERROR]: Field 'success' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 220** [ERROR]: Field 'error' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 222** [ERROR]: Field 'success' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 223** [ERROR]: Field 'status' does not exist on model 'OrderPaymentType'
  - Model: OrderPaymentType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\notifications\preferences\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'NotificationPreferences'
  - Model: NotificationPreferences
  - Field: where
  - Suggestion: Available fields: id, userId, user, emailEnabled, pushEnabled...

- **Line 81** [ERROR]: Field 'where' does not exist on model 'NotificationPreferences'
  - Model: NotificationPreferences
  - Field: where
  - Suggestion: Available fields: id, userId, user, emailEnabled, pushEnabled...

- **Line 93** [ERROR]: Field 'where' does not exist on model 'NotificationPreferences'
  - Model: NotificationPreferences
  - Field: where
  - Suggestion: Available fields: id, userId, user, emailEnabled, pushEnabled...

- **Line 94** [ERROR]: Field 'data' does not exist on model 'NotificationPreferences'
  - Model: NotificationPreferences
  - Field: data
  - Suggestion: Available fields: id, userId, user, emailEnabled, pushEnabled...

### app\api\net-profit-formulas\[id]\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 71** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 87** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 103** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 104** [ERROR]: Field 'data' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 107** [ERROR]: Field 'success' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 111** [ERROR]: Field 'success' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 112** [ERROR]: Field 'status' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 137** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 152** [ERROR]: Field 'where' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 153** [ERROR]: Field 'data' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 156** [ERROR]: Field 'success' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 158** [ERROR]: Field 'error' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 160** [ERROR]: Field 'success' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 161** [ERROR]: Field 'status' does not exist on model 'NetProfitFormula'
  - Model: NetProfitFormula
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\mobile\loads\route.ts

- **Line 22** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 35** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 45** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 46** [ERROR]: Field 'driverId' does not exist on model 'Driver'
  - Model: Driver
  - Field: driverId
  - Suggestion: Did you mean: id?

- **Line 58** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 61** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 62** [ERROR]: Relation 'phone' does not exist on model 'Load'
  - Model: Load
  - Field: phone
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 63** [ERROR]: Relation 'email' does not exist on model 'Load'
  - Model: Load
  - Field: email
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 78** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 134** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\mobile\breakdowns\route.ts

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 60** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 71** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 91** [ERROR]: Invalid enum value '413' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 107** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 130** [ERROR]: Invalid enum value '413' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 144** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 153** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 165** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 188** [ERROR]: Invalid enum value 'validated' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 189** [ERROR]: Invalid enum value 'validated' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 191** [ERROR]: Invalid enum value 'REPORTED' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 204** [ERROR]: Invalid enum value 'MOBILE_APP' for field 'channel' (CommunicationChannel)
  - Model: Communication
  - Field: channel
  - Suggestion: Valid values: SIP // Phone calls via SIP provider, SMS // Text messages, TELEGRAM // Telegram messaging, EMAIL // Email, MOBILE_APP // Driver mobile app

- **Line 205** [ERROR]: Invalid enum value 'BREAKDOWN_REPORT' for field 'type' (CommunicationType)
  - Model: Communication
  - Field: type
  - Suggestion: Valid values: CALL // Phone call, SMS // Text message, MMS // Multimedia message, TELEGRAM // Telegram message, EMAIL // Email, VOICEMAIL // Voicemail, NOTE // Manual note/log, MESSAGE // Mobile app message, BREAKDOWN_REPORT // Breakdown report from mobile app

- **Line 206** [ERROR]: Invalid enum value 'INBOUND' for field 'direction' (CommunicationDirection)
  - Model: Communication
  - Field: direction
  - Suggestion: Valid values: INBOUND // Received from driver, OUTBOUND // Sent to driver

- **Line 286** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 299** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 309** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 310** [ERROR]: Field 'driverId' does not exist on model 'Driver'
  - Model: Driver
  - Field: driverId
  - Suggestion: Did you mean: id?

- **Line 322** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 324** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 325** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 326** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 327** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 328** [ERROR]: Relation 'year' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: year
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 332** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 333** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 334** [ERROR]: Relation 'customer' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: customer
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 335** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 336** [ERROR]: Relation 'name' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: name
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 355** [ERROR]: Invalid enum value 'bd' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 356** [ERROR]: Invalid enum value 'bd' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 357** [ERROR]: Invalid enum value 'bd' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 395** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\mobile\auth\route.ts

- **Line 25** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 26** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 26** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 28** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 28** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

### app\api\mc-numbers\[id]\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 95** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 126** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 155** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 188** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 189** [ERROR]: Field 'data' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: data
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 193** [ERROR]: Field 'success' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: success
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 194** [ERROR]: Field 'data' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: data
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 200** [ERROR]: Field 'success' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: success
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 201** [ERROR]: Field 'error' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: error
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 202** [ERROR]: Field 'code' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: code
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 203** [ERROR]: Field 'message' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: message
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 204** [ERROR]: Field 'details' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: details
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 283** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 302** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 303** [ERROR]: Field 'data' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: data
  - Suggestion: Available fields: id, companyId, company, companyName, type...

### app\api\locations\[id]\route.ts

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 55** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 110** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 113** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 125** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 126** [ERROR]: Field 'data' does not exist on model 'Location'
  - Model: Location
  - Field: data
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 130** [ERROR]: Field 'success' does not exist on model 'Location'
  - Model: Location
  - Field: success
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 131** [ERROR]: Field 'data' does not exist on model 'Location'
  - Model: Location
  - Field: data
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 133** [ERROR]: Field 'error' does not exist on model 'Location'
  - Model: Location
  - Field: error
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 137** [ERROR]: Field 'success' does not exist on model 'Location'
  - Model: Location
  - Field: success
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 138** [ERROR]: Field 'error' does not exist on model 'Location'
  - Model: Location
  - Field: error
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 139** [ERROR]: Field 'code' does not exist on model 'Location'
  - Model: Location
  - Field: code
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 140** [ERROR]: Field 'message' does not exist on model 'Location'
  - Model: Location
  - Field: message
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 141** [ERROR]: Field 'details' does not exist on model 'Location'
  - Model: Location
  - Field: details
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 184** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 187** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 199** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 200** [ERROR]: Field 'data' does not exist on model 'Location'
  - Model: Location
  - Field: data
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 204** [ERROR]: Field 'success' does not exist on model 'Location'
  - Model: Location
  - Field: success
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 205** [ERROR]: Field 'message' does not exist on model 'Location'
  - Model: Location
  - Field: message
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 207** [ERROR]: Field 'error' does not exist on model 'Location'
  - Model: Location
  - Field: error
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 208** [ERROR]: Field 'location' does not exist on model 'Location'
  - Model: Location
  - Field: location
  - Suggestion: Did you mean: locationNumber, locationCompany?

- **Line 211** [ERROR]: Field 'success' does not exist on model 'Location'
  - Model: Location
  - Field: success
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 212** [ERROR]: Field 'error' does not exist on model 'Location'
  - Model: Location
  - Field: error
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 213** [ERROR]: Field 'code' does not exist on model 'Location'
  - Model: Location
  - Field: code
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 214** [ERROR]: Field 'message' does not exist on model 'Location'
  - Model: Location
  - Field: message
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

### app\api\loads\[id]\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 37** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 38** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 39** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 40** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 41** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 42** [ERROR]: Relation 'email' does not exist on model 'Load'
  - Model: Load
  - Field: email
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 43** [ERROR]: Relation 'phone' does not exist on model 'Load'
  - Model: Load
  - Field: phone
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 50** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 51** [ERROR]: Field 'orderBy' does not exist on model 'Load'
  - Model: Load
  - Field: orderBy
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 67** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 82** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 97** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 107** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 120** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 135** [ERROR]: Invalid enum value '403' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 164** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 165** [ERROR]: Field 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Did you mean: randomSelectedDrivers?

- **Line 165** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 166** [ERROR]: Invalid enum value 'true' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 174** [ERROR]: Invalid enum value 'driver' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 193** [ERROR]: Invalid enum value 'validated' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 201** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 202** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 203** [ERROR]: Field 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 203** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 205** [ERROR]: Field 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 205** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 207** [ERROR]: Field 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 207** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 208** [ERROR]: Field 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Did you mean: customer?

- **Line 208** [ERROR]: Relation 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 212** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 214** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 215** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 216** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 217** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 218** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 224** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 226** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 256** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 266** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 281** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 291** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 304** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 319** [ERROR]: Invalid enum value '403' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 325** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 326** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 330** [ERROR]: Field 'success' does not exist on model 'Load'
  - Model: Load
  - Field: success
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 331** [ERROR]: Field 'message' does not exist on model 'Load'
  - Model: Load
  - Field: message
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 334** [ERROR]: Field 'error' does not exist on model 'Load'
  - Model: Load
  - Field: error
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 337** [ERROR]: Field 'success' does not exist on model 'Load'
  - Model: Load
  - Field: success
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 338** [ERROR]: Field 'error' does not exist on model 'Load'
  - Model: Load
  - Field: error
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 340** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\stats\route.ts

- **Line 190** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 198** [ERROR]: Field 'success' does not exist on model 'Load'
  - Model: Load
  - Field: success
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 199** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 201** [ERROR]: Field 'totalRevenue' does not exist on model 'Load'
  - Model: Load
  - Field: totalRevenue
  - Suggestion: Did you mean: revenue?

- **Line 213** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\import-pdf\route.ts

- **Line 395** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 401** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 411** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 417** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 427** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 433** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 461** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

### app\api\loads\bulk\route.ts

- **Line 51** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 67** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 87** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 92** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 94** [ERROR]: Invalid enum value 'true' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 104** [ERROR]: Invalid enum value 'validated' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 115** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 151** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 161** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 176** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 185** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 190** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 199** [ERROR]: Relation 'error' does not exist on model 'Load'
  - Model: Load
  - Field: error
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 204** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 210** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 252** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 262** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loadboard\post\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 46** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 80** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 90** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\invoices\[id]\route.ts

- **Line 25** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 28** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 31** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 34** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 36** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 37** [ERROR]: Relation 'accountNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: accountNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 41** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 42** [ERROR]: Relation 'createdBy' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: createdBy
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 43** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 45** [ERROR]: Relation 'firstName' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: firstName
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 46** [ERROR]: Relation 'lastName' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: lastName
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 52** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 53** [ERROR]: Relation 'reconciledBy' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: reconciledBy
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 56** [ERROR]: Relation 'firstName' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: firstName
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 57** [ERROR]: Relation 'lastName' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: lastName
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 71** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 78** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 82** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 105** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 120** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 152** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 155** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 166** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 181** [ERROR]: Invalid enum value '403' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 264** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 265** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 266** [ERROR]: Field 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 266** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 268** [ERROR]: Field 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 268** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 270** [ERROR]: Field 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 270** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 271** [ERROR]: Field 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Did you mean: customer?

- **Line 271** [ERROR]: Relation 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 275** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 277** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 299** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\stats\route.ts

- **Line 24** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 29** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 36** [ERROR]: Field 'customerId' does not exist on model 'Customer'
  - Model: Customer
  - Field: customerId
  - Suggestion: Did you mean: id?

- **Line 36** [ERROR]: Relation 'customerId' does not exist on model 'Customer'
  - Model: Customer
  - Field: customerId
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 57** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 63** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 94** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\reports\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 35** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 43** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 44** [ERROR]: Relation 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 129** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\import\route.ts

- **Line 78** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 79** [ERROR]: Field 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 79** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 91** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 92** [ERROR]: Field 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 92** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 100** [ERROR]: Field 'created' does not exist on model 'Load'
  - Model: Load
  - Field: created
  - Suggestion: Did you mean: createdById, createdBy, createdAt?

- **Line 101** [ERROR]: Field 'updated' does not exist on model 'Load'
  - Model: Load
  - Field: updated
  - Suggestion: Did you mean: updatedAt?

- **Line 102** [ERROR]: Field 'errors' does not exist on model 'Load'
  - Model: Load
  - Field: errors
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 105** [ERROR]: Field 'pass' does not exist on model 'Load'
  - Model: Load
  - Field: pass
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 106** [ERROR]: Field 'invoiceNumbers' does not exist on model 'Load'
  - Model: Load
  - Field: invoiceNumbers
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 107** [ERROR]: Field 'rowData' does not exist on model 'Load'
  - Model: Load
  - Field: rowData
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 108** [ERROR]: Field 'row' does not exist on model 'Load'
  - Model: Load
  - Field: row
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 109** [ERROR]: Field 'rowNumber' does not exist on model 'Load'
  - Model: Load
  - Field: rowNumber
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 110** [ERROR]: Field 'invoiceNumber' does not exist on model 'Load'
  - Model: Load
  - Field: invoiceNumber
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 111** [ERROR]: Field 'customerName' does not exist on model 'Load'
  - Model: Load
  - Field: customerName
  - Suggestion: Did you mean: customer?

- **Line 112** [ERROR]: Field 'loadIdValue' does not exist on model 'Load'
  - Model: Load
  - Field: loadIdValue
  - Suggestion: Did you mean: id?

- **Line 127** [ERROR]: Field 'rowNumber' does not exist on model 'Load'
  - Model: Load
  - Field: rowNumber
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 128** [ERROR]: Field 'invoiceNumber' does not exist on model 'Load'
  - Model: Load
  - Field: invoiceNumber
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 129** [ERROR]: Field 'customerName' does not exist on model 'Load'
  - Model: Load
  - Field: customerName
  - Suggestion: Did you mean: customer?

- **Line 130** [ERROR]: Field 'loadIdValue' does not exist on model 'Load'
  - Model: Load
  - Field: loadIdValue
  - Suggestion: Did you mean: id?

- **Line 137** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 141** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 206** [ERROR]: Invalid enum value 'InvoiceStatus' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 220** [ERROR]: Invalid enum value 'ReconciliationStatus' for field 'reconciliationStatus' (ReconciliationStatus)
  - Model: Invoice
  - Field: reconciliationStatus
  - Suggestion: Valid values: NOT_RECONCILED, PARTIALLY_RECONCILED, FULLY_RECONCILED

- **Line 281** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 282** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 342** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\generate\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 52** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 67** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 125** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 130** [ERROR]: Invalid enum value 'LoadStatus' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 146** [ERROR]: Invalid enum value '201' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 159** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 169** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\invoices\aging\route.ts

- **Line 19** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 21** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 27** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 29** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 30** [ERROR]: Relation 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 31** [ERROR]: Relation 'email' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: email
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 64** [ERROR]: Invalid enum value 'invoice' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 199** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\integrations\status\route.ts

- **Line 23** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 24** [ERROR]: Field 'companyId_provider' does not exist on model 'Integration'
  - Model: Integration
  - Field: companyId_provider
  - Suggestion: Did you mean: id, companyId, company?

- **Line 63** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 64** [ERROR]: Field 'companyId_provider' does not exist on model 'Integration'
  - Model: Integration
  - Field: companyId_provider
  - Suggestion: Did you mean: id, companyId, company?

### app\api\inventory\[id]\route.ts

- **Line 40** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 45** [ERROR]: Relation 'include' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: include
  - Suggestion: Available relations: Company, Vendor...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: select
  - Suggestion: Available relations: Company, Vendor...

- **Line 50** [ERROR]: Relation 'vendorNumber' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber
  - Suggestion: Available relations: Company, Vendor...

- **Line 113** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 128** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 129** [ERROR]: Field 'data' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: data
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 130** [ERROR]: Field 'include' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: include
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 130** [ERROR]: Relation 'include' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: include
  - Suggestion: Available relations: Company, Vendor...

- **Line 132** [ERROR]: Field 'select' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: select
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 132** [ERROR]: Relation 'select' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: select
  - Suggestion: Available relations: Company, Vendor...

- **Line 135** [ERROR]: Field 'vendorNumber' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 135** [ERROR]: Relation 'vendorNumber' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber
  - Suggestion: Available relations: Company, Vendor...

- **Line 196** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 211** [ERROR]: Field 'where' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: where
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 212** [ERROR]: Field 'data' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: data
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 216** [ERROR]: Field 'success' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: success
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 217** [ERROR]: Field 'message' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: message
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 219** [ERROR]: Field 'error' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: error
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 220** [ERROR]: Field 'item' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: item
  - Suggestion: Did you mean: itemNumber?

- **Line 223** [ERROR]: Field 'success' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: success
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 224** [ERROR]: Field 'error' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: error
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 225** [ERROR]: Field 'code' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: code
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

- **Line 226** [ERROR]: Field 'message' does not exist on model 'InventoryItem'
  - Model: InventoryItem
  - Field: message
  - Suggestion: Available fields: id, companyId, company, itemNumber, name...

### app\api\inspections\[id]\route.ts

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 57** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 61** [ERROR]: Relation 'truckNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: truckNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 62** [ERROR]: Relation 'make' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: make
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 63** [ERROR]: Relation 'model' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: model
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 69** [ERROR]: Relation 'driverNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: driverNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 70** [ERROR]: Relation 'user' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: user
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 71** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 72** [ERROR]: Relation 'firstName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: firstName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 73** [ERROR]: Relation 'lastName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: lastName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 85** [ERROR]: Invalid enum value '404' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 103** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 117** [ERROR]: Invalid enum value '401' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 124** [ERROR]: Invalid enum value '403' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 134** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 144** [ERROR]: Invalid enum value '404' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 160** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 161** [ERROR]: Field 'data' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 162** [ERROR]: Field 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 162** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 164** [ERROR]: Field 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 164** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 166** [ERROR]: Field 'truckNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: truckNumber
  - Suggestion: Did you mean: truck?

- **Line 166** [ERROR]: Relation 'truckNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: truckNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 167** [ERROR]: Field 'make' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: make
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 167** [ERROR]: Relation 'make' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: make
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 168** [ERROR]: Field 'model' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: model
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 168** [ERROR]: Relation 'model' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: model
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 172** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 174** [ERROR]: Relation 'driverNumber' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: driverNumber
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 175** [ERROR]: Relation 'user' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: user
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 176** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 177** [ERROR]: Relation 'firstName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: firstName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 178** [ERROR]: Relation 'lastName' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: lastName
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 201** [ERROR]: Invalid enum value '400' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 214** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 228** [ERROR]: Invalid enum value '401' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 235** [ERROR]: Invalid enum value '403' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 241** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 251** [ERROR]: Invalid enum value '404' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 256** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 257** [ERROR]: Field 'data' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 261** [ERROR]: Field 'success' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 262** [ERROR]: Field 'message' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: message
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 264** [ERROR]: Field 'error' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 265** [ERROR]: Field 'inspection' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: inspection
  - Suggestion: Did you mean: inspectionNumber, inspectionType, inspectionDate?

- **Line 268** [ERROR]: Field 'success' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: success
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 269** [ERROR]: Field 'error' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: error
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 270** [ERROR]: Field 'code' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: code
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 271** [ERROR]: Field 'message' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: message
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 274** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

### app\api\import-export\[entity]\route.ts

- **Line 72** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 73** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 73** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 77** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 78** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 78** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 97** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 102** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 103** [ERROR]: Field 'headers' does not exist on model 'User'
  - Model: User
  - Field: headers
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 109** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 178** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 227** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 232** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 238** [ERROR]: Invalid enum value 'true' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

- **Line 294** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 321** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 353** [ERROR]: Invalid enum value '400' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 401** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 419** [ERROR]: Invalid enum value '401' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 448** [ERROR]: Invalid enum value '403' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 483** [ERROR]: Invalid enum value '400' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 509** [ERROR]: Invalid enum value '400' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 522** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 860** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 864** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 897** [ERROR]: Invalid enum value 'customerType' for field 'type' (CustomerType)
  - Model: Customer
  - Field: type
  - Suggestion: Valid values: DIRECT, BROKER, FREIGHT_FORWARDER, THIRD_PARTY_LOGISTICS

- **Line 952** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 979** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 983** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1066** [ERROR]: Invalid enum value 'truckStatus' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 1097** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 1125** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1129** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 1234** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 1238** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 1327** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 1331** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1337** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 1341** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1434** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1438** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 1464** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1490** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1512** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1604** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 1624** [ERROR]: Invalid enum value 'vendorType' for field 'type' (VendorType)
  - Model: Vendor
  - Field: type
  - Suggestion: Valid values: SUPPLIER, PARTS_VENDOR, SERVICE_PROVIDER, FUEL_VENDOR, REPAIR_SHOP, TIRE_SHOP, OTHER

- **Line 1654** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 1656** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 1699** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 1703** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 1706** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 1710** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1714** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1716** [ERROR]: Relation 'number' does not exist on model 'Truck'
  - Model: Truck
  - Field: number
  - Suggestion: Available relations: Company, McNumber...

- **Line 1722** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 1726** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 1730** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 1732** [ERROR]: Relation 'number' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: number
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 1738** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 1742** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1746** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1747** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1748** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1749** [ERROR]: Relation 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 1755** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 1760** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1763** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 1767** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 1770** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 1774** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 1871** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 1882** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 2753** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 2757** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 2774** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 2804** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 2856** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 2861** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 2869** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 2910** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 2926** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 2942** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 2946** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 2965** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 2966** [ERROR]: Field 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Did you mean: randomSelectedDrivers?

- **Line 2966** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 2969** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 2970** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 2970** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 2979** [ERROR]: Field 'driversToCreate' does not exist on model 'User'
  - Model: User
  - Field: driversToCreate
  - Suggestion: Did you mean: driver?

- **Line 3014** [ERROR]: Field 'row' does not exist on model 'User'
  - Model: User
  - Field: row
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 3015** [ERROR]: Field 'field' does not exist on model 'User'
  - Model: User
  - Field: field
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 3016** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 3208** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 3224** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 3245** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 3253** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 3287** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

### app\api\import-export\bulk\route.ts

- **Line 166** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 183** [ERROR]: Invalid enum value 'getValue' for field 'type' (CustomerType)
  - Model: Customer
  - Field: type
  - Suggestion: Valid values: DIRECT, BROKER, FREIGHT_FORWARDER, THIRD_PARTY_LOGISTICS

- **Line 237** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 266** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 273** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 289** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 313** [ERROR]: Invalid enum value 'getValue' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 349** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 366** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 380** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 387** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 403** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 469** [ERROR]: Field 'where' does not exist on model 'Vendor'
  - Model: Vendor
  - Field: where
  - Suggestion: Available fields: id, companyId, company, vendorNumber, name...

- **Line 490** [ERROR]: Invalid enum value 'mappedType' for field 'type' (VendorType)
  - Model: Vendor
  - Field: type
  - Suggestion: Valid values: SUPPLIER, PARTS_VENDOR, SERVICE_PROVIDER, FUEL_VENDOR, REPAIR_SHOP, TIRE_SHOP, OTHER

- **Line 524** [ERROR]: Field 'where' does not exist on model 'Location'
  - Model: Location
  - Field: where
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 526** [ERROR]: Field 'deletedAt' does not exist on model 'Location'
  - Model: Location
  - Field: deletedAt
  - Suggestion: Available fields: id, companyId, company, locationNumber, name...

- **Line 572** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 592** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 609** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 623** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 656** [ERROR]: Invalid enum value 'FTL' for field 'loadType' (LoadType)
  - Model: Load
  - Field: loadType
  - Suggestion: Valid values: FTL // Full Truckload, LTL // Less Than Truckload, PARTIAL, INTERMODAL

- **Line 673** [ERROR]: Invalid enum value 'mapLoadStatus' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 705** [ERROR]: Invalid enum value 'string' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\ifta\config\route.ts

- **Line 22** [ERROR]: Field 'where' does not exist on model 'IFTAConfig'
  - Model: IFTAConfig
  - Field: where
  - Suggestion: Available fields: id, companyId, company, stateRates...

- **Line 75** [ERROR]: Field 'where' does not exist on model 'IFTAConfig'
  - Model: IFTAConfig
  - Field: where
  - Suggestion: Available fields: id, companyId, company, stateRates...

- **Line 76** [ERROR]: Field 'update' does not exist on model 'IFTAConfig'
  - Model: IFTAConfig
  - Field: update
  - Suggestion: Available fields: id, companyId, company, stateRates...

### app\api\hos\records\route.ts

- **Line 55** [ERROR]: Relation 'include' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: include
  - Suggestion: Available relations: Driver...

- **Line 57** [ERROR]: Relation 'select' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: select
  - Suggestion: Available relations: Driver...

- **Line 59** [ERROR]: Relation 'driverNumber' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: driverNumber
  - Suggestion: Available relations: Driver...

- **Line 60** [ERROR]: Relation 'user' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: user
  - Suggestion: Available relations: Driver...

- **Line 61** [ERROR]: Relation 'select' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: select
  - Suggestion: Available relations: Driver...

- **Line 62** [ERROR]: Relation 'firstName' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: firstName
  - Suggestion: Available relations: Driver...

- **Line 63** [ERROR]: Relation 'lastName' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: lastName
  - Suggestion: Available relations: Driver...

- **Line 84** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 96** [ERROR]: Invalid enum value '401' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 105** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 118** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 137** [ERROR]: Invalid enum value 'validated' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 146** [ERROR]: Invalid enum value '201' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 159** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 169** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\fuel\entries\route.ts

- **Line 59** [ERROR]: Relation 'include' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: include
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 61** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 63** [ERROR]: Relation 'truckNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 69** [ERROR]: Relation 'driverNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: driverNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 70** [ERROR]: Relation 'user' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: user
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 71** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 72** [ERROR]: Relation 'firstName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: firstName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 73** [ERROR]: Relation 'lastName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: lastName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 79** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 81** [ERROR]: Relation 'number' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: number
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 82** [ERROR]: Relation 'companyName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: companyName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 86** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 88** [ERROR]: Relation 'paymentNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 89** [ERROR]: Relation 'amount' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: amount
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 90** [ERROR]: Relation 'paymentDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentDate
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 91** [ERROR]: Relation 'paymentMethod' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentMethod
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 92** [ERROR]: Relation 'type' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: type
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 132** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 145** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 152** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 188** [ERROR]: Invalid enum value 'validated' for field 'fuelType' (FuelType)
  - Model: FuelEntry
  - Field: fuelType
  - Suggestion: Valid values: DIESEL, GAS, DEF

- **Line 193** [ERROR]: Relation 'include' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: include
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 195** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 197** [ERROR]: Relation 'number' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: number
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 198** [ERROR]: Relation 'companyName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: companyName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 202** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 204** [ERROR]: Relation 'paymentNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 205** [ERROR]: Relation 'amount' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: amount
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 206** [ERROR]: Relation 'paymentDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentDate
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 207** [ERROR]: Relation 'paymentMethod' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: paymentMethod
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 208** [ERROR]: Relation 'type' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: type
  - Suggestion: Available relations: Truck, Driver, McNumber...

### app\api\fleet\communications\route.ts

- **Line 69** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 71** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 73** [ERROR]: Relation 'breakdownNumber' does not exist on model 'Communication'
  - Model: Communication
  - Field: breakdownNumber
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 74** [ERROR]: Relation 'status' does not exist on model 'Communication'
  - Model: Communication
  - Field: status
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 75** [ERROR]: Relation 'priority' does not exist on model 'Communication'
  - Model: Communication
  - Field: priority
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 76** [ERROR]: Relation 'truck' does not exist on model 'Communication'
  - Model: Communication
  - Field: truck
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 77** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 78** [ERROR]: Relation 'truckNumber' does not exist on model 'Communication'
  - Model: Communication
  - Field: truckNumber
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 84** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 85** [ERROR]: Relation 'user' does not exist on model 'Communication'
  - Model: Communication
  - Field: user
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 86** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 87** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 88** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 89** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 90** [ERROR]: Relation 'phone' does not exist on model 'Communication'
  - Model: Communication
  - Field: phone
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 96** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 97** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 98** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 99** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

### app\api\factoring-companies\[id]\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 26** [ERROR]: Relation '_count' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: _count
  - Suggestion: Available relations: Company...

- **Line 27** [ERROR]: Relation 'select' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 79** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 119** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 120** [ERROR]: Field 'data' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 124** [ERROR]: Field 'success' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 125** [ERROR]: Field 'data' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 128** [ERROR]: Field 'error' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 131** [ERROR]: Field 'success' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 132** [ERROR]: Field 'error' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 156** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 160** [ERROR]: Relation 'include' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 161** [ERROR]: Relation '_count' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: _count
  - Suggestion: Available relations: Company...

- **Line 162** [ERROR]: Relation 'select' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: select
  - Suggestion: Available relations: Company...

- **Line 184** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 185** [ERROR]: Field 'data' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 190** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

### app\api\factoring\stats\route.ts

- **Line 41** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 43** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 45** [ERROR]: Invalid enum value 'FactoringStatus' for field 'factoringStatus' (FactoringStatus)
  - Model: Invoice
  - Field: factoringStatus
  - Suggestion: Valid values: NOT_FACTORED, SUBMITTED_TO_FACTOR, FUNDED, RESERVE_RELEASED

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 55** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 60** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 70** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 72** [ERROR]: Invalid enum value 'FactoringStatus' for field 'factoringStatus' (FactoringStatus)
  - Model: Invoice
  - Field: factoringStatus
  - Suggestion: Valid values: NOT_FACTORED, SUBMITTED_TO_FACTOR, FUNDED, RESERVE_RELEASED

- **Line 74** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 83** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 84** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 88** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 89** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 97** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 99** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 101** [ERROR]: Invalid enum value 'FactoringStatus' for field 'factoringStatus' (FactoringStatus)
  - Model: Invoice
  - Field: factoringStatus
  - Suggestion: Valid values: NOT_FACTORED, SUBMITTED_TO_FACTOR, FUNDED, RESERVE_RELEASED

- **Line 103** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 109** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 110** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 149** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\expenses\[id]\route.ts

- **Line 72** [ERROR]: Field 'where' does not exist on model 'LoadExpense'
  - Model: LoadExpense
  - Field: where
  - Suggestion: Available fields: id, loadId, load, expenseType, category...

- **Line 75** [ERROR]: Field 'companyId' does not exist on model 'LoadExpense'
  - Model: LoadExpense
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 94** [ERROR]: Invalid enum value 'validated' for field 'expenseType' (LoadExpenseType)
  - Model: LoadExpense
  - Field: expenseType
  - Suggestion: Valid values: TOLL, SCALE, SCALE_TICKET, PERMIT, LUMPER, DETENTION, PARKING, REPAIR, TOWING, TIRE, FUEL_ADDITIVE, DEF, WASH, MEAL, LODGING, PHONE, OTHER

- **Line 215** [ERROR]: Field 'where' does not exist on model 'LoadExpense'
  - Model: LoadExpense
  - Field: where
  - Suggestion: Available fields: id, loadId, load, expenseType, category...

- **Line 218** [ERROR]: Field 'companyId' does not exist on model 'LoadExpense'
  - Model: LoadExpense
  - Field: companyId
  - Suggestion: Did you mean: id?

### app\api\expense-types\[id]\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 37** [ERROR]: Relation 'include' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 42** [ERROR]: Relation 'error' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: error
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 74** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 107** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 108** [ERROR]: Field 'data' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 109** [ERROR]: Field 'include' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: include
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 109** [ERROR]: Relation 'include' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 112** [ERROR]: Field 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 112** [ERROR]: Relation 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 116** [ERROR]: Field 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 116** [ERROR]: Relation 'error' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: error
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 117** [ERROR]: Field 'status' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 142** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 157** [ERROR]: Field 'where' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 158** [ERROR]: Field 'data' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 161** [ERROR]: Field 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 163** [ERROR]: Field 'error' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 165** [ERROR]: Field 'success' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 166** [ERROR]: Field 'status' does not exist on model 'ExpenseType'
  - Model: ExpenseType
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\expense-categories\[id]\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 41** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 46** [ERROR]: Relation 'include' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: include
  - Suggestion: Available relations: Company, McNumber, ExpenseCategory...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 101** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 123** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 134** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 155** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 156** [ERROR]: Field 'data' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 159** [ERROR]: Field 'success' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 163** [ERROR]: Field 'success' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 164** [ERROR]: Field 'status' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 191** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 201** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 220** [ERROR]: Field 'where' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 221** [ERROR]: Field 'data' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 224** [ERROR]: Field 'success' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 226** [ERROR]: Field 'error' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 228** [ERROR]: Field 'success' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 229** [ERROR]: Field 'status' does not exist on model 'ExpenseCategory'
  - Model: ExpenseCategory
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\eld\webhook\route.ts

- **Line 100** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 104** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 109** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 117** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 128** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 139** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 163** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 164** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 165** [ERROR]: Invalid enum value 'driverStatus' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 196** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 207** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 208** [ERROR]: Field 'data' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: data
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 221** [ERROR]: Invalid enum value 'driverStatus' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 235** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 245** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\edi\generate\route.ts

- **Line 43** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 48** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 59** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 74** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 110** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 115** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 120** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 123** [ERROR]: Relation 'orderBy' does not exist on model 'Load'
  - Model: Load
  - Field: orderBy
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 135** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 143** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 158** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 163** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 166** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 169** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 180** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 186** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 189** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 214** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 237** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 247** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\dynamic-statuses\[id]\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 75** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 91** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 93** [ERROR]: Invalid enum value 'existing' for field 'entityType' (EntityType)
  - Model: DynamicStatus
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

- **Line 110** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 112** [ERROR]: Invalid enum value 'existing' for field 'entityType' (EntityType)
  - Model: DynamicStatus
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, TRUCK, TRAILER, INVOICE, CUSTOMER, VENDOR, SETTLEMENT, BREAKDOWN, INSPECTION, SAFETY_INCIDENT

- **Line 122** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 123** [ERROR]: Field 'data' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 126** [ERROR]: Field 'success' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 130** [ERROR]: Field 'success' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 131** [ERROR]: Field 'status' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 156** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 171** [ERROR]: Field 'where' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 172** [ERROR]: Field 'data' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 175** [ERROR]: Field 'success' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 177** [ERROR]: Field 'error' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 179** [ERROR]: Field 'success' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 180** [ERROR]: Field 'status' does not exist on model 'DynamicStatus'
  - Model: DynamicStatus
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\drivers\[id]\route.ts

- **Line 25** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 30** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 32** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 34** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 35** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 36** [ERROR]: Relation 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 37** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 38** [ERROR]: Relation 'lastLogin' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastLogin
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 42** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 44** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 45** [ERROR]: Relation 'make' does not exist on model 'Driver'
  - Model: Driver
  - Field: make
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 46** [ERROR]: Relation 'model' does not exist on model 'Driver'
  - Model: Driver
  - Field: model
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 50** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 56** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 58** [ERROR]: Relation 'loadNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: loadNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 59** [ERROR]: Invalid enum value 'true' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 60** [ERROR]: Relation 'pickupCity' does not exist on model 'Driver'
  - Model: Driver
  - Field: pickupCity
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 61** [ERROR]: Relation 'pickupState' does not exist on model 'Driver'
  - Model: Driver
  - Field: pickupState
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 62** [ERROR]: Relation 'deliveryCity' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveryCity
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 63** [ERROR]: Relation 'deliveryState' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveryState
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 80** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 95** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 111** [ERROR]: Invalid enum value '401' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 116** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 129** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 200** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 204** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 226** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 227** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 239** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 240** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 245** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 246** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 247** [ERROR]: Field 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 247** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 249** [ERROR]: Field 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Did you mean: randomSelectedDrivers?

- **Line 249** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 251** [ERROR]: Field 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 251** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 252** [ERROR]: Field 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 252** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 253** [ERROR]: Field 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Did you mean: emergencyContactEmail?

- **Line 253** [ERROR]: Relation 'email' does not exist on model 'Driver'
  - Model: Driver
  - Field: email
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 254** [ERROR]: Field 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Did you mean: emergencyContactPhone, emergencyPhone?

- **Line 254** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 258** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 260** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 281** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 291** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 307** [ERROR]: Invalid enum value '401' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 312** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 325** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 340** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 347** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 348** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 351** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 352** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 357** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 358** [ERROR]: Field 'message' does not exist on model 'User'
  - Model: User
  - Field: message
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 361** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 364** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 365** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

### app\api\drivers\stats\route.ts

- **Line 48** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 54** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 85** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\drivers\bulk-update-pay\route.ts

- **Line 94** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\drivers\bulk\route.ts

- **Line 46** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 61** [ERROR]: Relation 'error' does not exist on model 'Driver'
  - Model: Driver
  - Field: error
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 66** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 73** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 82** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

### app\api\documents\[id]\route.ts

- **Line 22** [ERROR]: Field 'where' does not exist on model 'Document'
  - Model: Document
  - Field: where
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 27** [ERROR]: Relation 'include' does not exist on model 'Document'
  - Model: Document
  - Field: include
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 29** [ERROR]: Relation 'select' does not exist on model 'Document'
  - Model: Document
  - Field: select
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 30** [ERROR]: Relation 'loadNumber' does not exist on model 'Document'
  - Model: Document
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 34** [ERROR]: Relation 'select' does not exist on model 'Document'
  - Model: Document
  - Field: select
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 35** [ERROR]: Relation 'driverNumber' does not exist on model 'Document'
  - Model: Document
  - Field: driverNumber
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 36** [ERROR]: Relation 'user' does not exist on model 'Document'
  - Model: Document
  - Field: user
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 37** [ERROR]: Relation 'select' does not exist on model 'Document'
  - Model: Document
  - Field: select
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 38** [ERROR]: Relation 'firstName' does not exist on model 'Document'
  - Model: Document
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 39** [ERROR]: Relation 'lastName' does not exist on model 'Document'
  - Model: Document
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'Document'
  - Model: Document
  - Field: select
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 46** [ERROR]: Relation 'truckNumber' does not exist on model 'Document'
  - Model: Document
  - Field: truckNumber
  - Suggestion: Available relations: Company, Load, Driver, Truck, Breakdown...

- **Line 94** [ERROR]: Field 'where' does not exist on model 'Document'
  - Model: Document
  - Field: where
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 128** [ERROR]: Field 'where' does not exist on model 'Document'
  - Model: Document
  - Field: where
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 129** [ERROR]: Field 'data' does not exist on model 'Document'
  - Model: Document
  - Field: data
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 133** [ERROR]: Field 'success' does not exist on model 'Document'
  - Model: Document
  - Field: success
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 134** [ERROR]: Field 'message' does not exist on model 'Document'
  - Model: Document
  - Field: message
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 137** [ERROR]: Field 'error' does not exist on model 'Document'
  - Model: Document
  - Field: error
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 140** [ERROR]: Field 'success' does not exist on model 'Document'
  - Model: Document
  - Field: success
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 141** [ERROR]: Field 'error' does not exist on model 'Document'
  - Model: Document
  - Field: error
  - Suggestion: Available fields: id, companyId, company, type, title...

### app\api\documents\upload\route.ts

- **Line 103** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 112** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 119** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 128** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 135** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 144** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 151** [ERROR]: Invalid enum value 'validated' for field 'type' (DocumentType)
  - Model: Document
  - Field: type
  - Suggestion: Valid values: BOL // Bill of Lading, POD // Proof of Delivery, INVOICE, RATE_CONFIRMATION, DRIVER_LICENSE, MEDICAL_CARD, INSURANCE, REGISTRATION, INSPECTION, LEASE_AGREEMENT, W9, COI // Certificate of Insurance, OTHER

### app\api\document-templates\[id]\route.ts

- **Line 31** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 72** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Invalid enum value 'existing' for field 'type' (DocumentType)
  - Model: DocumentTemplate
  - Field: type
  - Suggestion: Valid values: BOL // Bill of Lading, POD // Proof of Delivery, INVOICE, RATE_CONFIRMATION, DRIVER_LICENSE, MEDICAL_CARD, INSURANCE, REGISTRATION, INSPECTION, LEASE_AGREEMENT, W9, COI // Certificate of Insurance, OTHER

- **Line 105** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 106** [ERROR]: Field 'data' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 109** [ERROR]: Field 'success' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 113** [ERROR]: Field 'success' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 114** [ERROR]: Field 'status' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 139** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 154** [ERROR]: Field 'where' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 155** [ERROR]: Field 'data' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 158** [ERROR]: Field 'success' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 160** [ERROR]: Field 'error' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 162** [ERROR]: Field 'success' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 163** [ERROR]: Field 'status' does not exist on model 'DocumentTemplate'
  - Model: DocumentTemplate
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\dispatch\weekly\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 32** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 35** [ERROR]: Invalid enum value 'true' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 37** [ERROR]: Invalid enum value 'true' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 40** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 42** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 43** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 44** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 50** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 55** [ERROR]: Relation 'name' does not exist on model 'Driver'
  - Model: Driver
  - Field: name
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 64** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 92** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 94** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 96** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 100** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 102** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 103** [ERROR]: Invalid enum value 'true' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 104** [ERROR]: Relation 'homeTerminal' does not exist on model 'Load'
  - Model: Load
  - Field: homeTerminal
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 105** [ERROR]: Relation 'payRate' does not exist on model 'Load'
  - Model: Load
  - Field: payRate
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 106** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 107** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 108** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 109** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 110** [ERROR]: Relation 'phone' does not exist on model 'Load'
  - Model: Load
  - Field: phone
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 116** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 118** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 138** [ERROR]: Invalid enum value 'driver' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 208** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 323** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\dispatch\bulk-assign\route.ts

- **Line 31** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 47** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 63** [ERROR]: Invalid enum value 'true' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 74** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 81** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 94** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 109** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 137** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 138** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 148** [ERROR]: Field 'notes' does not exist on model 'Load'
  - Model: Load
  - Field: notes
  - Suggestion: Did you mean: pickupNotes, deliveryNotes, dispatchNotes?

- **Line 163** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 193** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 203** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\dispatch\board\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 40** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 42** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 43** [ERROR]: Relation 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 63** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 65** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 67** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 71** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 73** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 74** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 75** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 76** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 77** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 83** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 85** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 94** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 100** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 102** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 103** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 104** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 105** [ERROR]: Relation 'phone' does not exist on model 'Driver'
  - Model: Driver
  - Field: phone
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 109** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 111** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 120** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 126** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 129** [ERROR]: Invalid enum value 'true' for field 'equipmentType' (EquipmentType)
  - Model: Truck
  - Field: equipmentType
  - Suggestion: Valid values: DRY_VAN, REEFER, FLATBED, STEP_DECK, LOWBOY, TANKER, CONESTOGA, POWER_ONLY, HOTSHOT

- **Line 152** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\default-configurations\[id]\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 91** [ERROR]: Field 'data' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 94** [ERROR]: Field 'success' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 98** [ERROR]: Field 'success' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 99** [ERROR]: Field 'status' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 124** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 139** [ERROR]: Field 'where' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 140** [ERROR]: Field 'data' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 143** [ERROR]: Field 'success' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 145** [ERROR]: Field 'error' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 147** [ERROR]: Field 'success' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 148** [ERROR]: Field 'status' does not exist on model 'DefaultConfiguration'
  - Model: DefaultConfiguration
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\debug\force-refresh\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 38** [ERROR]: Invalid enum value 'session' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

- **Line 44** [ERROR]: Invalid enum value 'user' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

### app\api\dashboard\truck-performance\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 32** [ERROR]: Relation 'include' does not exist on model 'Truck'
  - Model: Truck
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 34** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 34** [ERROR]: Relation 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available relations: Company, McNumber...

- **Line 38** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 40** [ERROR]: Invalid enum value 'true' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 41** [ERROR]: Relation 'revenue' does not exist on model 'Truck'
  - Model: Truck
  - Field: revenue
  - Suggestion: Available relations: Company, McNumber...

- **Line 42** [ERROR]: Relation 'deliveredAt' does not exist on model 'Truck'
  - Model: Truck
  - Field: deliveredAt
  - Suggestion: Available relations: Company, McNumber...

- **Line 43** [ERROR]: Relation 'pickupDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: pickupDate
  - Suggestion: Available relations: Company, McNumber...

- **Line 47** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 48** [ERROR]: Field 'scheduledDate' does not exist on model 'Truck'
  - Model: Truck
  - Field: scheduledDate
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 142** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\dashboard\revenue-trends\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 38** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 43** [ERROR]: Invalid enum value 'true' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 99** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\dashboard\driver-performance\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 32** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 34** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 35** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 36** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 40** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 44** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 46** [ERROR]: Invalid enum value 'true' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 47** [ERROR]: Relation 'deliveredAt' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveredAt
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 48** [ERROR]: Relation 'deliveryDate' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveryDate
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 49** [ERROR]: Relation 'revenue' does not exist on model 'Driver'
  - Model: Driver
  - Field: revenue
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 102** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 104** [ERROR]: Field 'violationDate' does not exist on model 'Driver'
  - Model: Driver
  - Field: violationDate
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 163** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\dashboard\deadlines\route.ts

- **Line 41** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 52** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 60** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 88** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 99** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 106** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 107** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 140** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 141** [ERROR]: Field 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 141** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 146** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 156** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 162** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 163** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 190** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 209** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 211** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 212** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 213** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 266** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\dashboard\customer-performance\route.ts

- **Line 25** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 30** [ERROR]: Relation 'include' does not exist on model 'Customer'
  - Model: Customer
  - Field: include
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 32** [ERROR]: Relation 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 36** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 38** [ERROR]: Relation 'revenue' does not exist on model 'Customer'
  - Model: Customer
  - Field: revenue
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 40** [ERROR]: Relation 'deliveredAt' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveredAt
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 41** [ERROR]: Relation 'deliveryDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryDate
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 42** [ERROR]: Relation 'pickupDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupDate
  - Suggestion: Available relations: Company, FactoringCompany...

### app\api\customers\[id]\route.ts

- **Line 24** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 29** [ERROR]: Relation 'include' does not exist on model 'Customer'
  - Model: Customer
  - Field: include
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 31** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 31** [ERROR]: Relation 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 32** [ERROR]: Field 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 32** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 34** [ERROR]: Field 'loadNumber' does not exist on model 'Customer'
  - Model: Customer
  - Field: loadNumber
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 34** [ERROR]: Relation 'loadNumber' does not exist on model 'Customer'
  - Model: Customer
  - Field: loadNumber
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 36** [ERROR]: Field 'pickupCity' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupCity
  - Suggestion: Did you mean: city?

- **Line 36** [ERROR]: Relation 'pickupCity' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupCity
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 37** [ERROR]: Field 'pickupState' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupState
  - Suggestion: Did you mean: state?

- **Line 37** [ERROR]: Relation 'pickupState' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupState
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 38** [ERROR]: Field 'deliveryCity' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryCity
  - Suggestion: Did you mean: city?

- **Line 38** [ERROR]: Relation 'deliveryCity' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryCity
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 39** [ERROR]: Field 'deliveryState' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryState
  - Suggestion: Did you mean: state?

- **Line 39** [ERROR]: Relation 'deliveryState' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryState
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 40** [ERROR]: Field 'revenue' does not exist on model 'Customer'
  - Model: Customer
  - Field: revenue
  - Suggestion: Did you mean: totalRevenue?

- **Line 40** [ERROR]: Relation 'revenue' does not exist on model 'Customer'
  - Model: Customer
  - Field: revenue
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 41** [ERROR]: Field 'pickupDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupDate
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 41** [ERROR]: Relation 'pickupDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: pickupDate
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 42** [ERROR]: Field 'deliveryDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryDate
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 42** [ERROR]: Relation 'deliveryDate' does not exist on model 'Customer'
  - Model: Customer
  - Field: deliveryDate
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 95** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 131** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 132** [ERROR]: Field 'data' does not exist on model 'Customer'
  - Model: Customer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 136** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 137** [ERROR]: Field 'data' does not exist on model 'Customer'
  - Model: Customer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 143** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 144** [ERROR]: Field 'error' does not exist on model 'Customer'
  - Model: Customer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 145** [ERROR]: Field 'code' does not exist on model 'Customer'
  - Model: Customer
  - Field: code
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 146** [ERROR]: Field 'message' does not exist on model 'Customer'
  - Model: Customer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 147** [ERROR]: Field 'details' does not exist on model 'Customer'
  - Model: Customer
  - Field: details
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 181** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 215** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 216** [ERROR]: Field 'data' does not exist on model 'Customer'
  - Model: Customer
  - Field: data
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 220** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 221** [ERROR]: Field 'message' does not exist on model 'Customer'
  - Model: Customer
  - Field: message
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 224** [ERROR]: Field 'error' does not exist on model 'Customer'
  - Model: Customer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 227** [ERROR]: Field 'success' does not exist on model 'Customer'
  - Model: Customer
  - Field: success
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 228** [ERROR]: Field 'error' does not exist on model 'Customer'
  - Model: Customer
  - Field: error
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

### app\api\customers\stats\route.ts

- **Line 47** [ERROR]: Relation 'include' does not exist on model 'Customer'
  - Model: Customer
  - Field: include
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 49** [ERROR]: Field 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, customerNumber, name...

- **Line 49** [ERROR]: Relation 'where' does not exist on model 'Customer'
  - Model: Customer
  - Field: where
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 52** [ERROR]: Relation 'select' does not exist on model 'Customer'
  - Model: Customer
  - Field: select
  - Suggestion: Available relations: Company, FactoringCompany...

- **Line 53** [ERROR]: Relation 'revenue' does not exist on model 'Customer'
  - Model: Customer
  - Field: revenue
  - Suggestion: Available relations: Company, FactoringCompany...

### app\api\companies\switch\route.ts

- **Line 48** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 54** [ERROR]: Field 'success' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: success
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 55** [ERROR]: Field 'error' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: error
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 67** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 68** [ERROR]: Field 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 68** [ERROR]: Relation 'include' does not exist on model 'User'
  - Model: User
  - Field: include
  - Suggestion: Available relations: Company, McNumber...

- **Line 70** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 70** [ERROR]: Relation 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available relations: Company, McNumber...

- **Line 113** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 138** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 139** [ERROR]: Field 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 139** [ERROR]: Relation 'select' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: select
  - Suggestion: Available relations: Company...

### app\api\classifications\[id]\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'Classification'
  - Model: Classification
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 40** [ERROR]: Relation 'error' does not exist on model 'Classification'
  - Model: Classification
  - Field: error
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 72** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 95** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 96** [ERROR]: Field 'data' does not exist on model 'Classification'
  - Model: Classification
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 97** [ERROR]: Field 'include' does not exist on model 'Classification'
  - Model: Classification
  - Field: include
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 97** [ERROR]: Relation 'include' does not exist on model 'Classification'
  - Model: Classification
  - Field: include
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 100** [ERROR]: Field 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 100** [ERROR]: Relation 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 104** [ERROR]: Field 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 104** [ERROR]: Relation 'error' does not exist on model 'Classification'
  - Model: Classification
  - Field: error
  - Suggestion: Available relations: Company, McNumber, Classification...

- **Line 105** [ERROR]: Field 'status' does not exist on model 'Classification'
  - Model: Classification
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 130** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 146** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 160** [ERROR]: Field 'where' does not exist on model 'Classification'
  - Model: Classification
  - Field: where
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 161** [ERROR]: Field 'data' does not exist on model 'Classification'
  - Model: Classification
  - Field: data
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 164** [ERROR]: Field 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 166** [ERROR]: Field 'error' does not exist on model 'Classification'
  - Model: Classification
  - Field: error
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 168** [ERROR]: Field 'success' does not exist on model 'Classification'
  - Model: Classification
  - Field: success
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

- **Line 169** [ERROR]: Field 'status' does not exist on model 'Classification'
  - Model: Classification
  - Field: status
  - Suggestion: Available fields: id, companyId, company, mcNumberId, mcNumber...

### app\api\breakdowns\[id]\route.ts

- **Line 78** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 83** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 85** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 87** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 88** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 89** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 90** [ERROR]: Relation 'year' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: year
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 91** [ERROR]: Relation 'vin' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: vin
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 92** [ERROR]: Relation 'licensePlate' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: licensePlate
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 96** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 98** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 99** [ERROR]: Relation 'customer' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: customer
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 100** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 101** [ERROR]: Relation 'name' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: name
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 107** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 109** [ERROR]: Relation 'user' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: user
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 110** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 112** [ERROR]: Relation 'firstName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: firstName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 113** [ERROR]: Relation 'lastName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: lastName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 114** [ERROR]: Relation 'email' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: email
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 115** [ERROR]: Relation 'phone' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: phone
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 121** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 124** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 126** [ERROR]: Relation 'type' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: type
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 127** [ERROR]: Relation 'title' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: title
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 128** [ERROR]: Relation 'fileName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: fileName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 129** [ERROR]: Relation 'fileUrl' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: fileUrl
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 130** [ERROR]: Relation 'fileSize' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: fileSize
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 131** [ERROR]: Relation 'mimeType' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: mimeType
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 136** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 138** [ERROR]: Relation 'paymentNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 139** [ERROR]: Relation 'amount' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: amount
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 140** [ERROR]: Relation 'paymentDate' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentDate
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 141** [ERROR]: Relation 'paymentMethod' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: paymentMethod
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 142** [ERROR]: Relation 'type' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: type
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 143** [ERROR]: Relation 'referenceNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: referenceNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 144** [ERROR]: Relation 'notes' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: notes
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 145** [ERROR]: Relation 'hasReceipt' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: hasReceipt
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 146** [ERROR]: Relation 'hasInvoice' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: hasInvoice
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 147** [ERROR]: Relation 'documentIds' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: documentIds
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 149** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 151** [ERROR]: Relation 'number' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: number
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 157** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 159** [ERROR]: Relation 'number' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: number
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 171** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 189** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 207** [ERROR]: Invalid enum value '401' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 214** [ERROR]: Invalid enum value '403' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 232** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 233** [ERROR]: Field 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 233** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 255** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 256** [ERROR]: Field 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 256** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 290** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 295** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 297** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 299** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 300** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 301** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 305** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 307** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 311** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 313** [ERROR]: Relation 'user' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: user
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 314** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 315** [ERROR]: Relation 'firstName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: firstName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 316** [ERROR]: Relation 'lastName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: lastName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 339** [ERROR]: Invalid enum value '400' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 352** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 370** [ERROR]: Invalid enum value '401' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 377** [ERROR]: Invalid enum value '403' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 383** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 406** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\batches\[id]\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 32** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 34** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 36** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 37** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 41** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 42** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 43** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 44** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 47** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 48** [ERROR]: Relation 'customerNumber' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customerNumber
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 113** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 130** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 131** [ERROR]: Field 'data' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: data
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 132** [ERROR]: Invalid enum value 'validated' for field 'postStatus' (BatchPostStatus)
  - Model: InvoiceBatch
  - Field: postStatus
  - Suggestion: Valid values: UNPOSTED, POSTED, PAID

- **Line 136** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 138** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 140** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 141** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 145** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 146** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 147** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 148** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 149** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 151** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 210** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 241** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 245** [ERROR]: Field 'success' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: success
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 246** [ERROR]: Field 'message' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: message
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 249** [ERROR]: Field 'error' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: error
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 252** [ERROR]: Field 'success' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: success
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 253** [ERROR]: Field 'error' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: error
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

### app\api\automation\settlement-generation\route.ts

- **Line 102** [ERROR]: Field 'where' does not exist on model 'ActivityLog'
  - Model: ActivityLog
  - Field: where
  - Suggestion: Available fields: id, companyId, company, userId, user...

### app\api\auth\register\route.ts

- **Line 16** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 22** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 23** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 24** [ERROR]: Field 'code' does not exist on model 'User'
  - Model: User
  - Field: code
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 25** [ERROR]: Field 'message' does not exist on model 'User'
  - Model: User
  - Field: message
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 57** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

### app\api\analytics\revenue-forecast\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 151** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\analytics\revenue\route.ts

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 55** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 56** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 130** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\analytics\profitability\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 41** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 43** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 45** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 49** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 51** [ERROR]: Relation 'payType' does not exist on model 'Load'
  - Model: Load
  - Field: payType
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 52** [ERROR]: Relation 'payRate' does not exist on model 'Load'
  - Model: Load
  - Field: payRate
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 214** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\analytics\fuel\route.ts

- **Line 46** [ERROR]: Relation 'include' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: include
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 50** [ERROR]: Relation 'truckNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 56** [ERROR]: Relation 'driverNumber' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: driverNumber
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 57** [ERROR]: Relation 'user' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: user
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 58** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 59** [ERROR]: Relation 'firstName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: firstName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 60** [ERROR]: Relation 'lastName' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: lastName
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 76** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 86** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 91** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 92** [ERROR]: Relation 'totalDistance' does not exist on model 'Load'
  - Model: Load
  - Field: totalDistance
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 192** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\analytics\empty-miles\route.ts

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 46** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 58** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 60** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 64** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 66** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 67** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 68** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 69** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 70** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 76** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 77** [ERROR]: Relation 'totalDistance' does not exist on model 'Load'
  - Model: Load
  - Field: totalDistance
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 180** [ERROR]: Field 'where' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, driverId, driver...

- **Line 187** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 190** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 191** [ERROR]: Relation 'loads' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: loads
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 192** [ERROR]: Field 'where' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, driverId, driver...

- **Line 192** [ERROR]: Relation 'where' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: where
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 194** [ERROR]: Field 'pickupDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: pickupDate
  - Suggestion: Did you mean: date?

- **Line 194** [ERROR]: Relation 'pickupDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: pickupDate
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 195** [ERROR]: Field 'deliveryDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: deliveryDate
  - Suggestion: Did you mean: date?

- **Line 195** [ERROR]: Relation 'deliveryDate' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: deliveryDate
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 196** [ERROR]: Field 'deliveredAt' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: deliveredAt
  - Suggestion: Available fields: id, truckId, truck, driverId, driver...

- **Line 196** [ERROR]: Relation 'deliveredAt' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: deliveredAt
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 199** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 200** [ERROR]: Relation 'route' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: route
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 201** [ERROR]: Relation 'select' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: select
  - Suggestion: Available relations: Truck, Driver, McNumber...

- **Line 202** [ERROR]: Relation 'totalDistance' does not exist on model 'FuelEntry'
  - Model: FuelEntry
  - Field: totalDistance
  - Suggestion: Available relations: Truck, Driver, McNumber...

### app\api\analytics\dashboard\route.ts

- **Line 59** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 72** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 85** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 98** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 126** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 136** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 144** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 152** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 160** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 169** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 178** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 187** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 196** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 205** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 257** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\ai\safety-risk\route.ts

- **Line 32** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 41** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 48** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 57** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 85** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 97** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\ai\route-optimization\route.ts

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 45** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 61** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 92** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 104** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\ai\maintenance-prediction\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 37** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 64** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 76** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\ai\load-matching\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 39** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 46** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 55** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 63** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 72** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 101** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 113** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\advances\request\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 46** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 53** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 67** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 98** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 110** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\accessorial-charges\[id]\route.ts

- **Line 22** [ERROR]: Field 'where' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 26** [ERROR]: Relation 'include' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: include
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 28** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 30** [ERROR]: Relation 'loadNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 31** [ERROR]: Relation 'customer' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 32** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 33** [ERROR]: Relation 'name' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 34** [ERROR]: Relation 'customerNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customerNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 40** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 42** [ERROR]: Relation 'invoiceNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 46** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 48** [ERROR]: Relation 'firstName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 49** [ERROR]: Relation 'lastName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 61** [ERROR]: Invalid enum value '404' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 76** [ERROR]: Invalid enum value '500' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 91** [ERROR]: Invalid enum value '401' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 109** [ERROR]: Field 'where' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 121** [ERROR]: Invalid enum value '404' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

- **Line 158** [ERROR]: Field 'where' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: where
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 159** [ERROR]: Field 'data' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: data
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 160** [ERROR]: Field 'include' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: include
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 160** [ERROR]: Relation 'include' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: include
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 162** [ERROR]: Field 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 162** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 164** [ERROR]: Field 'loadNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber
  - Suggestion: Did you mean: load?

- **Line 164** [ERROR]: Relation 'loadNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 165** [ERROR]: Field 'customer' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 165** [ERROR]: Relation 'customer' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 166** [ERROR]: Field 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 166** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 167** [ERROR]: Field 'name' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name
  - Suggestion: Available fields: id, companyId, company, loadId, load...

- **Line 167** [ERROR]: Relation 'name' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 173** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 175** [ERROR]: Relation 'invoiceNumber' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: invoiceNumber
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 179** [ERROR]: Relation 'select' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: select
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 181** [ERROR]: Relation 'firstName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: firstName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 182** [ERROR]: Relation 'lastName' does not exist on model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: lastName
  - Suggestion: Available relations: Company, Load, Invoice, User...

- **Line 199** [ERROR]: Invalid enum value '500' for field 'status' (AccessorialChargeStatus)
  - Model: AccessorialCharge
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, BILLED, PAID, DENIED

### app\api\settlements\[id]\breakdown\route.ts

- **Line 27** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 30** [ERROR]: Field 'companyId' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 33** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 36** [ERROR]: Relation 'user' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: user
  - Suggestion: Available relations: Driver, User...

- **Line 37** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 38** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 39** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 40** [ERROR]: Relation 'email' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: email
  - Suggestion: Available relations: Driver, User...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 52** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 53** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 57** [ERROR]: Relation 'include' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: include
  - Suggestion: Available relations: Driver, User...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: select
  - Suggestion: Available relations: Driver, User...

- **Line 60** [ERROR]: Relation 'firstName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: firstName
  - Suggestion: Available relations: Driver, User...

- **Line 61** [ERROR]: Relation 'lastName' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: lastName
  - Suggestion: Available relations: Driver, User...

- **Line 78** [ERROR]: Invalid enum value '404' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 85** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 88** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 90** [ERROR]: Relation 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 91** [ERROR]: Field 'approvalStatus' does not exist on model 'Load'
  - Model: Load
  - Field: approvalStatus
  - Suggestion: Did you mean: status?

- **Line 95** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 96** [ERROR]: Field 'approvalStatus' does not exist on model 'Load'
  - Model: Load
  - Field: approvalStatus
  - Suggestion: Did you mean: status?

- **Line 100** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 147** [ERROR]: Invalid enum value 'settlement' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 182** [ERROR]: Invalid enum value 'approval' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 201** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\settlements\[id]\approve\route.ts

- **Line 49** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 52** [ERROR]: Field 'companyId' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 63** [ERROR]: Invalid enum value '404' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 77** [ERROR]: Invalid enum value '400' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 91** [ERROR]: Invalid enum value '400' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 106** [ERROR]: Field 'where' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 107** [ERROR]: Field 'data' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: data
  - Suggestion: Available fields: id, driverId, driver, settlementNumber, loadIds...

- **Line 108** [ERROR]: Invalid enum value 'validated' for field 'paymentMethod' (PaymentMethod)
  - Model: Settlement
  - Field: paymentMethod
  - Suggestion: Valid values: CHECK, WIRE, ACH, CREDIT_CARD, CASH, OTHER, FACTOR, QUICK_PAY

- **Line 131** [ERROR]: Invalid enum value '400' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

- **Line 143** [ERROR]: Invalid enum value '500' for field 'status' (SettlementStatus)
  - Model: Settlement
  - Field: status
  - Suggestion: Valid values: PENDING, APPROVED, PAID, DISPUTED

### app\api\settings\users\[id]\route.ts

- **Line 56** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 84** [ERROR]: Field 'where' does not exist on model 'McNumber'
  - Model: McNumber
  - Field: where
  - Suggestion: Available fields: id, companyId, company, companyName, type...

- **Line 128** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 134** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 135** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 148** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 149** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 150** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 150** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 156** [ERROR]: Invalid enum value 'true' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

- **Line 162** [ERROR]: Field 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 162** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 164** [ERROR]: Field 'number' does not exist on model 'User'
  - Model: User
  - Field: number
  - Suggestion: Did you mean: mcNumberId, mcNumber?

- **Line 164** [ERROR]: Relation 'number' does not exist on model 'User'
  - Model: User
  - Field: number
  - Suggestion: Available relations: Company, McNumber...

- **Line 165** [ERROR]: Field 'companyName' does not exist on model 'User'
  - Model: User
  - Field: companyName
  - Suggestion: Did you mean: company?

- **Line 165** [ERROR]: Relation 'companyName' does not exist on model 'User'
  - Model: User
  - Field: companyName
  - Suggestion: Available relations: Company, McNumber...

- **Line 248** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 267** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 268** [ERROR]: Field 'data' does not exist on model 'User'
  - Model: User
  - Field: data
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 272** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 273** [ERROR]: Field 'message' does not exist on model 'User'
  - Model: User
  - Field: message
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 276** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 279** [ERROR]: Field 'success' does not exist on model 'User'
  - Model: User
  - Field: success
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 280** [ERROR]: Field 'error' does not exist on model 'User'
  - Model: User
  - Field: error
  - Suggestion: Available fields: id, email, password, firstName, lastName...

### app\api\settings\custom-fields\[id]\route.ts

- **Line 36** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 91** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 114** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 117** [ERROR]: Invalid enum value 'newEntityType' for field 'entityType' (CustomFieldEntityType)
  - Model: CustomField
  - Field: entityType
  - Suggestion: Valid values: LOAD, DRIVER, CUSTOMER, TRUCK, TRAILER, INVOICE

- **Line 150** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 151** [ERROR]: Field 'data' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 155** [ERROR]: Field 'success' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 156** [ERROR]: Field 'data' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: data
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 203** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 220** [ERROR]: Field 'where' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 224** [ERROR]: Field 'success' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 225** [ERROR]: Field 'message' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: message
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 228** [ERROR]: Field 'error' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 231** [ERROR]: Field 'success' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: success
  - Suggestion: Available fields: id, companyId, company, name, label...

- **Line 232** [ERROR]: Field 'error' does not exist on model 'CustomField'
  - Model: CustomField
  - Field: error
  - Suggestion: Available fields: id, companyId, company, name, label...

### app\api\safety\trainings\[id]\route.ts

- **Line 51** [ERROR]: Field 'where' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 56** [ERROR]: Relation 'include' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 58** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 60** [ERROR]: Relation 'driverNumber' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber
  - Suggestion: Available relations: Company, Driver...

- **Line 61** [ERROR]: Relation 'user' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 62** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 63** [ERROR]: Relation 'firstName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName
  - Suggestion: Available relations: Company, Driver...

- **Line 64** [ERROR]: Relation 'lastName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName
  - Suggestion: Available relations: Company, Driver...

- **Line 76** [ERROR]: Invalid enum value '404' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 94** [ERROR]: Invalid enum value '500' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 108** [ERROR]: Invalid enum value '401' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 115** [ERROR]: Invalid enum value '403' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 124** [ERROR]: Field 'where' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 134** [ERROR]: Invalid enum value '404' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 151** [ERROR]: Field 'where' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 152** [ERROR]: Field 'data' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 153** [ERROR]: Field 'include' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 153** [ERROR]: Relation 'include' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 155** [ERROR]: Field 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 155** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 157** [ERROR]: Field 'driverNumber' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber
  - Suggestion: Did you mean: driver?

- **Line 157** [ERROR]: Relation 'driverNumber' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber
  - Suggestion: Available relations: Company, Driver...

- **Line 158** [ERROR]: Field 'user' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 158** [ERROR]: Relation 'user' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 159** [ERROR]: Field 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 159** [ERROR]: Relation 'select' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: select
  - Suggestion: Available relations: Company, Driver...

- **Line 160** [ERROR]: Field 'firstName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 160** [ERROR]: Relation 'firstName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName
  - Suggestion: Available relations: Company, Driver...

- **Line 161** [ERROR]: Field 'lastName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 161** [ERROR]: Relation 'lastName' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName
  - Suggestion: Available relations: Company, Driver...

- **Line 184** [ERROR]: Invalid enum value '400' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 197** [ERROR]: Invalid enum value '500' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 211** [ERROR]: Invalid enum value '401' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 218** [ERROR]: Invalid enum value '403' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 224** [ERROR]: Field 'where' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 234** [ERROR]: Invalid enum value '404' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

- **Line 239** [ERROR]: Field 'where' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 240** [ERROR]: Field 'data' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 244** [ERROR]: Field 'success' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: success
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 245** [ERROR]: Field 'message' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: message
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 247** [ERROR]: Field 'error' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: error
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 248** [ERROR]: Field 'training' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: training
  - Suggestion: Did you mean: trainingType, trainingName, trainingDate?

- **Line 251** [ERROR]: Field 'success' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: success
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 252** [ERROR]: Field 'error' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: error
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 253** [ERROR]: Field 'code' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: code
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 254** [ERROR]: Field 'message' does not exist on model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: message
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 257** [ERROR]: Invalid enum value '500' for field 'status' (SafetyTrainingStatus)
  - Model: SafetyTraining
  - Field: status
  - Suggestion: Valid values: SCHEDULED, IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED

### app\api\safety\incidents\[id]\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 21** [ERROR]: Field 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 21** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 22** [ERROR]: Field 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 22** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 28** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 35** [ERROR]: Relation 'document' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: document
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 40** [ERROR]: Relation 'document' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: document
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 44** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 45** [ERROR]: Relation 'document' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: document
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 61** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 81** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 82** [ERROR]: Field 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 82** [ERROR]: Relation 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 86** [ERROR]: Field 'error' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: error
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 90** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 91** [ERROR]: Field 'data' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 92** [ERROR]: Invalid enum value 'body' for field 'incidentType' (SafetyIncidentType)
  - Model: SafetyIncident
  - Field: incidentType
  - Suggestion: Valid values: ACCIDENT, COLLISION, ROLLOVER, FIRE, SPILL, INJURY, FATALITY, HAZMAT_INCIDENT, EQUIPMENT_FAILURE, DRIVER_ERROR, OTHER

- **Line 93** [ERROR]: Invalid enum value 'body' for field 'severity' (SafetySeverity)
  - Model: SafetyIncident
  - Field: severity
  - Suggestion: Valid values: MINOR, MODERATE, MAJOR, CRITICAL, FATAL

- **Line 105** [ERROR]: Invalid enum value 'body' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 107** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 109** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 110** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 122** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

### app\api\safety\drug-tests\random-selection\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: where
  - Suggestion: Available fields: id, companyId, company, poolType, quarter...

- **Line 29** [ERROR]: Field 'companyId_poolType_quarter_year' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: companyId_poolType_quarter_year
  - Suggestion: Did you mean: id, companyId, company?

- **Line 31** [ERROR]: Invalid enum value 'poolType' for field 'poolType' (PoolType)
  - Model: TestingPool
  - Field: poolType
  - Suggestion: Valid values: DRUG, ALCOHOL

- **Line 36** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 39** [ERROR]: Relation 'driver' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: driver
  - Suggestion: Available relations: Company...

- **Line 40** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 41** [ERROR]: Relation 'user' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: user
  - Suggestion: Available relations: Company...

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 62** [ERROR]: Invalid enum value 'poolType' for field 'poolType' (PoolType)
  - Model: TestingPool
  - Field: poolType
  - Suggestion: Valid values: DRUG, ALCOHOL

- **Line 72** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 74** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 75** [ERROR]: Relation 'driver' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: driver
  - Suggestion: Available relations: Company...

- **Line 76** [ERROR]: Relation 'include' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 77** [ERROR]: Relation 'user' does not exist on model 'TestingPool'
  - Model: TestingPool
  - Field: user
  - Suggestion: Available relations: Company...

- **Line 114** [ERROR]: Relation 'include' does not exist on model 'RandomSelection'
  - Model: RandomSelection
  - Field: include
  - Suggestion: Available relations: Company, TestingPool...

- **Line 116** [ERROR]: Relation 'include' does not exist on model 'RandomSelection'
  - Model: RandomSelection
  - Field: include
  - Suggestion: Available relations: Company, TestingPool...

- **Line 117** [ERROR]: Relation 'driver' does not exist on model 'RandomSelection'
  - Model: RandomSelection
  - Field: driver
  - Suggestion: Available relations: Company, TestingPool...

- **Line 118** [ERROR]: Relation 'include' does not exist on model 'RandomSelection'
  - Model: RandomSelection
  - Field: include
  - Suggestion: Available relations: Company, TestingPool...

- **Line 119** [ERROR]: Relation 'user' does not exist on model 'RandomSelection'
  - Model: RandomSelection
  - Field: user
  - Suggestion: Available relations: Company, TestingPool...

### app\api\safety\compliance\fmcsa\route.ts

- **Line 13** [ERROR]: Field 'where' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: where
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 14** [ERROR]: Field 'include' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: include
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 14** [ERROR]: Relation 'include' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 16** [ERROR]: Field 'orderBy' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: orderBy
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 16** [ERROR]: Relation 'orderBy' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: orderBy
  - Suggestion: Available relations: Company...

- **Line 17** [ERROR]: Field 'take' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: take
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 20** [ERROR]: Field 'where' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: where
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 21** [ERROR]: Field 'orderBy' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: orderBy
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 31** [ERROR]: Invalid enum value 'null' for field 'safetyRating' (SafetyRating)
  - Model: FMCSACompliance
  - Field: safetyRating
  - Suggestion: Valid values: SATISFACTORY, CONDITIONAL, UNSATISFACTORY

- **Line 33** [ERROR]: Relation 'include' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 61** [ERROR]: Field 'where' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: where
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 62** [ERROR]: Field 'update' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: update
  - Suggestion: Did you mean: updatedAt?

- **Line 63** [ERROR]: Invalid enum value 'body' for field 'safetyRating' (SafetyRating)
  - Model: FMCSACompliance
  - Field: safetyRating
  - Suggestion: Valid values: SATISFACTORY, CONDITIONAL, UNSATISFACTORY

- **Line 69** [ERROR]: Invalid enum value 'body' for field 'safetyRating' (SafetyRating)
  - Model: FMCSACompliance
  - Field: safetyRating
  - Suggestion: Valid values: SATISFACTORY, CONDITIONAL, UNSATISFACTORY

- **Line 73** [ERROR]: Relation 'include' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: include
  - Suggestion: Available relations: Company...

- **Line 75** [ERROR]: Relation 'orderBy' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: orderBy
  - Suggestion: Available relations: Company...

- **Line 79** [ERROR]: Field 'where' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: where
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 80** [ERROR]: Field 'orderBy' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: orderBy
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

### app\api\safety\compliance\dataq\route.ts

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 27** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 28** [ERROR]: Relation 'inspection' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: inspection
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 29** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 30** [ERROR]: Relation 'driver' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: driver
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 31** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 32** [ERROR]: Relation 'user' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: user
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 49** [ERROR]: Invalid enum value '500' for field 'status' (DataQStatus)
  - Model: DataQSubmission
  - Field: status
  - Suggestion: Valid values: PENDING, ACCEPTED, REJECTED

- **Line 74** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 76** [ERROR]: Relation 'include' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: include
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 77** [ERROR]: Relation 'inspection' does not exist on model 'DataQSubmission'
  - Model: DataQSubmission
  - Field: inspection
  - Suggestion: Available relations: Company, RoadsideViolation...

- **Line 86** [ERROR]: Field 'where' does not exist on model 'RoadsideViolation'
  - Model: RoadsideViolation
  - Field: where
  - Suggestion: Available fields: id, inspectionId, inspection, violationCode, violationDescription...

- **Line 87** [ERROR]: Field 'data' does not exist on model 'RoadsideViolation'
  - Model: RoadsideViolation
  - Field: data
  - Suggestion: Did you mean: dataQSubmitted, dataQStatus, dataQSubmissionId?

### app\api\safety\compliance\csa-scores\route.ts

- **Line 16** [ERROR]: Field 'where' does not exist on model 'CSAScore'
  - Model: CSAScore
  - Field: where
  - Suggestion: Available fields: id, companyId, company, scoreDate, basicCategory...

- **Line 58** [ERROR]: Invalid enum value 'body' for field 'basicCategory' (CSABasicCategory)
  - Model: CSAScore
  - Field: basicCategory
  - Suggestion: Valid values: UNSAFE_DRIVING, CRASH_INDICATOR, HOS_COMPLIANCE, VEHICLE_MAINTENANCE, CONTROLLED_SUBSTANCES, HAZMAT_COMPLIANCE, DRIVER_FITNESS

- **Line 62** [ERROR]: Invalid enum value 'body' for field 'trend' (CSATrend)
  - Model: CSAScore
  - Field: trend
  - Suggestion: Valid values: IMPROVING, DECLINING, STABLE

### app\api\mobile\loads\[id]\route.ts

- **Line 43** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 56** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 62** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 67** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 69** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 70** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 71** [ERROR]: Relation 'phone' does not exist on model 'Load'
  - Model: Load
  - Field: phone
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 72** [ERROR]: Relation 'email' does not exist on model 'Load'
  - Model: Load
  - Field: email
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 73** [ERROR]: Relation 'address' does not exist on model 'Load'
  - Model: Load
  - Field: address
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 74** [ERROR]: Relation 'city' does not exist on model 'Load'
  - Model: Load
  - Field: city
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 75** [ERROR]: Relation 'state' does not exist on model 'Load'
  - Model: Load
  - Field: state
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 76** [ERROR]: Relation 'zip' does not exist on model 'Load'
  - Model: Load
  - Field: zip
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 92** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 100** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 138** [ERROR]: Invalid enum value 'h' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 158** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 176** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 181** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 194** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 204** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 217** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 223** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 224** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 225** [ERROR]: Invalid enum value 'validated' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 233** [ERROR]: Invalid enum value 'validated' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 246** [ERROR]: Invalid enum value 'updatedLoad' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 260** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 270** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: LoadStatusHistory
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\mobile\hos\status\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 34** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 43** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 58** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 112** [ERROR]: Invalid enum value 'todayRecord' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 128** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\mobile\driver\current-truck\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 26** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 28** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 30** [ERROR]: Relation 'truckNumber' does not exist on model 'Driver'
  - Model: Driver
  - Field: truckNumber
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 31** [ERROR]: Relation 'make' does not exist on model 'Driver'
  - Model: Driver
  - Field: make
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 32** [ERROR]: Relation 'model' does not exist on model 'Driver'
  - Model: Driver
  - Field: model
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 33** [ERROR]: Relation 'year' does not exist on model 'Driver'
  - Model: Driver
  - Field: year
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 45** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 65** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\loads\[id]\split\route.ts

- **Line 44** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 57** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 67** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 80** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 87** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 100** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 135** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 148** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 164** [ERROR]: Invalid enum value '401' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 170** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 183** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 203** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\[id]\pod-upload\route.ts

- **Line 36** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 49** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Document'
  - Model: Document
  - Field: where
  - Suggestion: Available fields: id, companyId, company, type, title...

- **Line 58** [ERROR]: Invalid enum value 'POD' for field 'type' (DocumentType)
  - Model: Document
  - Field: type
  - Suggestion: Valid values: BOL // Bill of Lading, POD // Proof of Delivery, INVOICE, RATE_CONFIRMATION, DRIVER_LICENSE, MEDICAL_CARD, INSURANCE, REGISTRATION, INSPECTION, LEASE_AGREEMENT, W9, COI // Certificate of Insurance, OTHER

### app\api\loads\[id]\driver-location\route.ts

- **Line 26** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 31** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 33** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 34** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 44** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 78** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 148** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\[id]\expenses\route.ts

- **Line 58** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 71** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 104** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 116** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 134** [ERROR]: Invalid enum value '401' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 143** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 156** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 185** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\[id]\complete\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 41** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 55** [ERROR]: Invalid enum value '400' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 62** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 63** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 84** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 108** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\[id]\accounting-status\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 33** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 35** [ERROR]: Relation 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 36** [ERROR]: Field 'approvalStatus' does not exist on model 'Load'
  - Model: Load
  - Field: approvalStatus
  - Suggestion: Did you mean: status?

- **Line 36** [ERROR]: Relation 'approvalStatus' does not exist on model 'Load'
  - Model: Load
  - Field: approvalStatus
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 42** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 43** [ERROR]: Field 'approvalStatus' does not exist on model 'Load'
  - Model: Load
  - Field: approvalStatus
  - Suggestion: Did you mean: status?

- **Line 47** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 56** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 57** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 58** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 59** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 60** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 74** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 99** [ERROR]: Invalid enum value 'load' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 100** [ERROR]: Invalid enum value 'load' for field 'accountingSyncStatus' (AccountingSyncStatus)
  - Model: Load
  - Field: accountingSyncStatus
  - Suggestion: Valid values: NOT_SYNCED, PENDING_SYNC, SYNCED, SYNC_FAILED, REQUIRES_REVIEW

- **Line 132** [ERROR]: Invalid enum value 'charge' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 146** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\loads\[id]\assign\route.ts

- **Line 36** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 49** [ERROR]: Invalid enum value '404' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

- **Line 59** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 65** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 68** [ERROR]: Invalid enum value 'true' for field 'payType' (PayType)
  - Model: Driver
  - Field: payType
  - Suggestion: Valid values: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY

- **Line 79** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 86** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 100** [ERROR]: Invalid enum value '404' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 107** [ERROR]: Invalid enum value 'ASSIGNED' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 142** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 143** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 144** [ERROR]: Field 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 144** [ERROR]: Relation 'include' does not exist on model 'Load'
  - Model: Load
  - Field: include
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 146** [ERROR]: Field 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 146** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 148** [ERROR]: Field 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 148** [ERROR]: Relation 'name' does not exist on model 'Load'
  - Model: Load
  - Field: name
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 149** [ERROR]: Field 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Did you mean: customer?

- **Line 149** [ERROR]: Relation 'customerNumber' does not exist on model 'Load'
  - Model: Load
  - Field: customerNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 153** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 155** [ERROR]: Relation 'driverNumber' does not exist on model 'Load'
  - Model: Load
  - Field: driverNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 156** [ERROR]: Relation 'user' does not exist on model 'Load'
  - Model: Load
  - Field: user
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 157** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 158** [ERROR]: Relation 'firstName' does not exist on model 'Load'
  - Model: Load
  - Field: firstName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 159** [ERROR]: Relation 'lastName' does not exist on model 'Load'
  - Model: Load
  - Field: lastName
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 165** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 167** [ERROR]: Relation 'truckNumber' does not exist on model 'Load'
  - Model: Load
  - Field: truckNumber
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 196** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 197** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 204** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 205** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 229** [ERROR]: Invalid enum value '400' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 239** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\invoices\[id]\submit-to-factor\route.ts

- **Line 42** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 45** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 48** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 50** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 52** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 65** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 79** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 92** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 108** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 114** [ERROR]: Field 'where' does not exist on model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: where
  - Suggestion: Available fields: id, companyId, company, name, accountNumber...

- **Line 136** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 137** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 138** [ERROR]: Invalid enum value 'FactoringStatus' for field 'factoringStatus' (FactoringStatus)
  - Model: Invoice
  - Field: factoringStatus
  - Suggestion: Valid values: NOT_FACTORED, SUBMITTED_TO_FACTOR, FUNDED, RESERVE_RELEASED

- **Line 143** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 145** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 147** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 230** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\[id]\send\route.ts

- **Line 22** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 25** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 28** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 30** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 32** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 33** [ERROR]: Relation 'email' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: email
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 34** [ERROR]: Relation 'billingEmail' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: billingEmail
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 46** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 52** [ERROR]: Field 'where' does not exist on model 'Company'
  - Model: Company
  - Field: where
  - Suggestion: Available fields: id, name, dotNumber, mcNumber, address...

- **Line 53** [ERROR]: Field 'select' does not exist on model 'Company'
  - Model: Company
  - Field: select
  - Suggestion: Did you mean: randomSelections?

- **Line 53** [ERROR]: Relation 'select' does not exist on model 'Company'
  - Model: Company
  - Field: select
  - Suggestion: Available relations: ...

- **Line 110** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 111** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 132** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\[id]\resend\route.ts

- **Line 39** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 42** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 45** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 49** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 50** [ERROR]: Relation 'email' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: email
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 51** [ERROR]: Relation 'billingEmail' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: billingEmail
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 52** [ERROR]: Relation 'billingEmails' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: billingEmails
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 64** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 85** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 107** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 114** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 115** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 147** [ERROR]: Invalid enum value '500' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

### app\api\invoices\reports\transactions\route.ts

- **Line 37** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 39** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 43** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: select
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 47** [ERROR]: Relation 'name' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: name
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 48** [ERROR]: Relation 'customerNumber' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: customerNumber
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 57** [ERROR]: Field 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 58** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 63** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 65** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 66** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 69** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 70** [ERROR]: Relation 'customerNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: customerNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 94** [ERROR]: Invalid enum value 'PAYMENT' for field 'type' (PaymentType)
  - Model: Payment
  - Field: type
  - Suggestion: Valid values: INVOICE, FUEL, BREAKDOWN, OTHER

### app\api\integrations\samsara\sync\route.ts

- **Line 46** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 74** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 75** [ERROR]: Field 'data' does not exist on model 'Driver'
  - Model: Driver
  - Field: data
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 75** [ERROR]: Invalid enum value 'newStatus' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 83** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 94** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 95** [ERROR]: Field 'data' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: data
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 96** [ERROR]: Invalid enum value 'newStatus' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 110** [ERROR]: Invalid enum value 'newStatus' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 148** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 163** [ERROR]: Invalid enum value '401' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 199** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\integrations\quickbooks\sync-expenses\route.ts

- **Line 37** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 38** [ERROR]: Field 'companyId_provider' does not exist on model 'Integration'
  - Model: Integration
  - Field: companyId_provider
  - Suggestion: Did you mean: id, companyId, company?

- **Line 110** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 111** [ERROR]: Field 'data' does not exist on model 'Integration'
  - Model: Integration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 178** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 195** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 196** [ERROR]: Field 'data' does not exist on model 'Load'
  - Model: Load
  - Field: data
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 215** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 216** [ERROR]: Field 'data' does not exist on model 'Integration'
  - Model: Integration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

### app\api\integrations\quickbooks\sync-invoice\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 36** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: include
  - Suggestion: Available relations: Customer, FactoringCompany, User...

- **Line 50** [ERROR]: Invalid enum value '404' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 57** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 66** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 67** [ERROR]: Field 'companyId_provider' does not exist on model 'Integration'
  - Model: Integration
  - Field: companyId_provider
  - Suggestion: Did you mean: id, companyId, company?

- **Line 141** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 142** [ERROR]: Field 'data' does not exist on model 'Integration'
  - Model: Integration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 204** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 205** [ERROR]: Field 'data' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: data
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 214** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 215** [ERROR]: Field 'data' does not exist on model 'Integration'
  - Model: Integration
  - Field: data
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 253** [ERROR]: Field 'where' does not exist on model 'Integration'
  - Model: Integration
  - Field: where
  - Suggestion: Available fields: id, companyId, company, provider, isActive...

- **Line 254** [ERROR]: Field 'companyId_provider' does not exist on model 'Integration'
  - Model: Integration
  - Field: companyId_provider
  - Suggestion: Did you mean: id, companyId, company?

### app\api\hos\status\[driverId]\route.ts

- **Line 23** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 36** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 45** [ERROR]: Field 'where' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, date, status...

- **Line 161** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\fleet\trucks\breakdown-stats\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 25** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 29** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 30** [ERROR]: Invalid enum value 'true' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 31** [ERROR]: Invalid enum value 'true' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 104** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\on-call\users\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 29** [ERROR]: Relation 'select' does not exist on model 'User'
  - Model: User
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 35** [ERROR]: Invalid enum value 'true' for field 'role' (UserRole)
  - Model: User
  - Field: role
  - Suggestion: Valid values: ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

### app\api\fleet\trailers\breakdown-stats\route.ts

- **Line 23** [ERROR]: Field 'where' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: where
  - Suggestion: Available fields: id, companyId, company, trailerNumber, vin...

- **Line 27** [ERROR]: Relation 'select' does not exist on model 'Trailer'
  - Model: Trailer
  - Field: select
  - Suggestion: Available relations: Company, McNumber, Truck, Driver...

- **Line 40** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 49** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 50** [ERROR]: Invalid enum value 'true' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 51** [ERROR]: Invalid enum value 'true' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 112** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\on-call\shifts\route.ts

- **Line 49** [ERROR]: Relation 'include' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 53** [ERROR]: Relation 'firstName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: firstName
  - Suggestion: Available relations: Company, User...

- **Line 54** [ERROR]: Relation 'lastName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: lastName
  - Suggestion: Available relations: Company, User...

- **Line 55** [ERROR]: Relation 'email' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: email
  - Suggestion: Available relations: Company, User...

- **Line 56** [ERROR]: Relation 'phone' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: phone
  - Suggestion: Available relations: Company, User...

- **Line 74** [ERROR]: Invalid enum value 'shift' for field 'shiftType' (OnCallShiftType)
  - Model: OnCallShift
  - Field: shiftType
  - Suggestion: Valid values: DAY, NIGHT, WEEKEND, HOLIDAY, CUSTOM

- **Line 126** [ERROR]: Field 'where' does not exist on model 'User'
  - Model: User
  - Field: where
  - Suggestion: Available fields: id, email, password, firstName, lastName...

- **Line 146** [ERROR]: Invalid enum value 'validatedData' for field 'shiftType' (OnCallShiftType)
  - Model: OnCallShift
  - Field: shiftType
  - Suggestion: Valid values: DAY, NIGHT, WEEKEND, HOLIDAY, CUSTOM

- **Line 150** [ERROR]: Relation 'include' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 152** [ERROR]: Relation 'select' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 154** [ERROR]: Relation 'firstName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: firstName
  - Suggestion: Available relations: Company, User...

- **Line 155** [ERROR]: Relation 'lastName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: lastName
  - Suggestion: Available relations: Company, User...

- **Line 156** [ERROR]: Relation 'email' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: email
  - Suggestion: Available relations: Company, User...

- **Line 157** [ERROR]: Relation 'phone' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: phone
  - Suggestion: Available relations: Company, User...

- **Line 174** [ERROR]: Invalid enum value 'shift' for field 'shiftType' (OnCallShiftType)
  - Model: OnCallShift
  - Field: shiftType
  - Suggestion: Valid values: DAY, NIGHT, WEEKEND, HOLIDAY, CUSTOM

### app\api\fleet\maintenance\stats\route.ts

- **Line 21** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 26** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 34** [ERROR]: Field 'where' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 37** [ERROR]: Field 'deletedAt' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: deletedAt
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 42** [ERROR]: Relation 'select' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: select
  - Suggestion: Available relations: Truck, Company...

- **Line 45** [ERROR]: Invalid enum value 'true' for field 'type' (MaintenanceType)
  - Model: MaintenanceRecord
  - Field: type
  - Suggestion: Valid values: OIL_CHANGE, TIRE_ROTATION, BRAKE_SERVICE, INSPECTION, REPAIR, PMI // Preventive Maintenance Inspection, ENGINE, TRANSMISSION, OTHER

- **Line 99** [ERROR]: Field 'where' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 102** [ERROR]: Field 'deletedAt' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: deletedAt
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

### app\api\fleet\maintenance\schedules\route.ts

- **Line 25** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 31** [ERROR]: Relation 'select' does not exist on model 'Truck'
  - Model: Truck
  - Field: select
  - Suggestion: Available relations: Company, McNumber...

- **Line 43** [ERROR]: Field 'where' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 46** [ERROR]: Field 'deletedAt' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: deletedAt
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: select
  - Suggestion: Available relations: Truck, Company...

- **Line 54** [ERROR]: Invalid enum value 'true' for field 'type' (MaintenanceType)
  - Model: MaintenanceRecord
  - Field: type
  - Suggestion: Valid values: OIL_CHANGE, TIRE_ROTATION, BRAKE_SERVICE, INSPECTION, REPAIR, PMI // Preventive Maintenance Inspection, ENGINE, TRANSMISSION, OTHER

### app\api\fleet\inspections\stats\route.ts

- **Line 39** [ERROR]: Relation 'select' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: select
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 41** [ERROR]: Invalid enum value 'true' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 82** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

### app\api\fleet\breakdowns\report\route.ts

- **Line 44** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 49** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 52** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 53** [ERROR]: Invalid enum value 'true' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 54** [ERROR]: Invalid enum value 'true' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 296** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\breakdowns\stats\route.ts

- **Line 39** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 42** [ERROR]: Invalid enum value 'true' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 43** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 44** [ERROR]: Invalid enum value 'true' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 48** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 49** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 122** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\breakdowns\hotspots\route.ts

- **Line 45** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 53** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 54** [ERROR]: Invalid enum value 'true' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 72** [ERROR]: Invalid enum value 'string' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 73** [ERROR]: Invalid enum value 'string' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 97** [ERROR]: Invalid enum value 'breakdown' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 98** [ERROR]: Invalid enum value 'breakdown' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 118** [ERROR]: Invalid enum value 'b' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 119** [ERROR]: Invalid enum value 'b' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 166** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\breakdowns\cost-summary\route.ts

- **Line 47** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 51** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 52** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 55** [ERROR]: Invalid enum value 'true' for field 'breakdownType' (BreakdownType)
  - Model: Breakdown
  - Field: breakdownType
  - Suggestion: Valid values: ENGINE_FAILURE, TRANSMISSION_FAILURE, BRAKE_FAILURE, TIRE_FLAT, TIRE_BLOWOUT, ELECTRICAL_ISSUE, COOLING_SYSTEM, FUEL_SYSTEM, SUSPENSION, ACCIDENT_DAMAGE, WEATHER_RELATED, OTHER

- **Line 169** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\breakdowns\costs\route.ts

- **Line 59** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 61** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 63** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 98** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\fleet\breakdowns\active\route.ts

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 41** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 43** [ERROR]: Relation 'truckNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 44** [ERROR]: Relation 'make' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: make
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 45** [ERROR]: Relation 'model' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: model
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 46** [ERROR]: Relation 'year' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: year
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 47** [ERROR]: Relation 'vin' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: vin
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 48** [ERROR]: Relation 'licensePlate' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: licensePlate
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 50** [ERROR]: Relation 'currentLocation' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: currentLocation
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 54** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 56** [ERROR]: Relation 'loadNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: loadNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 57** [ERROR]: Relation 'customer' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: customer
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 58** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 59** [ERROR]: Relation 'name' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: name
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 69** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 71** [ERROR]: Relation 'driverNumber' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: driverNumber
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 72** [ERROR]: Relation 'user' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: user
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 73** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 75** [ERROR]: Relation 'firstName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: firstName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 76** [ERROR]: Relation 'lastName' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: lastName
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 77** [ERROR]: Relation 'email' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: email
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 78** [ERROR]: Relation 'phone' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: phone
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 84** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 87** [ERROR]: Relation 'select' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: select
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 89** [ERROR]: Relation 'type' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: type
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 90** [ERROR]: Relation 'title' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: title
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 91** [ERROR]: Relation 'fileUrl' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: fileUrl
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 92** [ERROR]: Relation 'mimeType' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: mimeType
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 98** [ERROR]: Invalid enum value 'desc' for field 'priority' (BreakdownPriority)
  - Model: Breakdown
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 154** [ERROR]: Invalid enum value '500' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

### app\api\drivers\[id]\payments\route.ts

- **Line 35** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 48** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 69** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 72** [ERROR]: Field 'driverId' does not exist on model 'Payment'
  - Model: Payment
  - Field: driverId
  - Suggestion: Did you mean: id?

- **Line 73** [ERROR]: Field 'truck' does not exist on model 'Payment'
  - Model: Payment
  - Field: truck
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 74** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 80** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 82** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 84** [ERROR]: Relation 'date' does not exist on model 'Payment'
  - Model: Payment
  - Field: date
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 85** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 86** [ERROR]: Relation 'location' does not exist on model 'Payment'
  - Model: Payment
  - Field: location
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 87** [ERROR]: Relation 'truck' does not exist on model 'Payment'
  - Model: Payment
  - Field: truck
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 88** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 89** [ERROR]: Relation 'truckNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: truckNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 95** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 97** [ERROR]: Relation 'number' does not exist on model 'Payment'
  - Model: Payment
  - Field: number
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 98** [ERROR]: Relation 'companyName' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 102** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 104** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 105** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 114** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 117** [ERROR]: Field 'driverId' does not exist on model 'Payment'
  - Model: Payment
  - Field: driverId
  - Suggestion: Did you mean: id?

- **Line 118** [ERROR]: Field 'companyId' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 119** [ERROR]: Field 'deletedAt' does not exist on model 'Payment'
  - Model: Payment
  - Field: deletedAt
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 121** [ERROR]: Field 'reportedAt' does not exist on model 'Payment'
  - Model: Payment
  - Field: reportedAt
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 124** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 126** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 128** [ERROR]: Relation 'breakdownNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: breakdownNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 129** [ERROR]: Relation 'totalCost' does not exist on model 'Payment'
  - Model: Payment
  - Field: totalCost
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 130** [ERROR]: Relation 'location' does not exist on model 'Payment'
  - Model: Payment
  - Field: location
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 131** [ERROR]: Relation 'reportedAt' does not exist on model 'Payment'
  - Model: Payment
  - Field: reportedAt
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 132** [ERROR]: Relation 'truck' does not exist on model 'Payment'
  - Model: Payment
  - Field: truck
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 133** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 134** [ERROR]: Relation 'truckNumber' does not exist on model 'Payment'
  - Model: Payment
  - Field: truckNumber
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 140** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 142** [ERROR]: Relation 'number' does not exist on model 'Payment'
  - Model: Payment
  - Field: number
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 143** [ERROR]: Relation 'companyName' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 147** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 149** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 150** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 160** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 166** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 177** [ERROR]: Field 'where' does not exist on model 'Payment'
  - Model: Payment
  - Field: where
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 180** [ERROR]: Field 'loadIds' does not exist on model 'Payment'
  - Model: Payment
  - Field: loadIds
  - Suggestion: Did you mean: id?

- **Line 181** [ERROR]: Field 'hasSome' does not exist on model 'Payment'
  - Model: Payment
  - Field: hasSome
  - Suggestion: Available fields: id, invoiceId, invoice, type, fuelEntryId...

- **Line 190** [ERROR]: Relation 'include' does not exist on model 'Payment'
  - Model: Payment
  - Field: include
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 192** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 195** [ERROR]: Relation 'total' does not exist on model 'Payment'
  - Model: Payment
  - Field: total
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 196** [ERROR]: Relation 'invoiceDate' does not exist on model 'Payment'
  - Model: Payment
  - Field: invoiceDate
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 197** [ERROR]: Relation 'loadIds' does not exist on model 'Payment'
  - Model: Payment
  - Field: loadIds
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 198** [ERROR]: Relation 'customer' does not exist on model 'Payment'
  - Model: Payment
  - Field: customer
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 199** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 200** [ERROR]: Relation 'name' does not exist on model 'Payment'
  - Model: Payment
  - Field: name
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 206** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 208** [ERROR]: Relation 'number' does not exist on model 'Payment'
  - Model: Payment
  - Field: number
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 209** [ERROR]: Relation 'companyName' does not exist on model 'Payment'
  - Model: Payment
  - Field: companyName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 213** [ERROR]: Relation 'select' does not exist on model 'Payment'
  - Model: Payment
  - Field: select
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 215** [ERROR]: Relation 'firstName' does not exist on model 'Payment'
  - Model: Payment
  - Field: firstName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 216** [ERROR]: Relation 'lastName' does not exist on model 'Payment'
  - Model: Payment
  - Field: lastName
  - Suggestion: Available relations: Invoice, FuelEntry, Breakdown, McNumber, User...

- **Line 234** [ERROR]: Field 'where' does not exist on model 'Load'
  - Model: Load
  - Field: where
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 237** [ERROR]: Relation 'select' does not exist on model 'Load'
  - Model: Load
  - Field: select
  - Suggestion: Available relations: Company, Customer, Driver, Truck, User...

- **Line 296** [ERROR]: Invalid enum value '500' for field 'status' (LoadStatus)
  - Model: Load
  - Field: status
  - Suggestion: Valid values: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED

### app\api\batches\[id]\status\route.ts

- **Line 29** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 46** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 47** [ERROR]: Field 'data' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: data
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 48** [ERROR]: Invalid enum value 'validated' for field 'postStatus' (BatchPostStatus)
  - Model: InvoiceBatch
  - Field: postStatus
  - Suggestion: Valid values: UNPOSTED, POSTED, PAID

- **Line 50** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 52** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 54** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 55** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 59** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 60** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 61** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 62** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 63** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 65** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

### app\api\batches\[id]\send\route.ts

- **Line 30** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 36** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 37** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 69** [ERROR]: Field 'data' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: data
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 75** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 77** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 79** [ERROR]: Relation 'firstName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: firstName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 80** [ERROR]: Relation 'lastName' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: lastName
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 84** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 85** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 86** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 87** [ERROR]: Relation 'customer' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: customer
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 88** [ERROR]: Relation 'select' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: select
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 90** [ERROR]: Relation 'name' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: name
  - Suggestion: Available relations: Company, User, FactoringCompany...

### app\api\batches\[id]\invoices\route.ts

- **Line 33** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 64** [ERROR]: Field 'where' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: where
  - Suggestion: Available fields: id, customerId, customer, invoiceNumber, loadIds...

- **Line 67** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 81** [ERROR]: Invalid enum value '400' for field 'status' (InvoiceStatus)
  - Model: Invoice
  - Field: status
  - Suggestion: Valid values: DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED, INVOICED, POSTED

- **Line 87** [ERROR]: Field 'where' does not exist on model 'InvoiceBatchItem'
  - Model: InvoiceBatchItem
  - Field: where
  - Suggestion: Available fields: id, batchId, batch, invoiceId, invoice...

- **Line 115** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 116** [ERROR]: Field 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 116** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 118** [ERROR]: Field 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 118** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 119** [ERROR]: Field 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 119** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 132** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 133** [ERROR]: Field 'data' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: data
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 201** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 232** [ERROR]: Field 'where' does not exist on model 'InvoiceBatchItem'
  - Model: InvoiceBatchItem
  - Field: where
  - Suggestion: Available fields: id, batchId, batch, invoiceId, invoice...

- **Line 240** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 241** [ERROR]: Field 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 241** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 243** [ERROR]: Field 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 243** [ERROR]: Relation 'include' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: include
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 244** [ERROR]: Field 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 244** [ERROR]: Relation 'invoice' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: invoice
  - Suggestion: Available relations: Company, User, FactoringCompany...

- **Line 257** [ERROR]: Field 'where' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: where
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

- **Line 258** [ERROR]: Field 'data' does not exist on model 'InvoiceBatch'
  - Model: InvoiceBatch
  - Field: data
  - Suggestion: Available fields: id, companyId, company, batchNumber, postStatus...

### app\api\analytics\drivers\performance\route.ts

- **Line 41** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 43** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 44** [ERROR]: Relation 'firstName' does not exist on model 'Driver'
  - Model: Driver
  - Field: firstName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 45** [ERROR]: Relation 'lastName' does not exist on model 'Driver'
  - Model: Driver
  - Field: lastName
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 49** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 52** [ERROR]: Field 'pickupDate' does not exist on model 'Driver'
  - Model: Driver
  - Field: pickupDate
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 53** [ERROR]: Field 'deliveryDate' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveryDate
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 54** [ERROR]: Field 'deliveredAt' does not exist on model 'Driver'
  - Model: Driver
  - Field: deliveredAt
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 57** [ERROR]: Relation 'include' does not exist on model 'Driver'
  - Model: Driver
  - Field: include
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 58** [ERROR]: Relation 'customer' does not exist on model 'Driver'
  - Model: Driver
  - Field: customer
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 60** [ERROR]: Relation 'name' does not exist on model 'Driver'
  - Model: Driver
  - Field: name
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 66** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 67** [ERROR]: Field 'date' does not exist on model 'Driver'
  - Model: Driver
  - Field: date
  - Suggestion: Did you mean: licenseIssueDate, birthDate, hireDate?

- **Line 148** [ERROR]: Invalid enum value 'driver' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 191** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\advances\[id]\approve\route.ts

- **Line 49** [ERROR]: Field 'where' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: where
  - Suggestion: Available fields: id, driverId, driver, amount, requestDate...

- **Line 52** [ERROR]: Field 'companyId' does not exist on model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: companyId
  - Suggestion: Did you mean: id?

- **Line 102** [ERROR]: Invalid enum value 'validated' for field 'paymentMethod' (PaymentMethod)
  - Model: DriverAdvance
  - Field: paymentMethod
  - Suggestion: Valid values: CHECK, WIRE, ACH, CREDIT_CARD, CASH, OTHER, FACTOR, QUICK_PAY

### app\api\advances\driver\[driverId]\route.ts

- **Line 28** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 41** [ERROR]: Invalid enum value '404' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 75** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\safety\vehicles\[vehicleId]\roadside-inspections\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 22** [ERROR]: Relation 'include' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 24** [ERROR]: Relation 'include' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 25** [ERROR]: Relation 'user' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 68** [ERROR]: Invalid enum value 'body' for field 'inspectionLevel' (InspectionLevel)
  - Model: RoadsideInspection
  - Field: inspectionLevel
  - Suggestion: Valid values: LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_5, LEVEL_6

- **Line 83** [ERROR]: Relation 'include' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 85** [ERROR]: Relation 'include' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 86** [ERROR]: Relation 'user' does not exist on model 'RoadsideInspection'
  - Model: RoadsideInspection
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 104** [ERROR]: Invalid enum value 'body' for field 'oosType' (OOSType)
  - Model: OutOfServiceOrder
  - Field: oosType
  - Suggestion: Valid values: DRIVER, VEHICLE

- **Line 114** [ERROR]: Invalid enum value '201' for field 'status' (OOSStatus)
  - Model: OutOfServiceOrder
  - Field: status
  - Suggestion: Valid values: ACTIVE, RESOLVED, CLOSED

- **Line 119** [ERROR]: Invalid enum value '500' for field 'status' (OOSStatus)
  - Model: OutOfServiceOrder
  - Field: status
  - Suggestion: Valid values: ACTIVE, RESOLVED, CLOSED

### app\api\safety\vehicles\[vehicleId]\out-of-service\route.ts

- **Line 20** [ERROR]: Field 'where' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 23** [ERROR]: Invalid enum value 'status' for field 'status' (OOSStatus)
  - Model: OutOfServiceOrder
  - Field: status
  - Suggestion: Valid values: ACTIVE, RESOLVED, CLOSED

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 28** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 29** [ERROR]: Relation 'user' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 41** [ERROR]: Invalid enum value '500' for field 'status' (OOSStatus)
  - Model: OutOfServiceOrder
  - Field: status
  - Suggestion: Valid values: ACTIVE, RESOLVED, CLOSED

- **Line 66** [ERROR]: Invalid enum value 'body' for field 'oosType' (OOSType)
  - Model: OutOfServiceOrder
  - Field: oosType
  - Suggestion: Valid values: DRIVER, VEHICLE

- **Line 73** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 76** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 77** [ERROR]: Relation 'user' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 86** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 87** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 91** [ERROR]: Invalid enum value '201' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

- **Line 96** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\safety\vehicles\[vehicleId]\inspections\route.ts

- **Line 31** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 43** [ERROR]: Invalid enum value '500' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 68** [ERROR]: Field 'where' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckId, truck...

- **Line 73** [ERROR]: Field 'd' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: d
  - Suggestion: Did you mean: id, companyId, truckId?

- **Line 80** [ERROR]: Invalid enum value 'body' for field 'inspectionType' (InspectionType)
  - Model: Inspection
  - Field: inspectionType
  - Suggestion: Valid values: DOT_ANNUAL, DOT_LEVEL_1, DOT_LEVEL_2, DOT_LEVEL_3, DOT_PRE_TRIP, DOT_POST_TRIP, STATE_INSPECTION, COMPANY_INSPECTION, PMI // Preventive Maintenance Inspection, SAFETY_INSPECTION

- **Line 85** [ERROR]: Invalid enum value 'body' for field 'status' (InspectionStatus)
  - Model: Inspection
  - Field: status
  - Suggestion: Valid values: PASSED, FAILED, CONDITIONAL, OUT_OF_SERVICE, PENDING

- **Line 90** [ERROR]: Relation 'include' does not exist on model 'Inspection'
  - Model: Inspection
  - Field: include
  - Suggestion: Available relations: Company, Truck, Driver...

- **Line 106** [ERROR]: Invalid enum value 'defect' for field 'severity' (DefectSeverity)
  - Model: Defect
  - Field: severity
  - Suggestion: Valid values: CRITICAL, NON_CRITICAL

- **Line 115** [ERROR]: Invalid enum value '201' for field 'status' (DefectStatus)
  - Model: Defect
  - Field: status
  - Suggestion: Valid values: OPEN, IN_PROGRESS, RESOLVED, CLOSED

- **Line 120** [ERROR]: Invalid enum value '500' for field 'status' (DefectStatus)
  - Model: Defect
  - Field: status
  - Suggestion: Valid values: OPEN, IN_PROGRESS, RESOLVED, CLOSED

### app\api\safety\vehicles\[vehicleId]\dvir\route.ts

- **Line 31** [ERROR]: Relation 'include' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 33** [ERROR]: Relation 'include' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 34** [ERROR]: Relation 'user' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 52** [ERROR]: Invalid enum value '500' for field 'status' (DVIRStatus)
  - Model: DVIR
  - Field: status
  - Suggestion: Valid values: IN_PROGRESS, COMPLETED, DEFECT_REPORTED, REPAIRED

- **Line 76** [ERROR]: Invalid enum value 'body' for field 'inspectionType' (DVIRType)
  - Model: DVIR
  - Field: inspectionType
  - Suggestion: Valid values: PRE_TRIP, POST_TRIP

- **Line 92** [ERROR]: Invalid enum value 'body' for field 'status' (DVIRStatus)
  - Model: DVIR
  - Field: status
  - Suggestion: Valid values: IN_PROGRESS, COMPLETED, DEFECT_REPORTED, REPAIRED

- **Line 104** [ERROR]: Relation 'include' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 106** [ERROR]: Relation 'include' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 107** [ERROR]: Relation 'user' does not exist on model 'DVIR'
  - Model: DVIR
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 122** [ERROR]: Invalid enum value '201' for field 'status' (DVIRStatus)
  - Model: DVIR
  - Field: status
  - Suggestion: Valid values: IN_PROGRESS, COMPLETED, DEFECT_REPORTED, REPAIRED

- **Line 127** [ERROR]: Invalid enum value '500' for field 'status' (DVIRStatus)
  - Model: DVIR
  - Field: status
  - Suggestion: Valid values: IN_PROGRESS, COMPLETED, DEFECT_REPORTED, REPAIRED

### app\api\safety\out-of-service\[id]\resolve\route.ts

- **Line 20** [ERROR]: Field 'where' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 21** [ERROR]: Field 'select' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 21** [ERROR]: Relation 'select' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: select
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 24** [ERROR]: Invalid enum value 'true' for field 'oosType' (OOSType)
  - Model: OutOfServiceOrder
  - Field: oosType
  - Suggestion: Valid values: DRIVER, VEHICLE

- **Line 34** [ERROR]: Field 'where' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 35** [ERROR]: Field 'data' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 42** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 45** [ERROR]: Relation 'include' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 46** [ERROR]: Relation 'user' does not exist on model 'OutOfServiceOrder'
  - Model: OutOfServiceOrder
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck...

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Truck'
  - Model: Truck
  - Field: where
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 56** [ERROR]: Field 'data' does not exist on model 'Truck'
  - Model: Truck
  - Field: data
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 65** [ERROR]: Invalid enum value '500' for field 'status' (TruckStatus)
  - Model: Truck
  - Field: status
  - Suggestion: Valid values: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE

### app\api\safety\incidents\[id]\preventable\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: where
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 21** [ERROR]: Field 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 21** [ERROR]: Relation 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 22** [ERROR]: Field 'driver' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: driver
  - Suggestion: Did you mean: driverScoreImpact?

- **Line 22** [ERROR]: Relation 'driver' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: driver
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 23** [ERROR]: Field 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 23** [ERROR]: Relation 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 24** [ERROR]: Field 'user' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: user
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 24** [ERROR]: Relation 'user' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: user
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 30** [ERROR]: Relation 'include' does not exist on model 'PreventableDetermination'
  - Model: PreventableDetermination
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 66** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 67** [ERROR]: Field 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 67** [ERROR]: Relation 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 71** [ERROR]: Field 'error' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: error
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 75** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 76** [ERROR]: Field 'update' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: update
  - Suggestion: Did you mean: date, updatedAt?

- **Line 77** [ERROR]: Field 'reviewDate' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: reviewDate
  - Suggestion: Did you mean: date?

- **Line 78** [ERROR]: Field 'reviewCommitteeMembers' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: reviewCommitteeMembers
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 79** [ERROR]: Field 'determination' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: determination
  - Suggestion: Did you mean: preventableDetermination?

- **Line 80** [ERROR]: Field 'justification' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: justification
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 81** [ERROR]: Field 'driverScoreImpact' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: driverScoreImpact
  - Suggestion: Did you mean: driver?

- **Line 83** [ERROR]: Field 'votes' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: votes
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 84** [ERROR]: Field 'deleteMany' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: deleteMany
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 85** [ERROR]: Field 'create' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: create
  - Suggestion: Did you mean: createdAt?

- **Line 86** [ERROR]: Field 'voterId' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: voterId
  - Suggestion: Did you mean: id?

- **Line 87** [ERROR]: Field 'vote' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: vote
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 88** [ERROR]: Field 'justification' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: justification
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 109** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 110** [ERROR]: Relation 'incident' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: incident
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 111** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 113** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 114** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 123** [ERROR]: Invalid enum value '201' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 128** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

### app\api\safety\incidents\[id]\investigation\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: where
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 21** [ERROR]: Field 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 21** [ERROR]: Relation 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 22** [ERROR]: Field 'driver' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: driver
  - Suggestion: Did you mean: driverInterviewed?

- **Line 22** [ERROR]: Relation 'driver' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: driver
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 23** [ERROR]: Field 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 23** [ERROR]: Relation 'include' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: include
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 24** [ERROR]: Field 'user' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: user
  - Suggestion: Available fields: id, companyId, company, incidentId, incident...

- **Line 24** [ERROR]: Relation 'user' does not exist on model 'Investigation'
  - Model: Investigation
  - Field: user
  - Suggestion: Available relations: Company, SafetyIncident...

- **Line 39** [ERROR]: Invalid enum value '500' for field 'status' (InvestigationStatus)
  - Model: Investigation
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, ON_HOLD

- **Line 59** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 60** [ERROR]: Field 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 60** [ERROR]: Relation 'select' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: select
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 64** [ERROR]: Field 'error' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: error
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 69** [ERROR]: Field 'update' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: update
  - Suggestion: Did you mean: date, updatedAt?

- **Line 71** [ERROR]: Field 'assignedDate' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: assignedDate
  - Suggestion: Did you mean: date?

- **Line 72** [ERROR]: Field 'dueDate' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: dueDate
  - Suggestion: Did you mean: date?

- **Line 73** [ERROR]: Field 'driverInterviewed' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: driverInterviewed
  - Suggestion: Did you mean: driver?

- **Line 74** [ERROR]: Field 'eldDataReviewed' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: eldDataReviewed
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 75** [ERROR]: Field 'vehicleExamined' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: vehicleExamined
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 76** [ERROR]: Field 'photosReviewed' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: photosReviewed
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 77** [ERROR]: Field 'witnessStatementsReviewed' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: witnessStatementsReviewed
  - Suggestion: Did you mean: state, witnessStatements?

- **Line 78** [ERROR]: Field 'policeReportReviewed' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: policeReportReviewed
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 81** [ERROR]: Field 'findings' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: findings
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 83** [ERROR]: Field 'recommendations' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: recommendations
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 84** [ERROR]: Field 'trainingScheduled' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: trainingScheduled
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 85** [ERROR]: Field 'trainingId' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: trainingId
  - Suggestion: Did you mean: id?

- **Line 86** [ERROR]: Invalid enum value 'body' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 107** [ERROR]: Invalid enum value 'PENDING' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 109** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 110** [ERROR]: Relation 'incident' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: incident
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 111** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 113** [ERROR]: Relation 'include' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: include
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 114** [ERROR]: Relation 'user' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user
  - Suggestion: Available relations: Company, Driver, Truck, Load...

- **Line 126** [ERROR]: Field 'where' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 127** [ERROR]: Field 'data' does not exist on model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 132** [ERROR]: Invalid enum value '201' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

- **Line 137** [ERROR]: Invalid enum value '500' for field 'status' (SafetyIncidentStatus)
  - Model: SafetyIncident
  - Field: status
  - Suggestion: Valid values: REPORTED, UNDER_INVESTIGATION, INVESTIGATION_COMPLETE, RESOLVED, CLOSED

### app\api\safety\drivers\[driverId]\mvr\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 22** [ERROR]: Relation 'include' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 25** [ERROR]: Relation 'orderBy' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: orderBy
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 28** [ERROR]: Relation 'include' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 29** [ERROR]: Relation 'user' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 83** [ERROR]: Relation 'include' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 87** [ERROR]: Relation 'include' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 88** [ERROR]: Relation 'user' does not exist on model 'MVRRecord'
  - Model: MVRRecord
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

### app\api\safety\drivers\[driverId]\medical-cards\route.ts

- **Line 35** [ERROR]: Relation 'include' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 38** [ERROR]: Relation 'include' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 39** [ERROR]: Relation 'user' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 81** [ERROR]: Relation 'include' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 84** [ERROR]: Relation 'include' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 85** [ERROR]: Relation 'user' does not exist on model 'MedicalCard'
  - Model: MedicalCard
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

### app\api\safety\drivers\[driverId]\hos\route.ts

- **Line 23** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 33** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 46** [ERROR]: Relation 'include' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: include
  - Suggestion: Available relations: Driver...

- **Line 48** [ERROR]: Relation 'include' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: include
  - Suggestion: Available relations: Driver...

- **Line 49** [ERROR]: Relation 'user' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: user
  - Suggestion: Available relations: Driver...

- **Line 73** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 93** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 112** [ERROR]: Invalid enum value 'body' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 115** [ERROR]: Relation 'include' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: include
  - Suggestion: Available relations: Driver...

- **Line 117** [ERROR]: Relation 'include' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: include
  - Suggestion: Available relations: Driver...

- **Line 118** [ERROR]: Relation 'user' does not exist on model 'HOSRecord'
  - Model: HOSRecord
  - Field: user
  - Suggestion: Available relations: Driver...

- **Line 124** [ERROR]: Invalid enum value '201' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 129** [ERROR]: Invalid enum value '500' for field 'status' (DriverStatus)
  - Model: HOSRecord
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

### app\api\safety\drivers\[driverId]\drug-tests\route.ts

- **Line 39** [ERROR]: Relation 'include' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 42** [ERROR]: Relation 'include' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 43** [ERROR]: Relation 'user' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 77** [ERROR]: Invalid enum value 'body' for field 'testType' (DrugAlcoholTestType)
  - Model: DrugAlcoholTest
  - Field: testType
  - Suggestion: Valid values: PRE_EMPLOYMENT, RANDOM, POST_ACCIDENT, REASONABLE_SUSPICION, RETURN_TO_DUTY, FOLLOW_UP, PRE_DUTY

- **Line 79** [ERROR]: Invalid enum value 'body' for field 'result' (TestResult)
  - Model: DrugAlcoholTest
  - Field: result
  - Suggestion: Valid values: NEGATIVE, POSITIVE, REFUSAL, CANCELLED

- **Line 93** [ERROR]: Relation 'include' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 96** [ERROR]: Relation 'include' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 97** [ERROR]: Relation 'user' does not exist on model 'DrugAlcoholTest'
  - Model: DrugAlcoholTest
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

### app\api\safety\drivers\[driverId]\dqf\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 21** [ERROR]: Field 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 21** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 22** [ERROR]: Field 'document' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: document
  - Suggestion: Did you mean: documents?

- **Line 22** [ERROR]: Relation 'document' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: document
  - Suggestion: Available relations: Company, Driver...

- **Line 27** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 28** [ERROR]: Relation 'user' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 42** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 44** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 45** [ERROR]: Relation 'document' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: document
  - Suggestion: Available relations: Company, Driver...

- **Line 49** [ERROR]: Relation 'include' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 50** [ERROR]: Relation 'user' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 64** [ERROR]: Invalid enum value '500' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

- **Line 84** [ERROR]: Field 'where' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 100** [ERROR]: Field 'where' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 101** [ERROR]: Field 'dqfId_documentType' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: dqfId_documentType
  - Suggestion: Did you mean: id?

- **Line 102** [ERROR]: Field 'dqfId' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: dqfId
  - Suggestion: Did you mean: id?

- **Line 103** [ERROR]: Field 'documentType' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: documentType
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 108** [ERROR]: Invalid enum value 'body' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

- **Line 116** [ERROR]: Invalid enum value 'body' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

- **Line 124** [ERROR]: Field 'where' does not exist on model 'DQFDocument'
  - Model: DQFDocument
  - Field: where
  - Suggestion: Available fields: id, dqfId, dqf, documentId, document...

- **Line 137** [ERROR]: Field 'where' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 138** [ERROR]: Field 'data' does not exist on model 'DriverQualificationFile'
  - Model: DriverQualificationFile
  - Field: data
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 138** [ERROR]: Invalid enum value 'newStatus' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

- **Line 141** [ERROR]: Invalid enum value '201' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

- **Line 149** [ERROR]: Invalid enum value '500' for field 'status' (DQFStatus)
  - Model: DriverQualificationFile
  - Field: status
  - Suggestion: Valid values: COMPLETE, INCOMPLETE, EXPIRING, EXPIRED

### app\api\safety\drivers\[driverId]\cdl\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Field 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 19** [ERROR]: Relation 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 22** [ERROR]: Field 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 22** [ERROR]: Relation 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 23** [ERROR]: Field 'user' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: user
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 23** [ERROR]: Relation 'user' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 53** [ERROR]: Field 'where' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 54** [ERROR]: Field 'update' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: update
  - Suggestion: Did you mean: updatedAt?

- **Line 76** [ERROR]: Relation 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 79** [ERROR]: Relation 'include' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: include
  - Suggestion: Available relations: Company, Driver, Document...

- **Line 80** [ERROR]: Relation 'user' does not exist on model 'CDLRecord'
  - Model: CDLRecord
  - Field: user
  - Suggestion: Available relations: Company, Driver, Document...

### app\api\safety\drivers\[driverId]\annual-review\route.ts

- **Line 18** [ERROR]: Field 'where' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: where
  - Suggestion: Available fields: id, companyId, company, driverId, driver...

- **Line 22** [ERROR]: Relation 'include' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 25** [ERROR]: Relation 'include' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 26** [ERROR]: Relation 'user' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 38** [ERROR]: Invalid enum value '500' for field 'status' (AnnualReviewStatus)
  - Model: AnnualReview
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

- **Line 58** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 59** [ERROR]: Field 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Did you mean: randomSelectedDrivers?

- **Line 59** [ERROR]: Relation 'select' does not exist on model 'Driver'
  - Model: Driver
  - Field: select
  - Suggestion: Available relations: User, Company, Truck, Trailer, McNumber...

- **Line 64** [ERROR]: Field 'error' does not exist on model 'Driver'
  - Model: Driver
  - Field: error
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 65** [ERROR]: Invalid enum value '400' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 90** [ERROR]: Invalid enum value 'body' for field 'status' (AnnualReviewStatus)
  - Model: AnnualReview
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

- **Line 92** [ERROR]: Relation 'include' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 95** [ERROR]: Relation 'include' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 96** [ERROR]: Relation 'user' does not exist on model 'AnnualReview'
  - Model: AnnualReview
  - Field: user
  - Suggestion: Available relations: Company, Driver...

- **Line 102** [ERROR]: Invalid enum value '201' for field 'status' (AnnualReviewStatus)
  - Model: AnnualReview
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

- **Line 107** [ERROR]: Invalid enum value '500' for field 'status' (AnnualReviewStatus)
  - Model: AnnualReview
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

### app\api\safety\compliance\fmcsa\action-items\route.ts

- **Line 16** [ERROR]: Field 'where' does not exist on model 'FMCSACompliance'
  - Model: FMCSACompliance
  - Field: where
  - Suggestion: Available fields: id, companyId, company, safetyRating, safetyRatingDate...

- **Line 29** [ERROR]: Invalid enum value 'body' for field 'priority' (CompliancePriority)
  - Model: ComplianceActionItem
  - Field: priority
  - Suggestion: Valid values: LOW, MEDIUM, HIGH, CRITICAL

- **Line 36** [ERROR]: Invalid enum value '201' for field 'status' (ComplianceActionStatus)
  - Model: ComplianceActionItem
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

- **Line 41** [ERROR]: Invalid enum value '500' for field 'status' (ComplianceActionStatus)
  - Model: ComplianceActionItem
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

### app\api\mobile\breakdowns\[id]\messages\route.ts

- **Line 34** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 47** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 55** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 65** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 74** [ERROR]: Field 'where' does not exist on model 'Communication'
  - Model: Communication
  - Field: where
  - Suggestion: Available fields: id, companyId, company, breakdownId, breakdown...

- **Line 78** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 79** [ERROR]: Relation 'createdBy' does not exist on model 'Communication'
  - Model: Communication
  - Field: createdBy
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 80** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 81** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 82** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 83** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 107** [ERROR]: Invalid enum value 'comm' for field 'channel' (CommunicationChannel)
  - Model: Communication
  - Field: channel
  - Suggestion: Valid values: SIP // Phone calls via SIP provider, SMS // Text messages, TELEGRAM // Telegram messaging, EMAIL // Email, MOBILE_APP // Driver mobile app

- **Line 108** [ERROR]: Invalid enum value 'comm' for field 'type' (CommunicationType)
  - Model: Communication
  - Field: type
  - Suggestion: Valid values: CALL // Phone call, SMS // Text message, MMS // Multimedia message, TELEGRAM // Telegram message, EMAIL // Email, VOICEMAIL // Voicemail, NOTE // Manual note/log, MESSAGE // Mobile app message, BREAKDOWN_REPORT // Breakdown report from mobile app

- **Line 109** [ERROR]: Invalid enum value 'comm' for field 'direction' (CommunicationDirection)
  - Model: Communication
  - Field: direction
  - Suggestion: Valid values: INBOUND // Received from driver, OUTBOUND // Sent to driver

- **Line 157** [ERROR]: Field 'where' does not exist on model 'Driver'
  - Model: Driver
  - Field: where
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 170** [ERROR]: Invalid enum value '403' for field 'status' (DriverStatus)
  - Model: Driver
  - Field: status
  - Suggestion: Valid values: AVAILABLE, ON_DUTY, DRIVING, OFF_DUTY, SLEEPER_BERTH, ON_LEAVE, INACTIVE, IN_TRANSIT, DISPATCHED

- **Line 179** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 189** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 205** [ERROR]: Invalid enum value 'MOBILE_APP' for field 'channel' (CommunicationChannel)
  - Model: Communication
  - Field: channel
  - Suggestion: Valid values: SIP // Phone calls via SIP provider, SMS // Text messages, TELEGRAM // Telegram messaging, EMAIL // Email, MOBILE_APP // Driver mobile app

- **Line 206** [ERROR]: Invalid enum value 'MESSAGE' for field 'type' (CommunicationType)
  - Model: Communication
  - Field: type
  - Suggestion: Valid values: CALL // Phone call, SMS // Text message, MMS // Multimedia message, TELEGRAM // Telegram message, EMAIL // Email, VOICEMAIL // Voicemail, NOTE // Manual note/log, MESSAGE // Mobile app message, BREAKDOWN_REPORT // Breakdown report from mobile app

- **Line 207** [ERROR]: Invalid enum value 'INBOUND' for field 'direction' (CommunicationDirection)
  - Model: Communication
  - Field: direction
  - Suggestion: Valid values: INBOUND // Received from driver, OUTBOUND // Sent to driver

- **Line 213** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 214** [ERROR]: Relation 'createdBy' does not exist on model 'Communication'
  - Model: Communication
  - Field: createdBy
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 215** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 216** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 217** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

### app\api\fleet\on-call\shifts\[id]\route.ts

- **Line 45** [ERROR]: Field 'where' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: where
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 68** [ERROR]: Field 'where' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: where
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 69** [ERROR]: Field 'data' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: data
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 70** [ERROR]: Field 'include' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: include
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 70** [ERROR]: Relation 'include' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: include
  - Suggestion: Available relations: Company, User...

- **Line 72** [ERROR]: Field 'select' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: select
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 72** [ERROR]: Relation 'select' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: select
  - Suggestion: Available relations: Company, User...

- **Line 74** [ERROR]: Field 'firstName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: firstName
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 74** [ERROR]: Relation 'firstName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: firstName
  - Suggestion: Available relations: Company, User...

- **Line 75** [ERROR]: Field 'lastName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: lastName
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 75** [ERROR]: Relation 'lastName' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: lastName
  - Suggestion: Available relations: Company, User...

- **Line 76** [ERROR]: Field 'email' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: email
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 76** [ERROR]: Relation 'email' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: email
  - Suggestion: Available relations: Company, User...

- **Line 77** [ERROR]: Field 'phone' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: phone
  - Suggestion: Available fields: id, companyId, company, assignedToId, assignedTo...

- **Line 77** [ERROR]: Relation 'phone' does not exist on model 'OnCallShift'
  - Model: OnCallShift
  - Field: phone
  - Suggestion: Available relations: Company, User...

- **Line 94** [ERROR]: Invalid enum value 'shift' for field 'shiftType' (OnCallShiftType)
  - Model: OnCallShift
  - Field: shiftType
  - Suggestion: Valid values: DAY, NIGHT, WEEKEND, HOLIDAY, CUSTOM

### app\api\fleet\breakdowns\[id]\messages\route.ts

- **Line 37** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 41** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 49** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 65** [ERROR]: Invalid enum value 'MOBILE_APP' for field 'channel' (CommunicationChannel)
  - Model: Communication
  - Field: channel
  - Suggestion: Valid values: SIP // Phone calls via SIP provider, SMS // Text messages, TELEGRAM // Telegram messaging, EMAIL // Email, MOBILE_APP // Driver mobile app

- **Line 66** [ERROR]: Invalid enum value 'MESSAGE' for field 'type' (CommunicationType)
  - Model: Communication
  - Field: type
  - Suggestion: Valid values: CALL // Phone call, SMS // Text message, MMS // Multimedia message, TELEGRAM // Telegram message, EMAIL // Email, VOICEMAIL // Voicemail, NOTE // Manual note/log, MESSAGE // Mobile app message, BREAKDOWN_REPORT // Breakdown report from mobile app

- **Line 67** [ERROR]: Invalid enum value 'OUTBOUND' for field 'direction' (CommunicationDirection)
  - Model: Communication
  - Field: direction
  - Suggestion: Valid values: INBOUND // Received from driver, OUTBOUND // Sent to driver

- **Line 73** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 75** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 76** [ERROR]: Relation 'user' does not exist on model 'Communication'
  - Model: Communication
  - Field: user
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 77** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 78** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 79** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 80** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 81** [ERROR]: Relation 'phone' does not exist on model 'Communication'
  - Model: Communication
  - Field: phone
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 87** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 88** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 89** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 90** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

### app\api\fleet\breakdowns\[id]\communications\route.ts

- **Line 49** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 58** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 67** [ERROR]: Field 'where' does not exist on model 'Communication'
  - Model: Communication
  - Field: where
  - Suggestion: Available fields: id, companyId, company, breakdownId, breakdown...

- **Line 71** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 73** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 74** [ERROR]: Relation 'user' does not exist on model 'Communication'
  - Model: Communication
  - Field: user
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 75** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 76** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 77** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 78** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 79** [ERROR]: Relation 'phone' does not exist on model 'Communication'
  - Model: Communication
  - Field: phone
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 85** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 86** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 87** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 88** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 149** [ERROR]: Field 'where' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: where
  - Suggestion: Available fields: id, truckId, truck, companyId, company...

- **Line 153** [ERROR]: Relation 'include' does not exist on model 'Breakdown'
  - Model: Breakdown
  - Field: include
  - Suggestion: Available relations: Truck, Company, McNumber, Load, Driver...

- **Line 161** [ERROR]: Invalid enum value '404' for field 'status' (BreakdownStatus)
  - Model: Breakdown
  - Field: status
  - Suggestion: Valid values: REPORTED // Initial report, DISPATCHED // Breakdown team/service dispatched, IN_PROGRESS // Repair work in progress, WAITING_PARTS // Waiting for parts, COMPLETED // Repair completed, truck ready, RESOLVED // Fully resolved, all documentation complete, CANCELLED // False alarm or cancelled

- **Line 177** [ERROR]: Invalid enum value 'validated' for field 'channel' (CommunicationChannel)
  - Model: Communication
  - Field: channel
  - Suggestion: Valid values: SIP // Phone calls via SIP provider, SMS // Text messages, TELEGRAM // Telegram messaging, EMAIL // Email, MOBILE_APP // Driver mobile app

- **Line 178** [ERROR]: Invalid enum value 'validated' for field 'type' (CommunicationType)
  - Model: Communication
  - Field: type
  - Suggestion: Valid values: CALL // Phone call, SMS // Text message, MMS // Multimedia message, TELEGRAM // Telegram message, EMAIL // Email, VOICEMAIL // Voicemail, NOTE // Manual note/log, MESSAGE // Mobile app message, BREAKDOWN_REPORT // Breakdown report from mobile app

- **Line 179** [ERROR]: Invalid enum value 'validated' for field 'direction' (CommunicationDirection)
  - Model: Communication
  - Field: direction
  - Suggestion: Valid values: INBOUND // Received from driver, OUTBOUND // Sent to driver

- **Line 195** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 197** [ERROR]: Relation 'include' does not exist on model 'Communication'
  - Model: Communication
  - Field: include
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 198** [ERROR]: Relation 'user' does not exist on model 'Communication'
  - Model: Communication
  - Field: user
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 199** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 200** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 201** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 202** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 203** [ERROR]: Relation 'phone' does not exist on model 'Communication'
  - Model: Communication
  - Field: phone
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 209** [ERROR]: Relation 'select' does not exist on model 'Communication'
  - Model: Communication
  - Field: select
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 210** [ERROR]: Relation 'firstName' does not exist on model 'Communication'
  - Model: Communication
  - Field: firstName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 211** [ERROR]: Relation 'lastName' does not exist on model 'Communication'
  - Model: Communication
  - Field: lastName
  - Suggestion: Available relations: Company, Breakdown, Driver...

- **Line 212** [ERROR]: Relation 'email' does not exist on model 'Communication'
  - Model: Communication
  - Field: email
  - Suggestion: Available relations: Company, Breakdown, Driver...

### app\api\safety\drivers\[driverId]\hos\violations\route.ts

- **Line 34** [ERROR]: Relation 'include' does not exist on model 'HOSViolation'
  - Model: HOSViolation
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 36** [ERROR]: Relation 'include' does not exist on model 'HOSViolation'
  - Model: HOSViolation
  - Field: include
  - Suggestion: Available relations: Company, Driver...

- **Line 37** [ERROR]: Relation 'user' does not exist on model 'HOSViolation'
  - Model: HOSViolation
  - Field: user
  - Suggestion: Available relations: Company, Driver...

### app\api\safety\compliance\fmcsa\action-items\[id]\complete\route.ts

- **Line 20** [ERROR]: Field 'where' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: where
  - Suggestion: Available fields: id, complianceId, compliance, actionItem, priority...

- **Line 21** [ERROR]: Field 'include' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: include
  - Suggestion: Available fields: id, complianceId, compliance, actionItem, priority...

- **Line 21** [ERROR]: Relation 'include' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: include
  - Suggestion: Available relations: FMCSACompliance...

- **Line 23** [ERROR]: Field 'select' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: select
  - Suggestion: Available fields: id, complianceId, compliance, actionItem, priority...

- **Line 23** [ERROR]: Relation 'select' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: select
  - Suggestion: Available relations: FMCSACompliance...

- **Line 33** [ERROR]: Field 'where' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: where
  - Suggestion: Available fields: id, complianceId, compliance, actionItem, priority...

- **Line 34** [ERROR]: Field 'data' does not exist on model 'ComplianceActionItem'
  - Model: ComplianceActionItem
  - Field: data
  - Suggestion: Available fields: id, complianceId, compliance, actionItem, priority...

- **Line 46** [ERROR]: Invalid enum value '500' for field 'status' (ComplianceActionStatus)
  - Model: ComplianceActionItem
  - Field: status
  - Suggestion: Valid values: PENDING, IN_PROGRESS, COMPLETED, OVERDUE

### app\dashboard\page.tsx

- **Line 93** [ERROR]: Field 'loadFilter' does not exist on model 'Load'
  - Model: Load
  - Field: loadFilter
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 99** [ERROR]: Field 'loadFilter' does not exist on model 'Load'
  - Model: Load
  - Field: loadFilter
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

- **Line 108** [ERROR]: Field 'driverFilter' does not exist on model 'Driver'
  - Model: Driver
  - Field: driverFilter
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 115** [ERROR]: Field 'driverFilter' does not exist on model 'Driver'
  - Model: Driver
  - Field: driverFilter
  - Suggestion: Available fields: id, userId, user, companyId, company...

- **Line 123** [ERROR]: Field 'truckFilter' does not exist on model 'Truck'
  - Model: Truck
  - Field: truckFilter
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 130** [ERROR]: Field 'truckFilter' does not exist on model 'Truck'
  - Model: Truck
  - Field: truckFilter
  - Suggestion: Available fields: id, companyId, company, truckNumber, vin...

- **Line 138** [ERROR]: Field 'loadFilter' does not exist on model 'Load'
  - Model: Load
  - Field: loadFilter
  - Suggestion: Available fields: id, loadNumber, companyId, company, customerId...

### app\dashboard\settlements\[id]\page.tsx

- **Line 26** [ERROR]: Field 'companyId' does not exist on model 'Settlement'
  - Model: Settlement
  - Field: companyId
  - Suggestion: Did you mean: id?

### app\dashboard\invoices\[id]\page.tsx

- **Line 24** [ERROR]: Field 'companyId' does not exist on model 'Invoice'
  - Model: Invoice
  - Field: companyId
  - Suggestion: Did you mean: id, factoringCompanyId?

- **Line 40** [ERROR]: Field 'loadIds' does not exist on model 'Load'
  - Model: Load
  - Field: loadIds
  - Suggestion: Did you mean: id?

### components\vendors\VendorList.tsx

- **Line 37** [WARNING]: Optionality mismatch: field 'email' is optional in DB but required in interface
  - Model: Vendor
  - Field: email

- **Line 38** [WARNING]: Optionality mismatch: field 'phone' is optional in DB but required in interface
  - Model: Vendor
  - Field: phone

- **Line 39** [WARNING]: Interface field 'isPrimary' does not exist in model 'Vendor'
  - Model: Vendor
  - Field: isPrimary

### components\trucks\TruckCombobox.tsx

- **Line 26** [WARNING]: Optionality mismatch: field 'make' is required in DB but optional in interface
  - Model: Truck
  - Field: make

- **Line 27** [WARNING]: Optionality mismatch: field 'model' is required in DB but optional in interface
  - Model: Truck
  - Field: model

- **Line 28** [WARNING]: Optionality mismatch: field 'vin' is required in DB but optional in interface
  - Model: Truck
  - Field: vin

### components\trailers\TrailerList.tsx

- **Line 49** [WARNING]: Optionality mismatch: field 'vin' is optional in DB but required in interface
  - Model: Trailer
  - Field: vin

- **Line 52** [WARNING]: Optionality mismatch: field 'year' is optional in DB but required in interface
  - Model: Trailer
  - Field: year

- **Line 54** [WARNING]: Optionality mismatch: field 'state' is optional in DB but required in interface
  - Model: Trailer
  - Field: state

- **Line 56** [WARNING]: Optionality mismatch: field 'mcNumberId' is required in DB but optional in interface
  - Model: Trailer
  - Field: mcNumberId

- **Line 57** [WARNING]: Interface field 'mcNumberRecord' does not exist in model 'Trailer'
  - Model: Trailer
  - Field: mcNumberRecord

- **Line 59** [WARNING]: Interface field 'number' does not exist in model 'Trailer'
  - Model: Trailer
  - Field: number

- **Line 60** [WARNING]: Interface field 'companyName' does not exist in model 'Trailer'
  - Model: Trailer
  - Field: companyName

### components\trailers\TrailerCombobox.tsx

- **Line 26** [WARNING]: Optionality mismatch: field 'make' is required in DB but optional in interface
  - Model: Trailer
  - Field: make

- **Line 27** [WARNING]: Optionality mismatch: field 'model' is required in DB but optional in interface
  - Model: Trailer
  - Field: model

### components\settlements\SettlementList.tsx

- **Line 32** [WARNING]: Interface field 'user' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: user

- **Line 33** [WARNING]: Interface field 'firstName' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: firstName

- **Line 34** [WARNING]: Interface field 'lastName' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: lastName

### components\safety\SafetyPage.tsx

- **Line 47** [WARNING]: Interface field 'driverNumber' does not exist in model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: driverNumber

- **Line 48** [WARNING]: Interface field 'user' does not exist in model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: user

- **Line 49** [WARNING]: Interface field 'firstName' does not exist in model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: firstName

- **Line 50** [WARNING]: Interface field 'lastName' does not exist in model 'SafetyIncident'
  - Model: SafetyIncident
  - Field: lastName

- **Line 71** [WARNING]: Interface field 'driverNumber' does not exist in model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: driverNumber

- **Line 72** [WARNING]: Interface field 'user' does not exist in model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: user

- **Line 73** [WARNING]: Interface field 'firstName' does not exist in model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: firstName

- **Line 74** [WARNING]: Interface field 'lastName' does not exist in model 'SafetyTraining'
  - Model: SafetyTraining
  - Field: lastName

### components\safety\DriverSelector.tsx

- **Line 12** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 13** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

### components\rate-confirmations\RateConfirmationList.tsx

- **Line 55** [WARNING]: Optionality mismatch: field 'rateConfNumber' is required in DB but optional in interface
  - Model: RateConfirmation
  - Field: rateConfNumber

- **Line 61** [WARNING]: Optionality mismatch: field 'paymentMethod' is required in DB but optional in interface
  - Model: RateConfirmation
  - Field: paymentMethod

- **Line 67** [WARNING]: Interface field 'loadNumber' does not exist in model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: loadNumber

- **Line 68** [WARNING]: Interface field 'customer' does not exist in model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customer

- **Line 69** [WARNING]: Interface field 'name' does not exist in model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: name

- **Line 70** [WARNING]: Interface field 'customerNumber' does not exist in model 'RateConfirmation'
  - Model: RateConfirmation
  - Field: customerNumber

### components\mobile\DriverMobileDashboard.tsx

- **Line 19** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 20** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

- **Line 33** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

### components\mobile\DriverLoadList.tsx

- **Line 16** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

### components\mobile\DriverLoadDetail.tsx

- **Line 20** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

- **Line 21** [WARNING]: Interface field 'customerNumber' does not exist in model 'Load'
  - Model: Load
  - Field: customerNumber

- **Line 22** [WARNING]: Interface field 'phone' does not exist in model 'Load'
  - Model: Load
  - Field: phone

- **Line 23** [WARNING]: Interface field 'email' does not exist in model 'Load'
  - Model: Load
  - Field: email

- **Line 24** [WARNING]: Interface field 'address' does not exist in model 'Load'
  - Model: Load
  - Field: address

### components\mobile\DriverBreakdownList.tsx

- **Line 22** [WARNING]: Interface field 'number' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: number

### components\mc-numbers\MultiMcSelector.tsx

- **Line 28** [WARNING]: Interface field 'isMcNumber' does not exist in model 'Company'
  - Model: Company
  - Field: isMcNumber

- **Line 29** [WARNING]: Interface field 'mcNumberId' does not exist in model 'Company'
  - Model: Company
  - Field: mcNumberId

### components\mc-numbers\McNumberList.tsx

- **Line 37** [WARNING]: Optionality mismatch: field 'companyPhone' is optional in DB but required in interface
  - Model: McNumber
  - Field: companyPhone

- **Line 41** [WARNING]: Optionality mismatch: field 'notes' is optional in DB but required in interface
  - Model: McNumber
  - Field: notes

### components\mc-numbers\McNumberForm.tsx

- **Line 48** [WARNING]: Optionality mismatch: field 'companyPhone' is optional in DB but required in interface
  - Model: McNumber
  - Field: companyPhone

- **Line 52** [WARNING]: Optionality mismatch: field 'notes' is optional in DB but required in interface
  - Model: McNumber
  - Field: notes

### components\maintenance\MaintenanceList.tsx

- **Line 38** [WARNING]: Optionality mismatch: field 'scheduledDate' is optional in DB but required in interface
  - Model: MaintenanceRecord
  - Field: scheduledDate

- **Line 39** [WARNING]: Optionality mismatch: field 'completedDate' is optional in DB but required in interface
  - Model: MaintenanceRecord
  - Field: completedDate

- **Line 40** [WARNING]: Optionality mismatch: field 'vendor' is optional in DB but required in interface
  - Model: MaintenanceRecord
  - Field: vendor

- **Line 41** [WARNING]: Optionality mismatch: field 'invoiceNumber' is optional in DB but required in interface
  - Model: MaintenanceRecord
  - Field: invoiceNumber

- **Line 44** [WARNING]: Interface field 'truckNumber' does not exist in model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: truckNumber

- **Line 45** [WARNING]: Interface field 'make' does not exist in model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: make

- **Line 46** [WARNING]: Interface field 'model' does not exist in model 'MaintenanceRecord'
  - Model: MaintenanceRecord
  - Field: model

### components\locations\LocationList.tsx

- **Line 26** [WARNING]: Optionality mismatch: field 'locationNumber' is optional in DB but required in interface
  - Model: Location
  - Field: locationNumber

- **Line 32** [WARNING]: Optionality mismatch: field 'zip' is optional in DB but required in interface
  - Model: Location
  - Field: zip

- **Line 33** [WARNING]: Optionality mismatch: field 'contactName' is required in DB but optional in interface
  - Model: Location
  - Field: contactName

- **Line 35** [WARNING]: Interface field 'pickupCount' does not exist in model 'Location'
  - Model: Location
  - Field: pickupCount

- **Line 36** [WARNING]: Interface field 'deliveryCount' does not exist in model 'Location'
  - Model: Location
  - Field: deliveryCount

### components\loads\LoadStopsDisplay.tsx

- **Line 20** [WARNING]: Optionality mismatch: field 'company' is required in DB but optional in interface
  - Model: LoadStop
  - Field: company

- **Line 30** [WARNING]: Optionality mismatch: field 'items' is required in DB but optional in interface
  - Model: LoadStop
  - Field: items

- **Line 31** [WARNING]: Interface field 'totalPieces' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: totalPieces

- **Line 32** [WARNING]: Interface field 'totalWeight' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: totalWeight

- **Line 33** [WARNING]: Interface field 'notes' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: notes

- **Line 34** [WARNING]: Interface field 'specialInstructions' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: specialInstructions

### components\loads\LoadSegments.tsx

- **Line 35** [WARNING]: Optionality mismatch: field 'startLocation' is required in DB but optional in interface
  - Model: LoadSegment
  - Field: startLocation

- **Line 36** [WARNING]: Optionality mismatch: field 'endLocation' is required in DB but optional in interface
  - Model: LoadSegment
  - Field: endLocation

- **Line 50** [WARNING]: Interface field 'driverNumber' does not exist in model 'LoadSegment'
  - Model: LoadSegment
  - Field: driverNumber

- **Line 51** [WARNING]: Interface field 'user' does not exist in model 'LoadSegment'
  - Model: LoadSegment
  - Field: user

- **Line 52** [WARNING]: Interface field 'firstName' does not exist in model 'LoadSegment'
  - Model: LoadSegment
  - Field: firstName

- **Line 53** [WARNING]: Interface field 'lastName' does not exist in model 'LoadSegment'
  - Model: LoadSegment
  - Field: lastName

### components\loads\LoadQuickView.tsx

- **Line 26** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

- **Line 27** [WARNING]: Interface field 'customerNumber' does not exist in model 'Load'
  - Model: Load
  - Field: customerNumber

### components\loads\LoadList.tsx

- **Line 75** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

- **Line 76** [WARNING]: Interface field 'customerNumber' does not exist in model 'Load'
  - Model: Load
  - Field: customerNumber

### components\loads\EditableLoadStops.tsx

- **Line 36** [WARNING]: Optionality mismatch: field 'company' is required in DB but optional in interface
  - Model: LoadStop
  - Field: company

- **Line 46** [WARNING]: Optionality mismatch: field 'items' is required in DB but optional in interface
  - Model: LoadStop
  - Field: items

- **Line 47** [WARNING]: Interface field 'totalPieces' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: totalPieces

- **Line 48** [WARNING]: Interface field 'totalWeight' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: totalWeight

- **Line 49** [WARNING]: Interface field 'notes' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: notes

- **Line 50** [WARNING]: Interface field 'specialInstructions' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: specialInstructions

### components\loads\AddStopDialog.tsx

- **Line 25** [WARNING]: Optionality mismatch: field 'company' is required in DB but optional in interface
  - Model: LoadStop
  - Field: company

- **Line 35** [WARNING]: Interface field 'notes' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: notes

- **Line 36** [WARNING]: Interface field 'specialInstructions' does not exist in model 'LoadStop'
  - Model: LoadStop
  - Field: specialInstructions

### components\layout\CompanySwitcher.tsx

- **Line 29** [WARNING]: Interface field 'isPrimary' does not exist in model 'Company'
  - Model: Company
  - Field: isPrimary

- **Line 30** [WARNING]: Interface field 'role' does not exist in model 'Company'
  - Model: Company
  - Field: role

- **Line 31** [WARNING]: Interface field 'isMcNumber' does not exist in model 'Company'
  - Model: Company
  - Field: isMcNumber

- **Line 32** [WARNING]: Interface field 'mcNumberId' does not exist in model 'Company'
  - Model: Company
  - Field: mcNumberId

- **Line 34** [WARNING]: Interface field 'companyId' does not exist in model 'Company'
  - Model: Company
  - Field: companyId

### components\invoices\InvoiceQuickView.tsx

- **Line 24** [WARNING]: Interface field 'name' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: name

- **Line 25** [WARNING]: Interface field 'customerNumber' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: customerNumber

### components\invoices\InvoiceList.tsx

- **Line 54** [WARNING]: Optionality mismatch: field 'loadId' is required in DB but optional in interface
  - Model: Invoice
  - Field: loadId

- **Line 56** [WARNING]: Interface field 'name' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: name

- **Line 57** [WARNING]: Interface field 'customerNumber' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: customerNumber

### components\inventory\InventoryList.tsx

- **Line 28** [WARNING]: Optionality mismatch: field 'category' is required in DB but optional in interface
  - Model: InventoryItem
  - Field: category

- **Line 29** [WARNING]: Optionality mismatch: field 'partNumber' is required in DB but optional in interface
  - Model: InventoryItem
  - Field: partNumber

- **Line 35** [WARNING]: Optionality mismatch: field 'warehouseLocation' is required in DB but optional in interface
  - Model: InventoryItem
  - Field: warehouseLocation

- **Line 39** [WARNING]: Interface field 'vendorNumber' does not exist in model 'InventoryItem'
  - Model: InventoryItem
  - Field: vendorNumber

### components\inspections\InspectionList.tsx

- **Line 40** [WARNING]: Interface field 'truckNumber' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: truckNumber

- **Line 41** [WARNING]: Interface field 'make' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: make

- **Line 42** [WARNING]: Interface field 'model' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: model

### components\fleet\OnCallSchedule.tsx

- **Line 44** [WARNING]: Interface field 'userId' does not exist in model 'OnCallShift'
  - Model: OnCallShift
  - Field: userId

- **Line 45** [WARNING]: Interface field 'userName' does not exist in model 'OnCallShift'
  - Model: OnCallShift
  - Field: userName

- **Line 46** [WARNING]: Interface field 'userEmail' does not exist in model 'OnCallShift'
  - Model: OnCallShift
  - Field: userEmail

- **Line 47** [WARNING]: Interface field 'userPhone' does not exist in model 'OnCallShift'
  - Model: OnCallShift
  - Field: userPhone

- **Line 51** [WARNING]: Interface field 'handoffNotes' does not exist in model 'OnCallShift'
  - Model: OnCallShift
  - Field: handoffNotes

### components\fleet\FleetInspections.tsx

- **Line 51** [WARNING]: Interface field 'truckNumber' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: truckNumber

- **Line 52** [WARNING]: Interface field 'make' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: make

- **Line 53** [WARNING]: Interface field 'model' does not exist in model 'Inspection'
  - Model: Inspection
  - Field: model

### components\fleet\CommunicationHub.tsx

- **Line 44** [WARNING]: Optionality mismatch: field 'mediaUrls' is required in DB but optional in interface
  - Model: Communication
  - Field: mediaUrls

- **Line 45** [WARNING]: Interface field 'createdAt' does not exist in model 'Communication'
  - Model: Communication
  - Field: createdAt

- **Line 47** [WARNING]: Interface field 'user' does not exist in model 'Communication'
  - Model: Communication
  - Field: user

- **Line 48** [WARNING]: Interface field 'firstName' does not exist in model 'Communication'
  - Model: Communication
  - Field: firstName

- **Line 49** [WARNING]: Interface field 'lastName' does not exist in model 'Communication'
  - Model: Communication
  - Field: lastName

### components\fleet\BreakdownVendorDirectory.tsx

- **Line 54** [WARNING]: Optionality mismatch: field 'email' is optional in DB but required in interface
  - Model: Vendor
  - Field: email

- **Line 55** [WARNING]: Optionality mismatch: field 'phone' is optional in DB but required in interface
  - Model: Vendor
  - Field: phone

- **Line 56** [WARNING]: Interface field 'isPrimary' does not exist in model 'Vendor'
  - Model: Vendor
  - Field: isPrimary

### components\fleet\BreakdownHistory.tsx

- **Line 51** [WARNING]: Interface field 'truckNumber' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber

- **Line 52** [WARNING]: Interface field 'make' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: make

- **Line 53** [WARNING]: Interface field 'model' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: model

### components\fleet\ActiveBreakdownsDashboard.tsx

- **Line 46** [WARNING]: Interface field 'timeElapsed' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: timeElapsed

- **Line 47** [WARNING]: Interface field 'elapsedMinutes' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: elapsedMinutes

- **Line 55** [WARNING]: Interface field 'truckNumber' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber

- **Line 56** [WARNING]: Interface field 'make' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: make

- **Line 57** [WARNING]: Interface field 'model' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: model

- **Line 58** [WARNING]: Interface field 'year' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: year

### components\factoring\FactoringCompanyList.tsx

- **Line 62** [WARNING]: Optionality mismatch: field 'apiProvider' is required in DB but optional in interface
  - Model: FactoringCompany
  - Field: apiProvider

- **Line 63** [WARNING]: Optionality mismatch: field 'exportFormat' is required in DB but optional in interface
  - Model: FactoringCompany
  - Field: exportFormat

- **Line 68** [WARNING]: Interface field '_count' does not exist in model 'FactoringCompany'
  - Model: FactoringCompany
  - Field: _count

### components\documents\DocumentList.tsx

- **Line 32** [WARNING]: Optionality mismatch: field 'fileSize' is required in DB but optional in interface
  - Model: Document
  - Field: fileSize

- **Line 36** [WARNING]: Interface field 'firstName' does not exist in model 'Document'
  - Model: Document
  - Field: firstName

- **Line 37** [WARNING]: Interface field 'lastName' does not exist in model 'Document'
  - Model: Document
  - Field: lastName

### components\drivers\DriverTable.tsx

- **Line 29** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 30** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

- **Line 31** [WARNING]: Interface field 'email' does not exist in model 'Driver'
  - Model: Driver
  - Field: email

- **Line 32** [WARNING]: Interface field 'phone' does not exist in model 'Driver'
  - Model: Driver
  - Field: phone

### components\drivers\DriverSettlementHistory.tsx

- **Line 24** [WARNING]: Interface field 'totalDeductions' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: totalDeductions

- **Line 28** [WARNING]: Interface field 'paidAt' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: paidAt

### components\drivers\DriverQuickView.tsx

- **Line 25** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 26** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

- **Line 27** [WARNING]: Interface field 'email' does not exist in model 'Driver'
  - Model: Driver
  - Field: email

- **Line 28** [WARNING]: Interface field 'phone' does not exist in model 'Driver'
  - Model: Driver
  - Field: phone

### components\drivers\DriverPaymentsActivity.tsx

- **Line 36** [WARNING]: Interface field 'activityType' does not exist in model 'Payment'
  - Model: Payment
  - Field: activityType

- **Line 44** [WARNING]: Interface field 'number' does not exist in model 'Payment'
  - Model: Payment
  - Field: number

- **Line 45** [WARNING]: Interface field 'companyName' does not exist in model 'Payment'
  - Model: Payment
  - Field: companyName

### components\drivers\DriverListWithTabs.tsx

- **Line 40** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 41** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

- **Line 42** [WARNING]: Interface field 'email' does not exist in model 'Driver'
  - Model: Driver
  - Field: email

- **Line 43** [WARNING]: Interface field 'phone' does not exist in model 'Driver'
  - Model: Driver
  - Field: phone

### components\drivers\DriverList.tsx

- **Line 64** [WARNING]: Optionality mismatch: field 'drugTestDate' is optional in DB but required in interface
  - Model: Driver
  - Field: drugTestDate

- **Line 65** [WARNING]: Optionality mismatch: field 'backgroundCheck' is optional in DB but required in interface
  - Model: Driver
  - Field: backgroundCheck

- **Line 67** [WARNING]: Optionality mismatch: field 'homeTerminal' is optional in DB but required in interface
  - Model: Driver
  - Field: homeTerminal

- **Line 68** [WARNING]: Optionality mismatch: field 'emergencyContact' is optional in DB but required in interface
  - Model: Driver
  - Field: emergencyContact

- **Line 69** [WARNING]: Optionality mismatch: field 'emergencyPhone' is optional in DB but required in interface
  - Model: Driver
  - Field: emergencyPhone

- **Line 72** [WARNING]: Optionality mismatch: field 'rating' is optional in DB but required in interface
  - Model: Driver
  - Field: rating

- **Line 78** [WARNING]: Interface field 'truckNumber' does not exist in model 'Driver'
  - Model: Driver
  - Field: truckNumber

### components\drivers\DriverCombobox.tsx

- **Line 27** [WARNING]: Interface field 'firstName' does not exist in model 'Driver'
  - Model: Driver
  - Field: firstName

- **Line 28** [WARNING]: Interface field 'lastName' does not exist in model 'Driver'
  - Model: Driver
  - Field: lastName

### components\dashboard\RecentLoads.tsx

- **Line 16** [WARNING]: Optionality mismatch: field 'pickupCity' is optional in DB but required in interface
  - Model: Load
  - Field: pickupCity

- **Line 17** [WARNING]: Optionality mismatch: field 'pickupState' is optional in DB but required in interface
  - Model: Load
  - Field: pickupState

- **Line 18** [WARNING]: Optionality mismatch: field 'deliveryCity' is optional in DB but required in interface
  - Model: Load
  - Field: deliveryCity

- **Line 19** [WARNING]: Optionality mismatch: field 'deliveryState' is optional in DB but required in interface
  - Model: Load
  - Field: deliveryState

- **Line 20** [WARNING]: Optionality mismatch: field 'pickupDate' is optional in DB but required in interface
  - Model: Load
  - Field: pickupDate

- **Line 23** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

### components\customers\CustomerCombobox.tsx

- **Line 27** [WARNING]: Optionality mismatch: field 'email' is required in DB but optional in interface
  - Model: Customer
  - Field: email

### components\calendar\LoadCalendar.tsx

- **Line 17** [WARNING]: Optionality mismatch: field 'pickupDate' is optional in DB but required in interface
  - Model: Load
  - Field: pickupDate

- **Line 19** [WARNING]: Optionality mismatch: field 'pickupCity' is optional in DB but required in interface
  - Model: Load
  - Field: pickupCity

- **Line 20** [WARNING]: Optionality mismatch: field 'pickupState' is optional in DB but required in interface
  - Model: Load
  - Field: pickupState

- **Line 21** [WARNING]: Optionality mismatch: field 'deliveryCity' is optional in DB but required in interface
  - Model: Load
  - Field: deliveryCity

- **Line 22** [WARNING]: Optionality mismatch: field 'deliveryState' is optional in DB but required in interface
  - Model: Load
  - Field: deliveryState

- **Line 24** [WARNING]: Interface field 'name' does not exist in model 'Load'
  - Model: Load
  - Field: name

### components\breakdowns\BreakdownList.tsx

- **Line 35** [WARNING]: Interface field 'truckNumber' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: truckNumber

- **Line 36** [WARNING]: Interface field 'make' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: make

- **Line 37** [WARNING]: Interface field 'model' does not exist in model 'Breakdown'
  - Model: Breakdown
  - Field: model

### components\batches\BatchInvoiceSelector.tsx

- **Line 23** [WARNING]: Interface field 'name' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: name

- **Line 24** [WARNING]: Interface field 'customerNumber' does not exist in model 'Invoice'
  - Model: Invoice
  - Field: customerNumber

### components\activity\ActivityFeed.tsx

- **Line 35** [WARNING]: Optionality mismatch: field 'entityId' is optional in DB but required in interface
  - Model: ActivityLog
  - Field: entityId

- **Line 36** [WARNING]: Optionality mismatch: field 'description' is optional in DB but required in interface
  - Model: ActivityLog
  - Field: description

- **Line 37** [WARNING]: Optionality mismatch: field 'metadata' is optional in DB but required in interface
  - Model: ActivityLog
  - Field: metadata

- **Line 38** [WARNING]: Optionality mismatch: field 'user' is optional in DB but required in interface
  - Model: ActivityLog
  - Field: user

- **Line 40** [WARNING]: Interface field 'firstName' does not exist in model 'ActivityLog'
  - Model: ActivityLog
  - Field: firstName

- **Line 41** [WARNING]: Interface field 'lastName' does not exist in model 'ActivityLog'
  - Model: ActivityLog
  - Field: lastName

- **Line 42** [WARNING]: Interface field 'email' does not exist in model 'ActivityLog'
  - Model: ActivityLog
  - Field: email

### components\accounting\SettlementApprovalQueue.tsx

- **Line 23** [WARNING]: Interface field 'driverNumber' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: driverNumber

- **Line 24** [WARNING]: Interface field 'user' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: user

- **Line 25** [WARNING]: Interface field 'firstName' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: firstName

- **Line 26** [WARNING]: Interface field 'lastName' does not exist in model 'Settlement'
  - Model: Settlement
  - Field: lastName

### components\accounting\PaymentTracking.tsx

- **Line 45** [WARNING]: Interface field 'number' does not exist in model 'Payment'
  - Model: Payment
  - Field: number

### components\accounting\AdvanceApprovalQueue.tsx

- **Line 40** [WARNING]: Interface field 'driverNumber' does not exist in model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: driverNumber

- **Line 41** [WARNING]: Interface field 'user' does not exist in model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: user

- **Line 42** [WARNING]: Interface field 'firstName' does not exist in model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: firstName

- **Line 43** [WARNING]: Interface field 'lastName' does not exist in model 'DriverAdvance'
  - Model: DriverAdvance
  - Field: lastName

### components\accessorial\AccessorialChargesList.tsx

- **Line 56** [WARNING]: Optionality mismatch: field 'description' is optional in DB but required in interface
  - Model: AccessorialCharge
  - Field: description

- **Line 68** [WARNING]: Interface field 'loadNumber' does not exist in model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: loadNumber

- **Line 69** [WARNING]: Interface field 'customer' does not exist in model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customer

- **Line 70** [WARNING]: Interface field 'name' does not exist in model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: name

- **Line 71** [WARNING]: Interface field 'customerNumber' does not exist in model 'AccessorialCharge'
  - Model: AccessorialCharge
  - Field: customerNumber

### components\settings\customizations\TagManagement.tsx

- **Line 42** [WARNING]: Optionality mismatch: field 'description' is optional in DB but required in interface
  - Model: Tag
  - Field: description

### components\settings\customizations\ExpenseCategories.tsx

- **Line 40** [WARNING]: Optionality mismatch: field 'description' is optional in DB but required in interface
  - Model: ExpenseCategory
  - Field: description

- **Line 42** [WARNING]: Optionality mismatch: field 'parent' is optional in DB but required in interface
  - Model: ExpenseCategory
  - Field: parent

### components\safety\investigations\InvestigationWorkflow.tsx

- **Line 20** [WARNING]: Optionality mismatch: field 'dueDate' is optional in DB but required in interface
  - Model: Investigation
  - Field: dueDate

- **Line 27** [WARNING]: Optionality mismatch: field 'contributingFactors' is optional in DB but required in interface
  - Model: Investigation
  - Field: contributingFactors

- **Line 28** [WARNING]: Optionality mismatch: field 'rootCause' is optional in DB but required in interface
  - Model: Investigation
  - Field: rootCause

- **Line 29** [WARNING]: Optionality mismatch: field 'findings' is optional in DB but required in interface
  - Model: Investigation
  - Field: findings

- **Line 30** [WARNING]: Optionality mismatch: field 'correctiveActions' is optional in DB but required in interface
  - Model: Investigation
  - Field: correctiveActions

- **Line 31** [WARNING]: Optionality mismatch: field 'recommendations' is optional in DB but required in interface
  - Model: Investigation
  - Field: recommendations

- **Line 34** [WARNING]: Interface field 'incidentNumber' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: incidentNumber

- **Line 35** [WARNING]: Interface field 'incidentType' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: incidentType

- **Line 36** [WARNING]: Interface field 'date' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: date

- **Line 37** [WARNING]: Interface field 'driver' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: driver

- **Line 38** [WARNING]: Interface field 'user' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: user

- **Line 39** [WARNING]: Interface field 'firstName' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: firstName

- **Line 40** [WARNING]: Interface field 'lastName' does not exist in model 'Investigation'
  - Model: Investigation
  - Field: lastName

### components\safety\defects\DefectDashboard.tsx

- **Line 18** [WARNING]: Optionality mismatch: field 'resolvedAt' is optional in DB but required in interface
  - Model: Defect
  - Field: resolvedAt

- **Line 21** [WARNING]: Optionality mismatch: field 'truck' is optional in DB but required in interface
  - Model: Defect
  - Field: truck

- **Line 23** [WARNING]: Interface field 'truckNumber' does not exist in model 'Defect'
  - Model: Defect
  - Field: truckNumber

### components\safety\drivers\MVRManager.tsx

- **Line 21** [WARNING]: Optionality mismatch: field 'points' is optional in DB but required in interface
  - Model: MVRViolation
  - Field: points

- **Line 31** [WARNING]: Optionality mismatch: field 'document' is optional in DB but required in interface
  - Model: MVRRecord
  - Field: document

- **Line 33** [WARNING]: Interface field 'fileName' does not exist in model 'MVRRecord'
  - Model: MVRRecord
  - Field: fileName

### components\safety\drivers\MedicalCardManager.tsx

- **Line 18** [WARNING]: Optionality mismatch: field 'issueDate' is optional in DB but required in interface
  - Model: MedicalCard
  - Field: issueDate

- **Line 19** [WARNING]: Optionality mismatch: field 'medicalExaminerName' is optional in DB but required in interface
  - Model: MedicalCard
  - Field: medicalExaminerName

- **Line 20** [WARNING]: Optionality mismatch: field 'document' is optional in DB but required in interface
  - Model: MedicalCard
  - Field: document

- **Line 22** [WARNING]: Interface field 'fileName' does not exist in model 'MedicalCard'
  - Model: MedicalCard
  - Field: fileName

### components\safety\drivers\HOSDashboard.tsx

- **Line 22** [WARNING]: Interface field 'drivingHours' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: drivingHours

- **Line 23** [WARNING]: Interface field 'onDutyHours' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: onDutyHours

- **Line 24** [WARNING]: Interface field 'offDutyHours' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: offDutyHours

- **Line 25** [WARNING]: Interface field 'sleeperBerthHours' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: sleeperBerthHours

- **Line 26** [WARNING]: Interface field 'totalHours' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: totalHours

- **Line 27** [WARNING]: Optionality mismatch: field 'violations' is optional in DB but required in interface
  - Model: HOSRecord
  - Field: violations

- **Line 29** [WARNING]: Interface field 'violationType' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: violationType

- **Line 30** [WARNING]: Interface field 'violationDescription' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: violationDescription

- **Line 31** [WARNING]: Interface field 'violationDate' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: violationDate

- **Line 32** [WARNING]: Interface field 'hoursExceeded' does not exist in model 'HOSRecord'
  - Model: HOSRecord
  - Field: hoursExceeded

- **Line 41** [WARNING]: Optionality mismatch: field 'hoursExceeded' is optional in DB but required in interface
  - Model: HOSViolation
  - Field: hoursExceeded

### components\safety\drivers\CDLManager.tsx

- **Line 19** [WARNING]: Optionality mismatch: field 'issueDate' is optional in DB but required in interface
  - Model: CDLRecord
  - Field: issueDate

- **Line 24** [WARNING]: Optionality mismatch: field 'document' is optional in DB but required in interface
  - Model: CDLRecord
  - Field: document

- **Line 26** [WARNING]: Interface field 'fileName' does not exist in model 'CDLRecord'
  - Model: CDLRecord
  - Field: fileName

### components\safety\drivers\AnnualReviewForm.tsx

- **Line 26** [WARNING]: Optionality mismatch: field 'reviewNotes' is optional in DB but required in interface
  - Model: AnnualReview
  - Field: reviewNotes

- **Line 27** [WARNING]: Optionality mismatch: field 'performanceNotes' is optional in DB but required in interface
  - Model: AnnualReview
  - Field: performanceNotes

- **Line 28** [WARNING]: Optionality mismatch: field 'actionItems' is optional in DB but required in interface
  - Model: AnnualReview
  - Field: actionItems

- **Line 32** [WARNING]: Interface field 'document' does not exist in model 'AnnualReview'
  - Model: AnnualReview
  - Field: document

- **Line 34** [WARNING]: Interface field 'fileName' does not exist in model 'AnnualReview'
  - Model: AnnualReview
  - Field: fileName

