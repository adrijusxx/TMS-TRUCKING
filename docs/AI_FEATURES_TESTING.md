# AI Features Testing Guide

## Overview

This guide helps you verify that all AI features are working correctly. Since the project doesn't have automated tests, we'll use manual testing and a testing component.

## Prerequisites

1. **Environment Setup**
   - Ensure `DEEPSEEK_API_KEY` is set in your `.env` file
   - The API key should be: `sk-be6d955aafb84e25bfb9c18ef425ca31` (or your own key)

2. **Database Requirements**
   - You need at least some test data:
     - Loads (for load matching, route optimization, backhaul)
     - Drivers (for load matching, safety prediction)
     - Trucks (for maintenance prediction, safety prediction)
     - Invoices (for cash flow prediction)
     - Expenses (for expense categorization)
     - Historical data (for forecasting, anomaly detection)

## Testing Methods

### Method 1: API Testing Component (Recommended)

We'll create a testing component similar to `EDITesting.tsx` that allows you to test all AI endpoints from the UI.

### Method 2: Manual API Testing

Use tools like:
- **Postman** or **Insomnia** for API testing
- **curl** commands from terminal
- **Browser DevTools** Network tab

### Method 3: Integration Testing

Test features in their natural context:
- Load matching from dispatch board
- Rate recommendations when creating loads
- Maintenance predictions from truck details page

## Testing Checklist

### Phase 1: High-Impact Features

#### 1. Intelligent Load Matching
**Endpoint:** `POST /api/ai/load-matching`

**Test Steps:**
1. Navigate to dispatch board
2. Select an unassigned load
3. Click "Get AI Recommendations"
4. Verify recommendations appear with match scores
5. Check that recommendations consider:
   - Equipment compatibility
   - Location proximity
   - Historical performance
   - HOS compliance

**Expected Result:**
- Returns 1-5 driver recommendations
- Each recommendation has match score (0-100)
- Reasoning provided for each match
- Factors displayed (equipment match, HOS compliant, etc.)

**Test Data Needed:**
- At least 1 unassigned load
- At least 2-3 available drivers
- Historical load data for those drivers

#### 2. Expense Auto-Categorization
**Endpoint:** `POST /api/ai/expense-categorization`

**Test Steps:**
1. Create a test expense with description
2. Call API with expense details
3. Verify category and expense type are suggested
4. Check confidence score

**Test Payload:**
```json
{
  "description": "Fuel purchase at Pilot Travel Center",
  "vendor": "Pilot",
  "amount": 450.00
}
```

**Expected Result:**
- Returns suggested `categoryId` and `expenseTypeId`
- Confidence score provided
- Reasoning explains why this category was chosen

#### 3. Document Processing
**Endpoint:** `POST /api/ai/document-processor`

**Test Steps:**
1. Upload a PDF invoice or receipt
2. Extract text from PDF
3. Call document processor API
4. Verify structured data is extracted

**Test Document Types:**
- Invoice (should extract invoice number, amounts, dates)
- Receipt (should extract vendor, items, total)
- Safety document (CDL, medical card - should extract expiry dates)
- Maintenance record (should extract cost, mileage, type)

### Phase 2: Operational Efficiency

#### 4. Route Optimization
**Endpoint:** `POST /api/ai/route-optimization`

**Test Steps:**
1. Select 3-5 loads from load list
2. Call route optimization API
3. Verify optimized sequence is returned
4. Check metrics (distance, time, cost savings)

**Test Payload:**
```json
{
  "loadIds": ["load_id_1", "load_id_2", "load_id_3"],
  "optimizationType": "DISTANCE",
  "driverId": "optional_driver_id"
}
```

#### 5. Predictive Maintenance
**Endpoint:** `POST /api/ai/maintenance-prediction`

**Test Steps:**
1. Navigate to a truck details page
2. Call maintenance prediction API
3. Verify predictions for upcoming maintenance
4. Check urgency levels and confidence scores

**Expected Result:**
- Returns array of maintenance predictions
- Each prediction has type, predicted date, urgency
- Recommendations provided

#### 6. Rate Recommendations
**Endpoint:** `POST /api/ai/rate-recommendations`

**Test Steps:**
1. When creating a new load, call rate recommendation API
2. Verify recommended rate is provided
3. Check comparison with historical rates

**Test Payload:**
```json
{
  "pickupCity": "Los Angeles",
  "pickupState": "CA",
  "deliveryCity": "Dallas",
  "deliveryState": "TX",
  "equipmentType": "DRY_VAN",
  "totalMiles": 1450
}
```

### Phase 3: Advanced Analytics

#### 7. Safety Risk Prediction
**Endpoint:** `POST /api/ai/safety-risk`

**Test Steps:**
1. Select a driver or truck
2. Call safety risk API
3. Verify risk level and score
4. Check recommendations

**Expected Result:**
- Risk level (LOW/MEDIUM/HIGH/CRITICAL)
- Risk score (0-100)
- Factors contributing to risk
- Recommendations for improvement

#### 8. Anomaly Detection
**Endpoint:** `POST /api/ai/anomaly-detection`

**Test Steps:**
1. Call anomaly detection for different types:
   - FUEL_COST
   - DELAY
   - REVENUE
   - MAINTENANCE_COST
2. Verify anomalies are detected
3. Check severity levels

**Test Payload:**
```json
{
  "type": "FUEL_COST",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

#### 9. Revenue Forecasting
**Service:** `AIRevenueForecaster`

**Test Steps:**
1. Call revenue forecast service
2. Verify enhanced forecast with AI insights
3. Check seasonal adjustments and trends

#### 10. Cash Flow Prediction
**Endpoint:** `POST /api/ai/cash-flow-prediction`

**Test Steps:**
1. Call cash flow prediction API
2. Verify daily predictions for next 30 days
3. Check inflow/outflow breakdown

**Expected Result:**
- Daily cash flow predictions
- Breakdown by invoices, settlements, advances
- Recommendations for cash flow optimization

### Phase 4: Customer Experience

#### 11. Customer Service Chatbot
**Endpoint:** `POST /api/ai/chatbot`

**Test Steps:**
1. Send various messages:
   - "What's the status of load LOAD-123?"
   - "What's the balance on invoice INV-456?"
   - "How do I track my shipment?"
2. Verify helpful responses
3. Check that structured data is returned when appropriate

**Test Messages:**
```
"What's the status of load LOAD-001?"
"Show me invoice INV-123"
"Help me track my shipment"
```

#### 12. Backhaul Recommendations
**Endpoint:** `POST /api/ai/backhaul-recommendations`

**Test Steps:**
1. When a load is delivered, call backhaul API
2. Verify recommendations for nearby loads
3. Check match scores and reasoning

**Test Payload:**
```json
{
  "deliveryCity": "Dallas",
  "deliveryState": "TX",
  "deliveryDate": "2024-12-20T00:00:00Z",
  "equipmentType": "DRY_VAN"
}
```

## Common Issues & Troubleshooting

### Issue: "AI processing failed"
**Solution:**
- Check `DEEPSEEK_API_KEY` is set correctly
- Verify API key is valid and has credits
- Check network connectivity

### Issue: "No recommendations returned"
**Solution:**
- Ensure you have sufficient test data
- Check that filters aren't too restrictive
- Verify data relationships (driver-truck, load-customer, etc.)

### Issue: "JSON parse error"
**Solution:**
- This is handled automatically by the base service
- If persistent, check AI response format
- May need to adjust prompt or max tokens

### Issue: "Slow response times"
**Solution:**
- AI calls can take 2-5 seconds
- Consider implementing caching for frequently accessed data
- Use loading states in UI

## Performance Benchmarks

Expected response times:
- Load matching: 3-5 seconds
- Expense categorization: 1-2 seconds
- Document processing: 2-4 seconds
- Route optimization: 4-6 seconds
- Maintenance prediction: 2-3 seconds
- Rate recommendations: 2-3 seconds
- Safety prediction: 3-4 seconds
- Anomaly detection: 3-5 seconds
- Revenue forecasting: 2-3 seconds
- Cash flow prediction: 3-4 seconds
- Chatbot: 1-2 seconds
- Backhaul recommendations: 2-3 seconds

## Next Steps

1. Create a testing component (similar to EDITesting.tsx)
2. Add error logging for AI calls
3. Implement caching for expensive operations
4. Add rate limiting to prevent API abuse
5. Monitor API usage and costs

