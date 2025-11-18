# Cron Jobs Setup Guide

This document describes how to set up automated cron jobs for the TMS system.

## Available Cron Endpoints

### Daily Tasks (`/api/cron/daily`)
**Recommended Schedule:** Daily at 2:00 AM

**Tasks:**
- Automated load status updates
- Document expiry checks (30 days ahead)

**Setup:**
```bash
# Using Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/cron/daily",
    "schedule": "0 2 * * *"
  }]
}

# Using GitHub Actions
# .github/workflows/daily-cron.yml
name: Daily Cron
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Cron
        run: |
          curl -X GET https://your-domain.com/api/cron/daily \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Hourly Tasks (`/api/cron/hourly`)
**Recommended Schedule:** Every hour

**Tasks:**
- Automated load status updates (more frequent)

**Setup:**
```bash
# Using Vercel Cron
{
  "crons": [{
    "path": "/api/cron/hourly",
    "schedule": "0 * * * *"
  }]
}
```

### Weekly Tasks (`/api/cron/weekly`)
**Recommended Schedule:** Sunday at 3:00 AM

**Tasks:**
- Document expiry checks (60 days ahead)

**Setup:**
```bash
# Using Vercel Cron
{
  "crons": [{
    "path": "/api/cron/weekly",
    "schedule": "0 3 * * 0"
  }]
}
```

## Security

All cron endpoints support optional authentication via `CRON_SECRET` environment variable:

```env
CRON_SECRET=your-secret-token-here
```

When set, requests must include:
```
Authorization: Bearer your-secret-token-here
```

## Manual Execution

You can also trigger these tasks manually from the Automation Panel in the dashboard.

## Monitoring

Monitor cron job execution through:
- Server logs
- Activity logs in the system
- Notification system (for errors)

