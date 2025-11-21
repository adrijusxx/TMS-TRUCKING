# Communication Integration Hub - Detailed Documentation

## Overview

The Communication Integration Hub unifies all communication channels (phone, SMS, MMS, Telegram, email) into a single system that automatically creates breakdown cases and maintains complete communication logs.

## Core Principles

1. **Unified Inbox:** All communications in one place
2. **Auto-Case Creation:** Smart system creates cases automatically
3. **Channel Agnostic:** Drivers can use any channel they prefer
4. **Complete Audit Trail:** Every interaction logged
5. **Real-Time:** Instant routing and notifications

---

## 📱 Communication Channels

### Supported Channels

1. **SIP Provider** (Phone calls)
   - Inbound calls
   - Outbound calls
   - Call recording
   - Voicemail transcription

2. **SMS/MMS** (Text messages)
   - Two-way SMS
   - Photo/video via MMS
   - Delivery confirmations

3. **Telegram** (Messaging)
   - Telegram bot for drivers
   - Rich media support
   - Location sharing
   - Group channels

4. **Email**
   - Inbound email parsing
   - Outbound email templates

5. **Voicemail**
   - Transcription to text
   - Urgent keyword detection

---

## Unified Inbox

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Communication Hub                                        │
│  [Unread: 5] [Filter: All Channels]                      │
├──────────────────┬───────────────────────────────────────┤
│  Conversations   │  Message Thread                      │
│  (Left Sidebar)  │  (Main Area)                         │
│                  │                                       │
│  🔴 Mike Johnson  │  ┌─────────────────────────────────┐ │
│     Truck #3219   │  │ Driver: Mike Johnson            │ │
│     [2 unread]   │  │ Truck: #3219                     │ │
│                  │  │ Case: BD-2024-1234              │ │
│  🟡 Sarah M.     │  │ Status: DISPATCHED              │ │
│     Truck #0170  │  └─────────────────────────────────┘ │
│     [1 unread]   │                                       │
│                  │  ┌─────────────────────────────────┐ │
│  ⚪ Jose R.      │  │ 2:15 PM - Inbound Call (3m 42s) │ │
│     Truck #1601  │  │ "Won't start, I'm at..."        │ │
│                  │  └─────────────────────────────────┘ │
│  ⚪ All Resolved │                                       │
│                  │  ┌─────────────────────────────────┐ │
│                  │  │ 2:18 PM - SMS Sent              │ │
│                  │  │ "Creating your case now"        │ │
│                  │  └─────────────────────────────────┘ │
│                  │                                       │
│                  │  ┌─────────────────────────────────┐ │
│                  │  │ 2:20 PM - Telegram Message      │ │
│                  │  │ [Photo: engine_bay.jpg]         │ │
│                  │  └─────────────────────────────────┘ │
│                  │                                       │
│                  │  [Quick Reply Templates ▼]          │
│                  │  [Type message...] [Send]           │
└──────────────────┴───────────────────────────────────────┘
```

### Features

#### Conversation List
- Sorted by last message time
- Unread badges
- Status indicators (🔴 Critical, 🟡 High, ⚪ Normal)
- Search conversations
- Filter by channel, status, driver

#### Message Thread
- Chronological timeline
- Channel indicators (📞 Call, 💬 SMS, 📱 Telegram, 📧 Email)
- Media attachments inline
- Quick reply templates
- Type custom message

#### Quick Actions
- Call driver
- Text driver
- Telegram message
- Email driver
- View breakdown case
- Assign to staff

---

## Auto-Case Creation

### How It Works

```
Driver contacts via any channel
    ↓
TMS receives communication
    ↓
Identifies driver by phone/Telegram ID
    ↓
Checks for active breakdown case
    ↓
If no active case:
  - Creates new breakdown case
  - Pre-fills driver info
  - Pre-fills truck assignment
  - Pre-fills GPS location (if available)
  - Pre-fills current load info
  - Assigns case number (BD-YYYY-XXXX)
  - Routes to on-call staff
    ↓
If active case exists:
  - Attaches to existing case
  - Updates case timeline
    ↓
All communications logged to case
```

### Driver Identification

#### By Phone Number
- Lookup driver by registered phone number
- Match to driver profile
- Show driver name, truck, location

#### By Telegram ID
- Driver registers Telegram account with employee ID
- Link Telegram ID to driver profile
- Auto-identify on future messages

#### By Email
- Match email to driver profile
- Fallback to manual assignment if unknown

### Case Number Assignment
- Format: `BD-YYYY-XXXX`
- Auto-incrementing
- Unique per company
- Sent to driver immediately

### Pre-Filled Information
- **Driver:** Name, contact info, photo
- **Truck:** Current assignment, make/model, VIN
- **Location:** GPS coordinates if available
- **Load:** Current dispatch, customer, appointment time
- **Timestamp:** Time of first contact

---

## SIP Provider Integration

### Inbound Call Handling

#### Caller ID Enhancement
- Show driver name (not just phone number)
- Show truck number
- Show current location
- Show active load info
- Show previous breakdown history

#### Call Screen Popup
```
┌─────────────────────────────────────┐
│  Incoming Call                      │
├─────────────────────────────────────┤
│  📞 Mike Johnson                     │
│  Truck #3219                        │
│  📍 I-80, MM 145, Iowa              │
│  Load: ABC-1234 (Due: 5:00 PM)     │
│                                     │
│  Previous Breakdowns: 2 this month  │
│                                     │
│  [Answer] [Decline] [Route To...]   │
└─────────────────────────────────────┘
```

#### Call Features
- Click-to-answer
- Route to available team member
- Call recording automatically saved
- Call duration and timestamp logged
- Post-call notes screen

#### Post-Call Actions
- Quick tags: Resolved, Needs Dispatch, Escalate
- Create breakdown case if needed
- Update existing case
- Schedule follow-up

### Outbound Calling

#### Click-to-Call
- Click driver's name anywhere in system
- Auto-selects best number (mobile vs. home)
- Initiates call through SIP
- Call notes auto-save

#### Conference Calling
- Add vendors to call
- Add managers to call
- Transfer with context

#### Call Transfer
- Transfer includes case notes
- Transfer includes driver context
- Seamless handoff

---

## SMS/MMS Features

### Two-Way SMS
- Send SMS directly from TMS interface
- Receive SMS replies
- Threaded conversation view
- Delivery confirmations

### SMS Templates
Common templates for quick replies:
- "Tech dispatched, ETA 45 minutes"
- "Need more info - please send photos of [issue]"
- "All set - you're cleared to continue"
- "Case #BD-2024-1234 created. We'll contact you shortly."
- "Tech arrived on site"
- "Repair complete, safe travels!"

### MMS Features
- Receive driver photos
- Photos auto-attach to breakdown case
- Send photos to drivers (maps, instructions)
- Video support

### Mass SMS
- Fleet-wide alerts
- Weather warnings
- Road closure notices
- Urgent announcements

---

## Telegram Integration

### Bot Setup

#### Driver Registration Flow
1. Driver adds `@YourCompanyRoadServiceBot`
2. Bot asks for employee ID or truck number
3. System verifies and links Telegram account
4. Driver gets confirmation: "You're registered! Message us anytime for breakdown help."

#### Registration Message
```
Driver: /start
Bot: Welcome! Please enter your employee ID or truck number.
Driver: 3219
Bot: ✅ Verified! You're registered as Mike Johnson, Truck #3219. 
     Message us anytime for breakdown help.
```

### Instant Breakdown Reporting

#### Natural Language Parsing
Driver sends: `"Truck 3219 - engine won't start, I'm at mile marker 145 on I-80 in Iowa"`

System extracts:
- Truck number: 3219
- Problem: engine won't start
- Location: I-80, MM 145, Iowa

#### Auto-Response
```
Bot: Case #BD-2024-1234 created. 
     John from our team will contact you in 5 minutes. 
     Are you in a safe location?
```

### Photo/Video Sharing
- Driver sends photos directly
- Photos auto-attach to breakdown case
- Engine codes, tire damage, accident scenes
- Videos of mechanical issues
- Location sharing via pin drop

### Real-Time Status Updates
System sends automatic updates:
- "Tech dispatched - Joe's Towing, ETA 30 mins, phone: 555-1234"
- "Parts ordered, should arrive by 2pm"
- "Repair complete, you're cleared to roll. Safe travels!"

### Quick Commands
- `/breakdown` - Starts new breakdown report wizard
- `/status` - Gets update on active case
- `/location` - Sends current GPS location
- `/help` - Emergency contact numbers
- `/eta` - Asks when help will arrive

### Group Channels

#### Driver Channel
- Fleet-wide announcements
- Weather alerts
- Road closures
- Policy updates

#### Dispatch Team Channel
- Internal coordination
- Case assignments
- Status updates

#### Vendor Channel
- Quick coordination
- Dispatch requests
- Status updates

---

## Voicemail Management

### Transcription
- Voicemail-to-text automatically
- Searchable voicemail content
- Playback in system

### Urgent Keyword Detection
Keywords trigger high-priority alerts:
- "Accident" → Create high-priority case, alert manager
- "Injured" → Trigger emergency protocol, suggest 911
- "Fire" → Immediate escalation, safety instructions
- "Police" → Flag for incident report
- "Towed" → Send impound procedure guide

### Return Call
- One-click return call
- Voicemail context included
- Link to breakdown case

---

## Smart Features

### Auto-Response

#### After-Hours Auto-Response
If driver contacts outside business hours:
```
Instant auto-reply: "We received your message. 
On-call tech will respond within 15 minutes. 
If emergency, call: 1-800-XXX-XXXX"
```
- Alert on-call staff member
- Escalate if no response in 15 minutes

### Keyword Detection
System monitors for urgent keywords:
- Auto-escalate critical issues
- Suggest appropriate actions
- Trigger emergency protocols

### Smart Replies
AI suggests responses based on message content:
- Driver: "How much longer?" → "Tech is 10 minutes away"
- Driver: "What hotel?" → "Booking hotel now, will text address shortly"

### Translation
- Auto-translate for Spanish-speaking drivers
- Multi-language support
- Driver preference settings

---

## Communication Timeline

### Timeline View
Every breakdown case shows complete communication history:

```
11/21/24 2:15 PM - 📞 Inbound call from Driver Mike (3m 42s)
                   "Won't start, I'm at mile marker 145"
                   
11/21/24 2:18 PM - 💬 SMS sent: "Creating your case now"
                   
11/21/24 2:20 PM - 📱 Telegram message from Mike: [Photo attached]
                   
11/21/24 2:22 PM - 📞 Outbound call to Joe's Towing (1m 15s)
                   "Need tow for Truck 3219 at I-80 MM 145"
                   
11/21/24 2:25 PM - 💬 SMS sent: "Tech ETA 45 minutes"
                   
11/21/24 3:10 PM - 📱 Telegram from Mike: "Tech arrived"
                   
11/21/24 4:30 PM - 📞 Inbound call from Mike (45s) - "All fixed, back on road"
                   
11/21/24 4:31 PM - 💬 SMS sent: "Great! Drive safe!"
```

### Timeline Features
- Chronological order
- Channel indicators
- Duration for calls
- Media attachments inline
- Search timeline
- Export timeline

---

## Analytics & Reporting

### Communication Metrics
- Average response time (first contact to first reply)
- Channel preference (what drivers use most)
- After-hours contact frequency
- Missed communications
- Response time by team member
- Communication volume trends

### Driver Preferences
- Track each driver's preferred contact method
- Auto-route communications accordingly
- Update preferences over time

---

## Integration Architecture

### SIP Provider Integration
- Use provider's API (Twilio, Vonage, etc.)
- Webhook for inbound calls/SMS → creates case in TMS
- Outbound API calls for initiating calls/texts
- CDR (Call Detail Records) sync for billing

### Telegram Bot API
- Use Telegram Bot API for two-way messaging
- Webhook for incoming messages → parse and create cases
- Bot sends outbound updates via API
- Media API for photo/video handling
- Location API for GPS sharing

### Data Flow
```
Driver contacts via any channel
    ↓
TMS receives communication
    ↓
Identifies driver by phone/Telegram ID
    ↓
Creates or updates breakdown case
    ↓
Routes to on-call staff
    ↓
Staff responds via any channel
    ↓
All communications logged to case
    ↓
Case resolved
    ↓
Auto-follow-up message sent
```

---

## Database Schema (Proposed)

```prisma
model Communication {
  id            String   @id @default(cuid())
  breakdownId   String?
  breakdown     Breakdown? @relation(fields: [breakdownId], references: [id])
  driverId      String?
  driver        Driver?  @relation(fields: [driverId], references: [id])
  
  channel       CommunicationChannel
  direction     CommunicationDirection // INBOUND, OUTBOUND
  type          CommunicationType // CALL, SMS, MMS, TELEGRAM, EMAIL, VOICEMAIL
  
  fromNumber    String?
  toNumber      String?
  telegramId    String?
  emailAddress  String?
  
  content       String?  // Text content or transcription
  duration      Int?     // For calls, in seconds
  recordingUrl  String?  // For calls
  
  mediaUrls     String[] // For MMS/Telegram photos/videos
  location      Json?    // GPS coordinates if shared
  
  status        CommunicationStatus // SENT, DELIVERED, READ, FAILED
  errorMessage  String?
  
  autoCreated   Boolean  @default(false) // Auto-created case?
  caseNumber    String?  // If auto-created
  
  createdAt     DateTime @default(now())
}

enum CommunicationChannel {
  SIP
  SMS
  TELEGRAM
  EMAIL
}

enum CommunicationDirection {
  INBOUND
  OUTBOUND
}

enum CommunicationType {
  CALL
  SMS
  MMS
  TELEGRAM
  EMAIL
  VOICEMAIL
}

enum CommunicationStatus {
  SENT
  DELIVERED
  READ
  FAILED
}

model DriverTelegram {
  id          String   @id @default(cuid())
  driverId    String   @unique
  driver      Driver   @relation(fields: [driverId], references: [id])
  telegramId  String   @unique
  username    String?
  registeredAt DateTime @default(now())
  isActive    Boolean  @default(true)
}
```

---

## API Endpoints (Proposed)

### Communications
- `GET /api/fleet/communications` - List communications
- `GET /api/fleet/communications/[id]` - Communication details
- `GET /api/fleet/breakdowns/[id]/communications` - Case communications
- `POST /api/fleet/communications/call` - Initiate call
- `POST /api/fleet/communications/sms` - Send SMS
- `POST /api/fleet/communications/telegram` - Send Telegram message

### Webhooks (Inbound)
- `POST /api/webhooks/sip/inbound` - Inbound call/SMS
- `POST /api/webhooks/telegram` - Telegram message
- `POST /api/webhooks/email` - Inbound email

### Driver Registration
- `POST /api/fleet/telegram/register` - Register Telegram account
- `GET /api/fleet/telegram/verify` - Verify registration

---

## UI Components Needed

1. **UnifiedInbox** - Main communication hub
2. **ConversationList** - Left sidebar
3. **MessageThread** - Main message area
4. **QuickReplyTemplates** - Template selector
5. **CallScreen** - Inbound call popup
6. **SMSComposer** - SMS message composer
7. **TelegramBotSetup** - Bot registration flow
8. **CommunicationTimeline** - Timeline view
9. **ChannelSelector** - Select communication channel
10. **AutoResponseSettings** - Configure auto-responses

---

**Last Updated:** December 2024
**Status:** Planning Phase

