# Mobile App Usage Guide

## Overview

The TMS Driver Mobile App allows drivers to:
- View assigned loads
- Report breakdowns
- Communicate with dispatch in real-time
- Check HOS status
- Update load status

## Accessing the Mobile App

### Option 1: Web Browser (Mobile-Optimized)
1. Open your mobile browser
2. Navigate to: `https://your-domain.com/mobile/driver`
3. Log in with your driver credentials

### Option 2: Native Mobile App (React Native)
The mobile app uses the same API endpoints. You can build a native app using:
- React Native
- Flutter
- Or any mobile framework

**Base API URL:** `https://your-domain.com/api/mobile`

## Features

### 1. Dashboard
- View your current status
- See active loads
- Check HOS status
- Quick access to breakdown reporting

### 2. Breakdown Reporting

#### Report a Breakdown
1. Tap "Report Breakdown" on dashboard
2. Fill out the breakdown form:
   - Select your truck
   - Choose breakdown type
   - Set priority (Low, Medium, High, Critical)
   - Enter location (or use GPS)
   - Add description
   - Optionally add photos/videos
3. Tap "Report Breakdown"
4. System automatically creates breakdown case
5. You'll receive a case number (e.g., BD-2024-1234)

#### View Breakdown Cases
1. Tap "View My Breakdown Cases"
2. See all your breakdown cases
3. Tap any case to view details and messages

### 3. Messaging

#### Send Messages About Breakdown
1. Open a breakdown case
2. Scroll to messages section
3. Type your message
4. Tap send button
5. Messages appear in real-time

#### Receive Messages
- Staff can send you messages about your breakdown
- Messages appear in the breakdown case
- You'll see all communications (mobile app, Telegram, SMS, etc.)

### 4. Load Management
- View assigned loads
- Update load status
- See pickup/delivery details
- Check customer information

## API Endpoints for Mobile App

### Authentication
```
POST /api/mobile/auth
Body: { email, password }
```

### Breakdowns
```
POST /api/mobile/breakdowns
Body: {
  truckId: string,
  breakdownType: string,
  priority: string,
  location: string,
  description: string,
  mediaUrls?: string[]
}
```

```
GET /api/mobile/breakdowns
Query: ?status=REPORTED&limit=50&offset=0
```

### Messages
```
GET /api/mobile/breakdowns/[id]/messages
Returns: All messages for breakdown case
```

```
POST /api/mobile/breakdowns/[id]/messages
Body: {
  content: string,
  mediaUrls?: string[]
}
```

### Loads
```
GET /api/mobile/loads
Query: ?status=ASSIGNED&limit=50&offset=0
```

## Communication Channels

The mobile app is one of several communication channels:
- **Mobile App** - Direct messaging in the app
- **Telegram** - Your main Telegram account
- **SMS** - Text messages
- **SIP** - Phone calls (coming soon)

All communications are linked to breakdown cases, so you can see everything in one place.

## Best Practices

1. **Report Breakdowns Immediately**
   - Don't wait - report as soon as issue occurs
   - Include photos when possible
   - Be specific in description

2. **Keep Communication Open**
   - Respond to messages promptly
   - Update status as situation changes
   - Share location updates if you move

3. **Use Photos/Videos**
   - Visual evidence helps dispatch understand the issue
   - Take clear photos of problem areas
   - Include truck number in photos if possible

## Troubleshooting

### Can't Log In
- Verify your email and password
- Contact dispatch if account is locked
- Make sure you're using driver credentials

### Messages Not Appearing
- Refresh the page/app
- Check internet connection
- Messages update every 5 seconds automatically

### Can't Report Breakdown
- Make sure you have a truck assigned
- Check all required fields are filled
- Verify location is entered

## Support

For technical issues or questions:
- Contact your dispatcher
- Use the web dashboard: `/dashboard`
- Check with IT support

---

**Last Updated:** December 2024

