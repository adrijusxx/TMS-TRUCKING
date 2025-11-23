# Load-to-Accounting Automation - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you get the load-to-accounting automation system up and running quickly.

---

## Step 1: Apply Database Migration (2 minutes)

```bash
# Navigate to project directory
cd /path/to/TMS-TRUCKING

# Apply the migration
npx prisma migrate deploy

# Verify migration
npx prisma db push --preview-feature
```

**Expected Output:**
```
✔ Migration applied successfully
✔ Database schema is in sync
```

---

## Step 2: Setup Cron Job (1 minute)

### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'settlement-cron',
    script: 'node',
    args: '-e "require(\'./lib/automation/settlement-generation\').runWeeklySettlementGeneration()"',
    cron_restart: '0 0 * * 1',
    autorestart: false
  }]
}
EOF

# Start the cron job
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option B: Manual API Call (For Testing)

```bash
# Test settlement generation manually
curl -X POST http://localhost:3000/api/automation/settlement-generation \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Step 3: Access the Dashboards (1 minute)

### Accounting Dashboard
```
URL: http://localhost:3000/dashboard/accounting

Features:
✅ Pending Settlements - Approve/reject with one click
✅ Advance Requests - Approve advances with payment method
✅ Cash Flow - 7-day projection
✅ Real-time Metrics - Pending items and amounts
```

### Analytics Dashboard
```
URL: http://localhost:3000/dashboard/analytics/loads

Features:
✅ Load Profitability - Revenue vs costs analysis
✅ Driver Performance - Rankings and metrics
✅ Customer Analysis - Profitability by customer
✅ Expense Trends - Cost breakdown
✅ Route Efficiency - Deadhead analysis
✅ Settlement Forecast - 4-week projections
```

---

## Step 4: Test the Workflow (1 minute)

### Test Load Completion
```bash
# Mark a test load as complete
curl -X POST http://localhost:3000/api/loads/YOUR_LOAD_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Load syncs to accounting automatically
```

### Test Settlement Approval
1. Go to `http://localhost:3000/dashboard/accounting`
2. Click "Pending Settlements" tab
3. Click green checkmark on any settlement
4. Settlement status updates to APPROVED

### Test Advance Approval
1. Go to `http://localhost:3000/dashboard/accounting`
2. Click "Advance Requests" tab
3. Click approve button
4. Select payment method (ACH, Wire, Check, etc.)
5. Click "Approve Advance"

---

## 🎯 What Happens Automatically

### When a Load is Delivered:
1. ✅ Load status updated to DELIVERED
2. ✅ Accounting sync triggered
3. ✅ Load costs calculated
4. ✅ Profitability analyzed
5. ✅ Driver stats updated
6. ✅ Truck mileage updated
7. ✅ Customer metrics updated

### Every Monday at Midnight:
1. ✅ System finds all active drivers
2. ✅ Generates settlements for previous week
3. ✅ Applies all deduction rules
4. ✅ Sends notifications to drivers
5. ✅ Sends notifications to accounting team
6. ✅ Logs everything for audit

### When Settlement is Approved:
1. ✅ Status updated to APPROVED
2. ✅ Approval logged with timestamp
3. ✅ Driver notified
4. ✅ Ready for payment processing

---

## 📊 Quick Reference - API Endpoints

### Load Completion
```bash
# Complete load
POST /api/loads/[id]/complete

# Upload POD
POST /api/loads/[id]/pod-upload

# Check status
GET /api/loads/[id]/accounting-status
```

### Driver Advances
```bash
# Request advance
POST /api/advances/request

# List advances
GET /api/advances?status=PENDING

# Approve advance
PATCH /api/advances/[id]/approve

# Driver history
GET /api/advances/driver/[driverId]
```

### Settlements
```bash
# Generate settlements
POST /api/settlements/generate-auto

# Pending approvals
GET /api/settlements/pending-approval

# Approve settlement
PATCH /api/settlements/[id]/approve

# Get breakdown
GET /api/settlements/[id]/breakdown
```

### Expenses
```bash
# Add expense
POST /api/loads/[id]/expenses

# List expenses
GET /api/loads/[id]/expenses

# Update expense
PATCH /api/expenses/[id]

# Delete expense
DELETE /api/expenses/[id]
```

---

## 🔧 Configuration

### Create Deduction Rule
```bash
curl -X POST http://localhost:3000/api/deduction-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Insurance Deduction",
    "deductionType": "INSURANCE",
    "driverType": "COMPANY_DRIVER",
    "amount": 150,
    "frequency": "PER_SETTLEMENT",
    "isActive": true
  }'
```

### Common Deduction Rules

**Insurance (All Company Drivers)**
```json
{
  "name": "Health Insurance",
  "deductionType": "INSURANCE",
  "driverType": "COMPANY_DRIVER",
  "amount": 150,
  "frequency": "PER_SETTLEMENT"
}
```

**Truck Payment (Specific Driver)**
```json
{
  "name": "Truck Payment - Driver 001",
  "deductionType": "TRUCK_PAYMENT",
  "driverId": "driver-id-here",
  "amount": 800,
  "frequency": "WEEKLY"
}
```

**Escrow (Percentage-based)**
```json
{
  "name": "Escrow 5%",
  "deductionType": "ESCROW",
  "driverType": "OWNER_OPERATOR",
  "percentage": 5,
  "frequency": "PER_LOAD"
}
```

---

## 🎓 Training Checklist

### For Accounting Team
- [ ] Can access accounting dashboard
- [ ] Can approve/reject settlements
- [ ] Can approve/reject advances
- [ ] Can view cash flow projection
- [ ] Understands approval workflow
- [ ] Knows how to check sync status

### For Administrators
- [ ] Can create deduction rules
- [ ] Can manually trigger settlements
- [ ] Can check cron job status
- [ ] Can view activity logs
- [ ] Understands error handling
- [ ] Knows troubleshooting steps

### For Drivers (When Portal Built)
- [ ] Can view settlement history
- [ ] Can request advances
- [ ] Can submit expenses
- [ ] Can track advance balance
- [ ] Understands approval process

---

## ✅ Success Checklist

After setup, verify:

- [ ] Database migration applied successfully
- [ ] Cron job running (check with `pm2 list`)
- [ ] Accounting dashboard accessible
- [ ] Analytics dashboard accessible
- [ ] Can approve test settlement
- [ ] Can approve test advance
- [ ] Load completion triggers sync
- [ ] Notifications working
- [ ] Activity logs recording events

---

## 🐛 Quick Troubleshooting

### Cron Job Not Running
```bash
pm2 list                    # Check status
pm2 logs settlement-cron    # View logs
pm2 restart settlement-cron # Restart
```

### Settlements Not Generating
```bash
# Check last run
curl http://localhost:3000/api/automation/settlement-generation

# Manual trigger
curl -X POST http://localhost:3000/api/automation/settlement-generation \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Approval Not Working
1. Check user role (must be ADMIN or ACCOUNTANT)
2. Check settlement status (must be PENDING)
3. Check browser console for errors
4. Review activity logs in database

---

## 📞 Need Help?

**Common Issues:**
- Database migration errors → Check DATABASE_URL
- Cron job not starting → Check PM2 installation
- API errors → Check authentication token
- UI not loading → Check build process

**Support Contacts:**
- Development Team: [email/slack]
- System Admin: [email/slack]
- Database Admin: [email/slack]

---

## 🎉 You're Ready!

The system is now running and ready to:
- ✅ Automatically sync completed loads
- ✅ Generate weekly settlements
- ✅ Process advance requests
- ✅ Track expenses
- ✅ Provide real-time analytics

**Next Steps:**
1. Train accounting team on approval workflows
2. Configure deduction rules for your drivers
3. Test with a few loads before full rollout
4. Monitor activity logs for first week
5. Gather feedback from accounting team

---

**Questions?** Check the full documentation in `LOAD_ACCOUNTING_README.md`

**Last Updated:** November 23, 2025  
**Version:** 1.0.0



