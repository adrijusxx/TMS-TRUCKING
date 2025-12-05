# 🎥 Alogix Inc - Video Demo Script

**Duration**: 5-7 minutes  
**Format**: Screen recording + voiceover  
**Tools**: Loom (recommended), OBS Studio, or ScreenPal

---

## 📋 PRE-RECORDING CHECKLIST

- [ ] Close unnecessary browser tabs
- [ ] Turn off notifications (Windows: Focus Assist, Mac: Do Not Disturb)
- [ ] Clear browser history/cache for clean demo
- [ ] Have test data ready (loads, trucks, drivers)
- [ ] Use a good microphone (USB mic > built-in laptop mic)
- [ ] Test audio levels before recording
- [ ] Hide/blur any sensitive customer data
- [ ] Prepare a glass of water nearby

---

## 🎬 RECORDING SETUP

### Using Loom (Recommended - Free)
1. Install Loom Chrome extension or desktop app
2. Click Loom icon → Screen + Camera or Screen Only
3. Select browser window or entire screen
4. Enable microphone
5. Hit Start Recording
6. Navigate to localhost:3000

### Using OBS Studio (Free - Advanced)
1. Download from obsproject.com
2. Add "Display Capture" or "Window Capture" source
3. Add "Audio Input Capture" for microphone
4. Settings → Output → Recording Quality: High
5. Hit "Start Recording"

### Resolution Settings
- **1920x1080** (Full HD) minimum
- **1440p or 4K** if you want ultra-crisp quality
- Frame rate: 30 FPS (60 FPS if you want butter-smooth)

---

## 🎤 VOICEOVER SCRIPT

### INTRO (30 seconds)
**[Show: Login page or dashboard home]**

> "Hi, I'm [Your Name], founder of Alogix. Today I'm going to show you the first Transportation Management System built specifically for carriers operating multiple Motor Carrier authorities.
>
> In the next 5 minutes, you'll see how Alogix solves the number one problem facing multi-MC carriers: data isolation and operational visibility. Let's dive in."

**[Action: Log in, navigate to dashboard]**

---

### ACT 1: THE MULTI-MC PROBLEM (60 seconds)
**[Show: Dashboard with MC selector dropdown]**

> "Most carriers with multiple MCs use spreadsheets or multiple systems. Let me show you the Alogix approach."

**[Action: Click MC selector in top navbar]**

> "Here's our MC selector. I'm logged in as a company admin, so I can see all three of our Motor Carriers: MC 123456, 789012, and 345678."

**[Action: Switch between MCs slowly, show dashboard updating]**

> "Notice how the entire dashboard updates instantly. Each MC is completely isolated. This is our 'Zero Data Leak Architecture.'"

**[Action: Log out, log in as a dispatcher]**

> "Now, when a dispatcher logs in—they only see ONE MC. Complete isolation. No data leakage. No accidental cross-contamination. This is patent-pending technology."

**Key Points to Emphasize:**
- ✅ Single login, multiple MC contexts
- ✅ Automatic context switching
- ✅ Role-based access (admin vs. dispatcher)

---

### ACT 2: WAR ROOM DASHBOARD (90 seconds)
**[Show: Navigate to /dashboard/war-room]**

> "This is our War Room—your operations command center."

**[Action: Let map load, show markers]**

> "Every green marker is a truck currently moving. Orange means stopped. We're tracking 23 trucks in real time across all our MCs."

**[Action: Click on a truck marker]**

> "When I click a truck, I see real-time data: current speed, location, fuel level, and the load they're hauling."

**[Action: Click on a load marker]**

> "I can also click loads directly. Here's Load LD-2024-001, en route to delivery in Dallas. ETA: 2 hours."

**[Action: Show layer controls]**

> "I can toggle route paths, historical trails, geofences, and even live traffic conditions. Everything updates in real-time via our Samsara integration."

**[Action: Point to stats bar at top]**

> "Up here, I see at-a-glance KPIs: 23 trucks, 18 active loads, 5 trucks available for dispatch. One truck has low fuel—that's flagged automatically."

**[Action: Show clustering by zooming out]**

> "When I zoom out, markers cluster intelligently. Click the cluster, and it zooms in to show individual assets. This keeps the map clean even with hundreds of trucks."

**Key Points:**
- ✅ Real-time GPS tracking
- ✅ Interactive map with clusters
- ✅ Live KPI dashboard
- ✅ Smart alerts (low fuel, maintenance due)

---

### ACT 3: LOAD MANAGEMENT (90 seconds)
**[Show: Navigate to /dashboard/loads]**

> "Let's look at load management. This is where Alogix really shines."

**[Action: Show load list with filters]**

> "Here's our load list. I can filter by MC, status, customer, date range. Let's create a new load."

**[Action: Click 'New Load' button]**

> "Normally, you'd manually enter pickup, delivery, rate. But with Alogix, you can upload a Rate Con PDF."

**[Action: Show Rate Con upload feature - DON'T actually upload unless you have a demo file]**

> "Our AI extracts everything: customer name, pickup address, delivery address, rate, commodity. Takes 10 seconds instead of 5 minutes."

**[Action: Click on an existing load to show detail page]**

> "Once a load is created, we track the full lifecycle: dispatched, en route to pickup, loaded, en route to delivery, delivered."

**[Action: Scroll through load details: customer, rate, documents]**

> "All documents—BOL, POD, invoices—are stored here. Drivers can upload PODs from their mobile app, and it syncs instantly."

**[Action: Show profit margin or settlement section if visible]**

> "For admins, we show profit margins per load. Dispatchers only see their MC's data. Complete financial isolation."

**Key Points:**
- ✅ AI-powered Rate Con extraction
- ✅ Full load lifecycle tracking
- ✅ Document management (BOL, POD)
- ✅ Profit margin visibility (admins only)

---

### ACT 4: SMART DISPATCH (60 seconds)
**[Show: Navigate to /dashboard/dispatch]**

> "Here's our dispatch board. We have a weekly calendar view and a drag-and-drop board."

**[Action: Show weekly schedule view]**

> "This week, Driver John Smith has 3 loads scheduled. Alogix automatically checks: Is his CDL valid? Med card up to date? Truck out of maintenance?"

**[Action: Click on a driver to show their profile/details]**

> "If any of these fail, the system won't let you dispatch. No more DOT violations. No more compliance surprises."

**[Action: Show available trucks/drivers panel]**

> "On the right, I see available assets. Green means ready to go. Red means unavailable—maybe truck is in the shop."

**[Action: Show dispatch calendar with timeline]**

> "The calendar gives us a bird's-eye view of the week. We can see gaps, optimize routes, and prevent overbooking."

**Key Points:**
- ✅ Weekly calendar view
- ✅ Automatic compliance checks
- ✅ Available asset tracking
- ✅ Prevents invalid dispatches

---

### ACT 5: FLEET MANAGEMENT (45 seconds)
**[Show: Navigate to /dashboard/fleet/trucks or fleet board]**

> "Fleet management is critical for multi-MC operations."

**[Action: Show truck list with status badges]**

> "Here's our fleet: 35 trucks across 3 MCs. Each truck shows status: active, maintenance, out of service."

**[Action: Click on a truck]**

> "Truck TR-101 is due for preventive maintenance in 500 miles. We get alerts 30 days before any inspection expires."

**[Action: Show maintenance history or inspection records]**

> "All maintenance history is logged. DOT inspections, oil changes, tire replacements. Everything in one place, organized by MC."

**Key Points:**
- ✅ Fleet status overview
- ✅ Maintenance tracking
- ✅ DOT inspection alerts
- ✅ Per-MC organization

---

### ACT 6: SAFETY & COMPLIANCE (45 seconds)
**[Show: Navigate to /dashboard/safety or driver documents]**

> "Compliance is critical. Alogix tracks:

> - Driver CDLs and medical cards with expiration alerts
> - Truck inspections and maintenance schedules  
> - Safety incidents and accident reports
> - Hours of Service compliance via ELD integration"

**[Action: Show document management or alerts dashboard]**

> "You get alerts 30 days before any document expires. No more missed renewals. No more CSA score hits."

**[Action: Show a driver profile with documents]**

> "Driver Sarah Johnson's med card expires in 15 days. We've sent her an automated reminder, and dispatch can't assign her new loads until it's renewed."

**Key Points:**
- ✅ Document expiration tracking
- ✅ Automated reminders
- ✅ Dispatch lockout for expired docs
- ✅ Safety incident tracking

---

### CLOSING (30 seconds)
**[Show: Return to War Room or Dashboard home]**

> "So that's Alogix: One system. Multiple MCs. Complete data isolation.
>
> We're replacing spreadsheets, outdated TMS systems, and manual processes with modern, AI-powered automation.
>
> If you're running multiple Motor Carriers and struggling with visibility, compliance, or data silos, we'd love to show you a personalized demo.
>
> Visit alogix.com to schedule a call. Thanks for watching."

**[Action: Smile at camera (if using webcam) and wave]**

---

## 🎬 POST-PRODUCTION CHECKLIST

### Editing (Optional but Recommended)
- [ ] Trim dead air at start and end
- [ ] Add intro slide with Alogix logo (5 seconds)
- [ ] Add outro slide with contact info (5 seconds)
- [ ] Blur any sensitive customer data
- [ ] Add background music (optional, keep volume low)
- [ ] Speed up slow parts (1.25x speed) if needed

### Tools for Editing:
- **Loom**: Built-in trimming and blurring
- **DaVinci Resolve**: Free, professional-grade
- **Camtasia**: Paid, very user-friendly
- **ScreenFlow** (Mac only): Excellent for screen recordings

### Adding Captions
- **YouTube Auto-Captions**: Upload to YouTube, enable auto-captions
- **Loom**: Built-in captions
- **Rev.com**: $1.50/minute for human transcription

---

## 📤 EXPORT & DISTRIBUTION

### Export Settings:
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 minimum
- **Frame Rate**: 30 FPS
- **Bitrate**: 10-15 Mbps for high quality

### Upload Destinations:
1. **YouTube (Unlisted)**
   - Professional hosting
   - Good analytics
   - Easy to embed
   - Free

2. **Vimeo (Private)**
   - Ad-free playback
   - Better player controls
   - Professional feel
   - Free tier available

3. **Loom**
   - Instant sharing links
   - Built-in analytics
   - No downloads needed
   - Free tier: 25 videos

### How to Use the Video:

✅ **Email to investors**: "Watch our 5-min demo"  
✅ **Website**: Embed on homepage  
✅ **LinkedIn**: Share as a post  
✅ **Pitch meetings**: Open with the video, then go into slides  
✅ **Sales outreach**: Send to prospects  

---

## 🎯 PRO TIPS

### Voice & Pacing:
- Speak 10% slower than normal conversation
- Pause for 1-2 seconds after each major point
- Vary your tone to maintain engagement
- Smile while recording—it comes through in your voice

### Demo Data:
- Use realistic company names (avoid "Test Co.")
- Use real-looking addresses (actual cities)
- Show 10-20 loads/trucks for credibility
- Vary statuses (don't show all "Delivered")

### Common Mistakes to Avoid:
❌ Don't apologize or say "um/uh" (edit these out)  
❌ Don't rush through features  
❌ Don't show unpolished UI or errors  
❌ Don't use Lorem Ipsum text  
❌ Don't make it longer than 7 minutes  

### Recording Multiple Takes:
- Record 2-3 full takes
- Choose the best one
- Splice together sections if needed
- It's OK to re-record specific sections

---

## 📊 METRICS TO TRACK

Once your video is live, track:
- **View count**: How many people watched?
- **Average watch time**: Are they watching all 5 minutes?
- **Drop-off points**: Where do people stop watching?
- **Click-through rate**: Do they click "Schedule Demo"?

**Iterate Based on Data:**
- If people drop off after 2 minutes → Shorten intro
- If they skip the tech stack → Remove technical details
- If they watch all the way → You nailed it!

---

## 🎬 ALTERNATIVE: TALKING HEAD + SCREEN SHARE

For a more personal touch:

**Setup:**
- Small webcam circle in bottom-right corner
- Screen recording takes up 80% of frame
- Use good lighting (ring light or window light)
- Look at camera occasionally, not just screen

**Benefit**: Builds trust, shows there's a real person behind the product

---

## 📝 SCRIPT VARIATIONS

### 30-Second Version (For Social Media):
> "Alogix is the first TMS built for multi-MC carriers. Manage all your Motor Carriers from one dashboard with zero data leakage. Real-time tracking, AI document processing, and smart dispatch. Schedule a demo at alogix.com."

### 2-Minute Version (For Emails):
- Skip Act 5 & 6
- Focus on War Room + Load Management only
- End with strong CTA

### 10-Minute Version (For Deep Dives):
- Add: Customer portal demo
- Add: Mobile app walkthrough
- Add: Integration setup (Samsara, QuickBooks)
- Add: Report generation

---

**Good luck with your video! Remember: Done is better than perfect. Record it, get feedback, iterate.**


