# Comprehensive Load-to-Invoice Audit System

This audit system provides comprehensive testing and validation of the entire workflow from load creation through invoicing, including all financial calculations, expenses, deductions, and critical system functions.

## Overview

The audit system is organized into 7 phases:

1. **Test Data Generation** - Creates test data for comprehensive testing
2. **End-to-End Workflow Testing** - Tests load creation, completion, and validation
3. **Financial Calculation Audits** - Validates all revenue, expense, and pay calculations
4. **Critical Function Testing** - Tests invoice creation, batches, multi-stops, splits
5. **Data Consistency Validation** - Audits existing data for inconsistencies
6. **Edge Cases and Problem Scenarios** - Tests error handling and edge cases
7. **Comprehensive Reporting** - Generates detailed audit reports

## Quick Start

### Run Full Audit

```bash
# Run complete audit (generates test data + runs all tests)
npm run audit:full

# Run audit without generating test data (uses existing data)
npm run audit:full:skip-data

# Run specific phase only
npm run audit:full -- --phase=3
```

### Run Individual Scripts

```bash
# Generate test data
npm run audit:loads
npm run audit:expenses
npm run audit:accessorials
npm run audit:advances

# Run specific audits
npm run audit:revenue
npm run audit:driver-pay

# Run workflow tests
npm run audit:test-load-creation
npm run audit:test-load-completion
npm run audit:test-ready-to-bill
```

## Available Scripts

### Test Data Generators

- `generate-test-loads.ts` - Creates test loads with various scenarios
- `generate-test-expenses.ts` - Generates test expenses for loads
- `generate-test-accessorials.ts` - Creates accessorial charges
- `generate-test-advances.ts` - Generates driver advances

### Workflow Tests

- `test-load-creation.ts` - Tests manual, multi-stop, and split load creation
- `test-load-completion.ts` - Tests status transitions and completion workflow
- `test-ready-to-bill.ts` - Tests billing validation gates

### Calculation Audits

- `audit-revenue-calculations.ts` - Validates revenue calculations and invoice totals
- `audit-driver-pay.ts` - Tests driver pay calculations (CPM, percentage, hourly)
- `audit-expense-calculations.ts` - Validates expense calculations
- `audit-accessorial-calculations.ts` - Tests accessorial charge calculations
- `audit-deduction-calculations.ts` - Validates deduction calculations
- `audit-profit-calculations.ts` - Tests profit and margin calculations
- `audit-invoice-totals.ts` - Validates invoice total calculations

### Function Tests

- `test-invoice-creation.ts` - Tests invoice creation scenarios
- `test-batch-creation.ts` - Tests batch creation and management
- `test-multi-stop-loads.ts` - Tests multi-stop load functionality
- `test-split-loads.ts` - Tests load split functionality
- `test-billing-hold.ts` - Tests billing hold scenarios

### Data Validation

- `audit-existing-data.ts` - Validates all existing loads
- `reconcile-invoices-loads.ts` - Reconciles invoices with loads
- `reconcile-settlements.ts` - Reconciles settlement calculations
- `reconcile-batches.ts` - Validates batch totals

### Edge Cases

- `test-edge-cases.ts` - Tests zero revenue, negative values, missing data
- `test-error-handling.ts` - Tests error scenarios

### Reporting

- `generate-audit-report.ts` - Generates comprehensive audit reports
- `run-full-audit.ts` - Main orchestrator that runs all audits

## Key Calculation Formulas Verified

1. **Load Revenue:** `baseRate + fuelSurcharge + accessorialCharges`
2. **Driver Pay (CPM):** `(loadedMiles + emptyMiles) * payRate`
3. **Driver Pay (Percentage):** `(invoiceTotal - fuelSurcharge) * percentage`
4. **Load Cost:** `driverPay + fuelCosts + expenses`
5. **Net Profit:** `revenue - totalCost`
6. **Invoice Total:** `subtotal + tax`
7. **Settlement Net Pay:** `grossPay - deductions - advances`
8. **Batch Total:** `sum(invoice.totals)`

## Testing Scenarios Covered

- Single load, single invoice
- Multiple loads, single invoice
- Single load, multiple invoices (split invoicing)
- Multi-stop loads invoicing
- Split loads with different drivers
- Loads with accessorial charges
- Loads with billing holds
- Factored customer invoices
- Non-factored customer invoices
- Driver settlements with various pay types
- Batches with multiple invoices

## Report Output

Audit reports are saved to `audit-reports/audit-report-{timestamp}.md` and include:

- Executive summary with pass/fail statistics
- Detailed phase results
- Calculation discrepancies found
- Data inconsistencies
- Missing data issues
- Recommendations for fixes

## Extending the Audit System

To add new audit tests:

1. Create a new script in the appropriate directory
2. Follow the existing pattern with test results
3. Import and run from `run-full-audit.ts`
4. Add npm script to `package.json`

## Notes

- Test data generators create temporary data that should be cleaned up after testing
- Some tests require existing data (drivers, customers, etc.) - seed database first
- Audit reports include timestamps and can be archived for tracking over time
- Individual scripts can be run for targeted testing

## Troubleshooting

### "No company found" error
- Ensure database is seeded with `npm run db:seed`

### "Missing required data" errors
- Run test data generators first or ensure existing data exists

### Calculation mismatches
- Check if formulas match business rules
- Verify accessorial charges and expenses are approved/billed correctly
- Ensure rate confirmations are linked properly




















