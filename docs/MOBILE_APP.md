# Driver Mobile App API Documentation

## Overview

The TMS provides a RESTful API for driver mobile applications. This API allows drivers to:
- Authenticate and access their account
- View assigned loads
- Update load status
- Check HOS (Hours of Service) status
- Access load details and customer information

## Base URL

```
https://your-domain.com/api/mobile
```

## Authentication

All endpoints (except `/auth`) require authentication via NextAuth session. Drivers must log in through the mobile app first.

### Login Endpoint

**POST** `/api/mobile/auth`

**Request Body:**
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "driver@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "driver": {
      "id": "driver_id",
      "driverNumber": "DRV-001",
      "status": "AVAILABLE",
      "licenseNumber": "DL123456",
      "licenseState": "CA"
    },
    "company": {
      "id": "company_id",
      "name": "ABC Trucking"
    }
  }
}
```

## Loads

### Get All Loads

**GET** `/api/mobile/loads`

**Query Parameters:**
- `status` (optional): Filter by load status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "loads": [
      {
        "id": "load_id",
        "loadNumber": "LD-001",
        "status": "ASSIGNED",
        "pickup": {
          "city": "Los Angeles",
          "state": "CA",
          "address": "123 Main St",
          "date": "2024-11-15T08:00:00Z",
          "timeWindow": "8:00 AM - 10:00 AM",
          "contact": "John Smith",
          "phone": "555-1234",
          "latitude": 34.0522,
          "longitude": -118.2437
        },
        "delivery": {
          "city": "San Francisco",
          "state": "CA",
          "address": "456 Oak Ave",
          "date": "2024-11-16T14:00:00Z",
          "timeWindow": "2:00 PM - 4:00 PM",
          "contact": "Jane Doe",
          "phone": "555-5678",
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "customer": {
          "name": "ABC Logistics",
          "phone": "555-9999",
          "email": "contact@abclogistics.com"
        },
        "commodity": "Electronics",
        "weight": 15000,
        "revenue": 2500.00,
        "notes": "Fragile - Handle with care"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Single Load

**GET** `/api/mobile/loads/[id]`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "load_id",
    "loadNumber": "LD-001",
    "status": "ASSIGNED",
    "pickup": { /* ... */ },
    "delivery": { /* ... */ },
    "customer": { /* ... */ },
    "commodity": "Electronics",
    "weight": 15000,
    "revenue": 2500.00,
    "notes": "Fragile - Handle with care",
    "statusHistory": [
      {
        "status": "ASSIGNED",
        "location": "Los Angeles, CA",
        "timestamp": "2024-11-14T10:00:00Z",
        "notes": "Load assigned to driver"
      }
    ]
  }
}
```

### Update Load Status

**PATCH** `/api/mobile/loads/[id]`

**Request Body:**
```json
{
  "status": "EN_ROUTE_PICKUP",
  "location": "Los Angeles, CA",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "notes": "On the way to pickup location"
}
```

**Valid Status Values:**
- `PENDING`
- `ASSIGNED`
- `EN_ROUTE_PICKUP`
- `AT_PICKUP`
- `LOADED`
- `EN_ROUTE_DELIVERY`
- `AT_DELIVERY`
- `DELIVERED`
- `INVOICED`
- `PAID`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "load_id",
    "status": "EN_ROUTE_PICKUP"
  }
}
```

## Hours of Service (HOS)

### Get HOS Status

**GET** `/api/mobile/hos/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "driverId": "driver_id",
    "status": "DRIVING",
    "today": {
      "driveTime": 6.5,
      "onDutyTime": 8.0,
      "offDutyTime": 1.0,
      "sleeperTime": 0.0
    },
    "weekly": {
      "driveTime": 45.0,
      "onDutyTime": 60.0
    },
    "available": {
      "driving": 4.5,
      "onDuty": 6.0,
      "weekly": 10.0
    },
    "violations": [],
    "warnings": ["Approaching 14-hour on-duty limit"],
    "lastUpdated": "2024-11-14T15:30:00Z"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: Not authenticated
- `NOT_DRIVER`: User is not a driver
- `INACTIVE_DRIVER`: Driver account is inactive
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_ERROR`: Server error

## React Native Integration Example

```typescript
// api/mobile.ts
const API_BASE = 'https://your-domain.com/api/mobile';

export async function loginDriver(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function getLoads(token: string, status?: string) {
  const url = new URL(`${API_BASE}/loads`);
  if (status) url.searchParams.set('status', status);
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function updateLoadStatus(
  token: string,
  loadId: string,
  status: string,
  location?: string
) {
  const response = await fetch(`${API_BASE}/loads/${loadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status, location }),
  });
  return response.json();
}
```

## Next Steps

1. Set up React Native project
2. Implement authentication flow
3. Build load list view
4. Add load detail view
5. Implement status update functionality
6. Add HOS status display
7. Integrate with ELD devices

