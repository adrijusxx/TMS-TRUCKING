# 📸 Screenshot Capture Guide for Alogix Pitch Deck

This guide will help you capture professional, high-quality screenshots of your TMS for the pitch deck.

---

## 🎯 PRIORITY SCREENSHOTS NEEDED

### ✅ Must-Have (5 screenshots):
1. **War Room Dashboard** - Hero shot showing map with trucks/loads
2. **Load List View** - Shows load management capabilities
3. **Dispatch Board** - Weekly schedule or drag-and-drop board
4. **MC Selector** - Shows multi-MC capability (UNIQUE SELLING POINT)
5. **Fleet Board** - Overview of truck statuses

### ⭐ Nice-to-Have (5 screenshots):
6. **Load Detail Page** - Shows Rate Con, documents, tracking
7. **Driver Profile** - Shows document management, compliance
8. **Settlement Report** - Shows financial tracking
9. **Mobile View** - Shows responsive design
10. **Customer Portal** - Shows shipment tracking for customers

---

## 🛠️ PREPARATION CHECKLIST

### Before You Start:
- [ ] Development server running (`npm run dev`)
- [ ] Database seeded with demo data
- [ ] Browser at 100% zoom (not zoomed in/out)
- [ ] Browser window fullscreen or maximized
- [ ] Close unnecessary browser tabs
- [ ] Hide bookmarks bar (Ctrl+Shift+B)
- [ ] Clear notifications
- [ ] Use Incognito/Private mode (clean browser state)

### Demo Data Checklist:
- [ ] At least 10-15 loads in various statuses
- [ ] At least 5 trucks with GPS locations
- [ ] At least 3 drivers with documents
- [ ] 2-3 MC numbers visible
- [ ] Recent activity in the system

---

## 📐 SCREENSHOT SETTINGS

### Resolution:
- **Optimal**: 1920x1080 (Full HD)
- **Minimum**: 1600x900
- **For retina displays**: 2560x1440 or 3840x2160

### Browser Setup:
1. Chrome or Edge (best for screenshots)
2. Press **F12** to open DevTools
3. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
4. Set device to "Responsive"
5. Set dimensions: 1920 x 1080
6. Click "⋮" menu → "Capture screenshot"

### Alternative Methods:
- **Windows**: Win + Shift + S (Snipping Tool)
- **Mac**: Cmd + Shift + 4 (drag to select area)
- **Chrome Extension**: "Awesome Screenshot" or "Fireshot"

---

## 📸 SCREENSHOT-BY-SCREENSHOT GUIDE

### Screenshot 1: WAR ROOM DASHBOARD ⭐ (HERO SHOT)

**URL**: `http://localhost:3000/dashboard/war-room`

**What to Show**:
- Map with 5-10 truck/load markers visible
- Different marker colors (green=moving, orange=stopped)
- Stats bar at top showing truck count, load count
- Layer controls visible on the side
- Sidebar navigation visible (shows it's part of larger app)

**Preparation**:
1. Navigate to War Room
2. Zoom map to show multiple markers (don't show just 1-2)
3. If no trucks visible, add test GPS data or use Samsara simulator
4. Make sure markers have different statuses

**Composition**:
- Full browser window
- Map should take up 70% of screen
- Navigation sidebar visible on left
- Top header visible with MC selector

**Capture Method**:
```
F12 → Device Toolbar → 1920x1080 → Capture Full Size Screenshot
```

**Save As**: `screenshots/war-room-dashboard.png`

**Post-Processing**:
- Blur any real customer names if visible
- Add subtle drop shadow (optional)
- Crop to remove extra whitespace

---

### Screenshot 2: MC SELECTOR (COMPETITIVE ADVANTAGE) 🎯

**URL**: Any page (usually dashboard home)

**What to Show**:
- MC selector dropdown **OPEN** showing multiple MCs
- Clear labels: MC #123456, MC #789012, MC #345678
- "All MCs" option for admins visible

**Preparation**:
1. Log in as admin
2. Click MC selector in top navbar
3. Take screenshot with dropdown OPEN

**Composition**:
- Focus on the dropdown (can be partial screen)
- Show at least 3 MC numbers
- Show user profile/role if visible
- Highlight with arrow or annotation (do this in post-processing)

**Capture Method**:
```
Click MC Selector → Win+Shift+S → Drag to select dropdown area
```

**Save As**: `screenshots/mc-selector-dropdown.png`

**Post-Processing**:
- Add arrow pointing to dropdown
- Add text annotation: "Switch between MCs instantly"
- Increase contrast for clarity

---

### Screenshot 3: LOAD LIST VIEW

**URL**: `http://localhost:3000/dashboard/loads`

**What to Show**:
- 10-15 loads in list view
- Variety of statuses (Dispatched, En Route, Delivered)
- Filters visible (MC, Status, Date Range)
- Search bar visible
- Action buttons (New Load, Export) visible

**Preparation**:
1. Navigate to Loads page
2. Ensure loads have different statuses
3. Show filters applied (optional: filter by MC)
4. Sort by date descending

**Composition**:
- Full page view
- Table should show: Load #, Customer, Status, Pickup, Delivery, Rate
- Sidebar navigation visible
- Top filters/search visible

**Capture Method**:
```
F12 → Device Toolbar → 1920x1080 → Capture Screenshot
```

**Save As**: `screenshots/load-list-view.png`

**Post-Processing**:
- Blur customer names if needed
- Highlight status badges with subtle glow (optional)

---

### Screenshot 4: DISPATCH BOARD

**URL**: `http://localhost:3000/dashboard/dispatch`

**What to Show**:
- Weekly calendar view OR drag-and-drop board
- 5-7 drivers with loads assigned
- Different load statuses on calendar
- Available drivers/trucks panel visible

**Preparation**:
1. Navigate to Dispatch page
2. Switch to "Weekly Schedule" tab
3. Ensure data for current week visible
4. Show at least 3 drivers with assigned loads

**Composition**:
- Full page view
- Calendar should show Mon-Sun
- Driver names on left, timeline on right
- Color-coded load statuses

**Capture Method**:
```
F12 → Device Toolbar → 1920x1080 → Capture Screenshot
```

**Save As**: `screenshots/dispatch-board.png`

**Post-Processing**:
- Blur driver names if needed
- Add caption: "Drag-and-drop dispatch with compliance checks"

---

### Screenshot 5: FLEET BOARD

**URL**: `http://localhost:3000/dashboard/fleet` or `/dashboard/fleet/trucks`

**What to Show**:
- List or grid of trucks
- Status badges (Active, Maintenance, Out of Service)
- MC assignment visible per truck
- Maintenance alerts or low fuel warnings

**Preparation**:
1. Navigate to Fleet page
2. Ensure trucks have different statuses
3. Show at least 10-15 trucks
4. Include 1-2 trucks with alerts

**Composition**:
- Full page view
- Show truck numbers, status, current driver, MC#
- Sidebar navigation visible
- Filters/search visible

**Capture Method**:
```
F12 → Device Toolbar → 1920x1080 → Capture Screenshot
```

**Save As**: `screenshots/fleet-board.png`

**Post-Processing**:
- Highlight alert badges (optional)
- Add arrow pointing to MC assignment

---

### Screenshot 6: LOAD DETAIL PAGE (Optional)

**URL**: `http://localhost:3000/dashboard/loads/[load-id]`

**What to Show**:
- Load header with status
- Customer info, pickup/delivery locations
- Rate Confirmation details
- Document section (BOL, POD)
- Map showing route
- Timeline/milestones

**Preparation**:
1. Click on a load from load list
2. Ensure load has documents attached
3. Show "En Route to Delivery" status (active load)

**Capture Method**:
```
Scroll to show full page OR capture top section only
```

**Save As**: `screenshots/load-detail-page.png`

---

### Screenshot 7: DRIVER PROFILE (Optional)

**URL**: `http://localhost:3000/dashboard/hr?tab=drivers` → Click driver

**What to Show**:
- Driver name, photo (if available)
- CDL expiration date
- Med Card expiration date
- Document status (Valid, Expiring, Expired)
- Active loads assigned

**Preparation**:
1. Navigate to Drivers
2. Click on a driver
3. Show driver with valid documents

**Save As**: `screenshots/driver-profile.png`

---

### Screenshot 8: SETTLEMENT REPORT (Optional)

**URL**: `http://localhost:3000/dashboard/settlements`

**What to Show**:
- List of settlements
- Driver names, pay amounts
- Status (Pending, Paid, Approved)
- Date range filter

**Preparation**:
1. Navigate to Settlements
2. Show current week settlements
3. Include 5-10 settlement records

**Save As**: `screenshots/settlement-report.png`

**Post-Processing**:
- Blur actual dollar amounts if sensitive
- Blur driver names

---

### Screenshot 9: MOBILE VIEW (Optional)

**URL**: Any core page (War Room, Loads, Dispatch)

**What to Show**:
- Responsive mobile design
- Touch-friendly buttons
- Collapsed navigation menu
- Key features accessible

**Preparation**:
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro or Pixel 5
4. Navigate to War Room or Loads

**Capture Method**:
```
F12 → Device Toolbar → Select Mobile Device → Capture Screenshot
```

**Save As**: `screenshots/mobile-view.png`

**Post-Processing**:
- Add phone frame (optional): Use mockup tools like Mockuphone.com
- Show 2-3 screens side-by-side

---

### Screenshot 10: CUSTOMER PORTAL (Optional)

**URL**: `http://localhost:3000/tracking/[load-number]`

**What to Show**:
- Public load tracking page
- Map showing truck location
- Pickup/delivery info
- ETA and milestones
- Contact info

**Preparation**:
1. Find a load number (e.g., LD-2024-001)
2. Open in Incognito mode (shows customer view)
3. Navigate to tracking page

**Save As**: `screenshots/customer-portal.png`

---

## 🎨 POST-PROCESSING TIPS

### Tools to Use:
- **Snagit** (Paid): Best for annotations, arrows, highlights
- **Photoshop** (Paid): Professional editing
- **GIMP** (Free): Photoshop alternative
- **Paint.NET** (Free, Windows): Simple and fast
- **Preview** (Mac): Built-in editing
- **Canva** (Free): Online editor with frames

### Enhancements:
1. **Blur Sensitive Data**:
   - Customer names
   - Phone numbers
   - Actual addresses
   - Dollar amounts (if needed)

2. **Add Annotations**:
   - Arrows pointing to key features
   - Text callouts: "Real-time GPS"
   - Highlight boxes around important elements

3. **Add Drop Shadow**:
   - Subtle shadow makes screenshots pop
   - Settings: 10px blur, 50% opacity, black

4. **Crop & Resize**:
   - Remove extra whitespace
   - Maintain 16:9 aspect ratio
   - Resize to 1920x1080 if needed

5. **Optimize File Size**:
   - Use TinyPNG.com to compress
   - Target: 200-500 KB per screenshot
   - Format: PNG for UI, JPG for photos

---

## 🚀 QUICK CAPTURE WORKFLOW

### Method 1: Chrome DevTools (Highest Quality)
```bash
1. Press F12
2. Ctrl+Shift+M (toggle device toolbar)
3. Set dimensions: 1920x1080
4. Ctrl+Shift+P → type "Capture screenshot"
5. Select "Capture full size screenshot"
6. Rename and move to screenshots/ folder
```

### Method 2: Windows Snipping Tool (Fastest)
```bash
1. Win + Shift + S
2. Drag to select area
3. Click notification to open Snip & Sketch
4. Save to screenshots/ folder
```

### Method 3: Browser Extension (Most Convenient)
```bash
1. Install "Awesome Screenshot" extension
2. Click extension icon
3. Select "Capture entire page" or "Capture visible part"
4. Edit and download
```

---

## ✅ QUALITY CHECKLIST

Before using a screenshot in your deck, verify:

- [ ] Resolution at least 1920x1080
- [ ] No sensitive customer data visible
- [ ] UI elements clearly visible (not blurry)
- [ ] No Lorem Ipsum text
- [ ] Realistic demo data (not "Test Test")
- [ ] Consistent styling across screenshots
- [ ] No browser dev tools visible
- [ ] No personal bookmarks visible
- [ ] File size under 1 MB (ideally 200-500 KB)
- [ ] Filename descriptive and lowercase with hyphens

---

## 📂 FOLDER STRUCTURE

After capturing all screenshots:

```
pitch-materials/
└── screenshots/
    ├── war-room-dashboard.png          (HERO SHOT)
    ├── mc-selector-dropdown.png        (COMPETITIVE ADVANTAGE)
    ├── load-list-view.png
    ├── dispatch-board.png
    ├── fleet-board.png
    ├── load-detail-page.png            (Optional)
    ├── driver-profile.png              (Optional)
    ├── settlement-report.png           (Optional)
    ├── mobile-view.png                 (Optional)
    └── customer-portal.png             (Optional)
```

---

## 🎬 AUTOMATED SCREENSHOT SCRIPT (Advanced)

If you want to automate screenshot capture, create this script:

**File**: `scripts/take-screenshots.js`

```javascript
const puppeteer = require('puppeteer');

async function captureScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Login first
  await page.goto('http://localhost:3000/auth/signin');
  // Add login steps here

  // War Room
  await page.goto('http://localhost:3000/dashboard/war-room');
  await page.waitForSelector('.map-container');
  await page.screenshot({ path: 'pitch-materials/screenshots/war-room-dashboard.png' });

  // Loads
  await page.goto('http://localhost:3000/dashboard/loads');
  await page.waitForSelector('table');
  await page.screenshot({ path: 'pitch-materials/screenshots/load-list-view.png' });

  // Add more pages...

  await browser.close();
}

captureScreenshots();
```

Run with: `node scripts/take-screenshots.js`

---

## 📌 FINAL TIPS

### Do:
✅ Take screenshots at full resolution  
✅ Use realistic demo data  
✅ Show variety of statuses and scenarios  
✅ Capture during daytime (better color accuracy)  
✅ Take multiple shots and choose the best  

### Don't:
❌ Show error messages or loading states  
❌ Include personal info or real customer data  
❌ Use cluttered or messy test data  
❌ Screenshot in dark mode (unless that's your brand)  
❌ Show empty states or "No data" messages  

---

**Now go capture some amazing screenshots! Your deck will thank you. 📸🚀**




