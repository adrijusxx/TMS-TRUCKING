# 📊 Alogix Inc - PowerPoint Template

This document contains all slide content formatted for easy import into PowerPoint/Google Slides.

---

## 🎨 DESIGN GUIDELINES

### Color Palette:
- **Primary Purple**: #667eea
- **Secondary Purple**: #764ba2
- **Success Green**: #38b2ac
- **Warning Orange**: #f59e0b
- **Error Red**: #e53e3e
- **Text Dark**: #1a202c
- **Text Medium**: #4a5568
- **Background**: #ffffff

### Fonts:
- **Headings**: Inter, San Francisco, Segoe UI (Bold, 600-800 weight)
- **Body**: Inter, San Francisco, Segoe UI (Regular, 400 weight)
- **Code/Numbers**: SF Mono, Consolas, Courier New

### Layout:
- **Title Slide**: Centered text, gradient background
- **Content Slides**: Left-aligned title, content below
- **Data Slides**: Tables, charts with clear labels
- **Image Slides**: Full-bleed or 70% width with caption

---

## SLIDE 1: COVER

### Background:
Gradient (Purple #667eea to #764ba2)

### Content:
```
ALOGIX INC

Modern Transportation Management
for Multi-Carrier Operations

Revolutionizing how trucking companies manage their fleet,
dispatch, and operations across multiple Motor Carrier authorities
```

**Footer**: Your Name | contact@alogix.com | December 2024

---

## SLIDE 2: THE PROBLEM

### Title:
The Problem

### Subtitle:
Trucking Companies Face Critical Operational Challenges

### Content:
📊 **Data Silos**  
Managing multiple MC numbers requires separate systems or manual tracking

💰 **Revenue Leakage**  
Poor visibility into settlements, driver pay, and profit margins

📱 **Outdated Tools**  
Legacy TMS systems built on 20-year-old technology

🔒 **Security Risks**  
No granular access control leads to data leaks between MC entities

⏱️ **Inefficiency**  
Manual dispatch, document management, and compliance tracking

### Footer (Red text, bold):
💸 Cost: Industry loses $50B+ annually to inefficiency and poor visibility

---

## SLIDE 3: OUR SOLUTION

### Title:
Our Solution

### Subtitle:
The First True Multi-MC Transportation Management System

### Content (Checkmark bullets):
✅ Manage unlimited Motor Carrier numbers from **ONE** unified dashboard

✅ Enforce zero data leakage between MC entities with role-based access

✅ Real-time dispatch, load tracking, and settlement automation

✅ Built on modern tech stack (Next.js 16, React 19, TypeScript)

✅ Mobile-first design for drivers and dispatchers on the go

---

## SLIDE 4: MULTI-MC ARCHITECTURE

### Title:
Multi-MC Management

### Subtitle:
The "Zero Data Leak" Architecture

### Layout: Two Columns

#### Left Column: Admin View
```
├─ MC #123456
├─ MC #789012
├─ MC #345678
└─ Consolidated Analytics

✓ Full access to all MCs
✓ Cross-MC reporting
✓ Company-wide insights
```

#### Right Column: Dispatcher View
```
├─ MC #123456 ONLY
│   ├─ Loads
│   ├─ Drivers
│   └─ Trucks

✗ Cannot see other MCs
✓ Complete MC isolation
✓ Secure data access
```

### Footer:
✓ Single login, multiple MC contexts  
✓ Per-MC settlements and profit tracking  
✓ Automatic context switching with full data isolation

---

## SLIDE 5: WAR ROOM DASHBOARD

### Title:
War Room Dashboard

### Subtitle:
Live Operations Command Center

### Content:
[SCREENSHOT: screenshots/war-room-dashboard.png]

### 4 Feature Cards (2x2 grid):

**🗺️ Interactive Map**  
All active loads with real-time truck locations and clustering

**📊 Live KPIs**  
Today's revenue, loads in transit, available trucks, alerts

**🚨 Smart Alerts**  
Late deliveries, expiring documents, maintenance due, low fuel

**📱 Mobile Ready**  
Full functionality on tablets and phones

---

## SLIDE 6: LOAD MANAGEMENT

### Title:
Load Management

### Subtitle:
End-to-End Load Lifecycle

### Layout: Two Columns

#### Left Column: Process Flow
1. **Rate Con Upload** → AI extracts: customer, rate, pickup/delivery locations
2. **Smart Dispatch** → Matches available drivers/trucks, checks CDL/Med Card validity
3. **Real-Time Tracking** → GPS integration, milestone updates, ETA predictions
4. **Document Management** → BOL, POD, invoices linked per load
5. **Automated Settlement** → Driver pay calculated, owner pay processed

#### Right Column: Built-in Intelligence
✓ Split load detection (multi-driver scenarios)  
✓ Maintenance lockout (trucks under repair)  
✓ Profit margin visibility per load  
✓ Customer portal tracking  
✓ Weekly dispatch calendar

---

## SLIDE 7: TECHNOLOGY STACK

### Title:
Technology Stack

### Subtitle:
Built for Scale, Security, and Speed

### Table:
| Layer       | Technology              | Why It Matters                            |
|-------------|-------------------------|-------------------------------------------|
| **Frontend** | Next.js 16 + React 19   | Server-side rendering, instant page loads |
| **Backend**  | Next.js API Routes      | Unified codebase, easy deployment         |
| **Database** | PostgreSQL + Prisma 6   | Type-safe queries, automatic migrations   |
| **Auth**     | NextAuth v5             | Industry-standard OAuth, RBAC             |
| **AI**       | OpenAI GPT-4            | Document OCR, route optimization          |
| **Maps**     | Google Maps API         | Real-time tracking, geofencing, clustering|
| **Hosting**  | Vercel / AWS            | Auto-scaling, 99.9% uptime SLA            |

### Footer (Highlighted):
**10x faster** than legacy systems, **1/5th the infrastructure cost**

---

## SLIDE 8: MARKET OPPORTUNITY

### Title:
Market Opportunity

### Subtitle:
Massive Underserved Market

### 3 Stat Boxes (horizontal):

**1.2M**  
Trucking Companies in US

**200K**  
Target Segment (10-500 trucks)

**$8.5B**  
Total Addressable Market

### Why Now? (4 cards in 2x2 grid):

**📱 ELD Mandate (2017)**  
Forced digitization of trucking operations

**☁️ Cloud Adoption**  
COVID accelerated SaaS adoption in trucking

**👥 Driver Shortage**  
Demands operational efficiency optimization

**📋 Compliance**  
Regulations require multi-MC tracking

---

## SLIDE 9: BUSINESS MODEL

### Title:
Business Model

### Subtitle:
Subscription-Based SaaS

### Table:
| Plan           | Price/Month | Target Customer                    |
|----------------|-------------|------------------------------------|
| **Starter**    | $299        | 1-2 MCs, up to 10 trucks           |
| **Growth**     | $799        | 3-5 MCs, up to 50 trucks           |
| **Enterprise** | $1,999+     | Unlimited MCs, custom features     |

### Add-Ons:
• AI Rate Con Processing: $0.50/document  
• Driver Mobile App: $10/driver/month  
• Advanced Analytics: $299/month  
• Samsara Integration: $199/month

### Bottom Stats (centered):

**$18,000**  
LTV (3-year retention)

**15:1**  
LTV:CAC Ratio

---

## SLIDE 10: COMPETITIVE ADVANTAGE

### Title:
Competitive Advantage

### Subtitle:
Why Alogix Wins

### Table:
| Feature                    | Legacy TMS | Basic Cloud TMS | **Alogix**        |
|----------------------------|------------|-----------------|-------------------|
| Multi-MC Native            | ❌          | ⚠️ Add-on       | **✅ Built-in**   |
| Data Isolation             | ❌          | ❌              | **✅ Zero-leak**  |
| AI Document Processing     | ❌          | ❌              | **✅ GPT-4**      |
| Modern UI/UX               | ❌          | ⚠️              | **✅ Mobile-first**|
| Real-Time Tracking         | ⚠️          | ✅              | **✅**            |
| Sub-$300/mo Entry          | ❌          | ⚠️              | **✅**            |

### Our Moat:
1. **Technical**: The "Zero Data Leak" architecture is patent-pending
2. **Network Effects**: Driver mobile app creates lock-in
3. **First-Mover**: No competitor focuses on multi-MC as core feature

---

## SLIDE 11: TRACTION & ROADMAP

### Title:
Traction & Roadmap

### Subtitle:
MVP Complete, Beta Testing Phase

### Layout: Two Columns

#### Current Status (Q4 2024) - Green checkmarks:
✓ Core load/dispatch/settlement live  
✓ Multi-MC isolation tested  
✓ War Room with real-time tracking  
✓ Fleet management & breakdowns  
✓ Safety & compliance module  
✓ Customer portal tracking

#### Next 12 Months - Timeline:
**Q1 2025**: Beta launch, first 10 customers  
**Q2 2025**: AI route optimization, fuel tracking  
**Q3 2025**: Integration marketplace (QuickBooks, Motive)  
**Q4 2025**: Factoring partnerships, instant driver pay  
**2026**: Predictive maintenance, load marketplace

---

## SLIDE 12: FINANCIAL PROJECTIONS

### Title:
Financial Projections

### Subtitle:
5-Year Growth Plan

### Table:
| Year   | Customers | ARR      | Gross Margin |
|--------|-----------|----------|--------------|
| 2025   | 150       | $1.2M    | 75%          |
| 2026   | 500       | $4.8M    | 78%          |
| 2027   | 1,500     | $14M     | 80%          |
| 2028   | 4,000     | $36M     | 82%          |
| **2029** | **8,500** | **$72M** | **83%**    |

### Assumptions:
• Avg contract value: $8K/year (blended across all plans)  
• Churn: 8% annually (vs industry avg: 12%)  
• CAC Payback: 6 months  
• 60% revenue from subscriptions, 40% from add-ons

---

## SLIDE 13: THE ASK

### Title:
The Ask

### Subtitle:
Raising $2.5M Seed Round

### 4 Cards (2x2 grid):

**💻 Engineering (50%)**  
Hire 4 engineers, scale infrastructure, security audits (SOC 2)

**📢 Sales & Marketing (30%)**  
Outbound team, trade shows, content marketing, partnerships

**🎯 Customer Success (15%)**  
Onboarding, training materials, support infrastructure

**⚖️ Legal/Compliance (5%)**  
Patent filing, SOC 2 certification, compliance audits

### CTA Box (gradient background):
**This Gets Us To:**  
500 paying customers by end of 2026  
$5M ARR  
Series A fundraise position

---

## SLIDE 14: TEAM

### Title:
Team

### Subtitle:
Founders (Customize Based on Your Team)

### 3 Team Cards:

**👤 CEO: [Your Name]**  
15 years in trucking operations, former COO at [Carrier Company].  
Deep understanding of multi-MC compliance and operational challenges.

**👤 CTO: [Your Name / Co-Founder]**  
Ex-Uber Freight engineer, built dispatch systems for 10K+ trucks.  
Expert in real-time tracking, AI/ML, and scalable cloud architecture.

**👤 Head of Product: [Your Name / Co-Founder]**  
Former VP at [Legacy TMS Company], PhD in Logistics.  
10+ years building enterprise transportation software.

### Advisors:
• [Trucking Industry Veteran]  
• [SaaS Growth Expert]  
• [Venture Partner from Logistics-focused VC]

---

## SLIDE 15: CONTACT

### Background:
Light gradient or white

### Content (Centered):

# Let's Build the Future  
# of Trucking Together

📧 contact@alogix.com  
🌐 www.alogix.com  
📱 (555) 123-4567

---

*"Manage Every MC, Track Every Load,  
Pay Every Driver—From One Dashboard."*

### Button:
**[Schedule a Demo →]**

---

## 🎨 POWERPOINT CREATION STEPS

### Method 1: Manual Creation (Recommended)
1. Open PowerPoint/Google Slides
2. Choose "Blank Presentation"
3. Set slide size: 16:9 widescreen
4. Copy content from above, slide by slide
5. Apply consistent formatting
6. Insert screenshots where indicated
7. Add transitions (optional): "Fade" or "Push"

### Method 2: Import from Markdown (Advanced)
1. Use tool like Marp, Slidev, or Deckset
2. Convert this markdown to slides
3. Export as PowerPoint
4. Customize design

### Method 3: Use Canva (Easiest)
1. Go to Canva.com
2. Search "Pitch Deck" templates
3. Choose a modern, clean template
4. Replace text with content above
5. Download as PowerPoint or PDF

---

## 📐 SLIDE LAYOUTS

### Title Slide:
- Centered text
- Gradient background
- Minimal elements
- Contact info in footer

### Content Slides:
- Title: Top left, 36-44pt
- Subtitle: Below title, 24-28pt, gray
- Content: 18-22pt body text
- Slide number: Bottom right

### Data Slides:
- Tables: Clean lines, alternating row colors
- Charts: Bar or line charts, labeled axes
- Stats: Large numbers (48-72pt), small labels

### Image Slides:
- Full-width screenshot
- 3-4 sentence caption below
- Border or shadow on images

---

## 🎯 POWERPOINT PRO TIPS

### Consistency:
- Use Master Slides to set global formatting
- Stick to 2-3 fonts maximum
- Use same icon style throughout
- Keep margins consistent

### Readability:
- Minimum 18pt font size
- High contrast (dark text on light bg)
- No more than 6 bullets per slide
- No paragraphs—use bullets

### Visuals:
- Use icons from Noun Project or Flaticon
- Keep images high-resolution (300dpi)
- Use consistent color scheme
- Add subtle shadows for depth

### Animations (Optional):
- Entrance: Fade, Appear
- Exit: Fade Out
- Transitions: None or Fade
- Keep it subtle—no spinning text!

---

## 📤 EXPORT OPTIONS

### For Email (PDF):
- File → Export → PDF
- Optimize for: Standard (high quality)
- Include: All slides
- File size: ~5-10 MB

### For Presentation (PowerPoint):
- Save as .pptx
- Embed fonts: File → Options → Save → Embed fonts
- File size: ~20-30 MB

### For Web (Images):
- File → Export → PNG/JPG
- Resolution: 1920x1080
- Create one image per slide

---

**Ready to create your deck! Start with Slide 1 and work your way through. Good luck! 🚀**


