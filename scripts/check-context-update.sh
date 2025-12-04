#!/bin/bash

# Check when PROJECT-CONTEXT.md was last updated and remind if stale

CONTEXT_FILE="PROJECT-CONTEXT.md"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📝 PROJECT-CONTEXT.md Update Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if file exists
if [ ! -f "$CONTEXT_FILE" ]; then
  echo -e "${RED}❌ ERROR: $CONTEXT_FILE not found!${NC}"
  echo ""
  exit 1
fi

# Get last commit date for the file
LAST_UPDATE=$(git log -1 --format=%cd --date=short -- "$CONTEXT_FILE" 2>/dev/null)

if [ -z "$LAST_UPDATE" ]; then
  echo -e "${YELLOW}⚠️  WARNING: Could not determine last update date${NC}"
  echo "   (File may not be committed yet)"
  echo ""
  exit 0
fi

# Calculate days since last update
LAST_UPDATE_TIMESTAMP=$(date -d "$LAST_UPDATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$LAST_UPDATE" +%s 2>/dev/null)
TODAY_TIMESTAMP=$(date +%s)
DAYS_SINCE=$(( ($TODAY_TIMESTAMP - $LAST_UPDATE_TIMESTAMP) / 86400 ))

echo "📅 Last Updated: $LAST_UPDATE ($DAYS_SINCE days ago)"
echo ""

# Determine status and recommendations
if [ $DAYS_SINCE -lt 7 ]; then
  echo -e "${GREEN}✅ Status: UP TO DATE${NC}"
  echo "   Great! Context document is fresh."
  
elif [ $DAYS_SINCE -lt 30 ]; then
  echo -e "${YELLOW}⚠️  Status: COULD USE UPDATE${NC}"
  echo "   Consider reviewing:"
  echo "   • Current Goals & Priorities"
  echo "   • Recent Changes section"
  
elif [ $DAYS_SINCE -lt 90 ]; then
  echo -e "${RED}🔴 Status: NEEDS UPDATE${NC}"
  echo ""
  echo "   It's been over a month! Please update:"
  echo "   • Current Goals & Priorities"
  echo "   • Recent Changes & Cleanup"
  echo "   • Known Issues & Technical Debt"
  echo "   • Tech Stack versions (if upgraded)"
  echo ""
  echo "   📖 Quick Update Command:"
  echo "   code PROJECT-CONTEXT.md"
  
else
  echo -e "${RED}🚨 Status: CRITICALLY OUTDATED${NC}"
  echo ""
  echo "   PROJECT-CONTEXT.md is over 90 days old!"
  echo "   This document is meant to be a living memory bank."
  echo ""
  echo "   REQUIRED UPDATES:"
  echo "   • Full review of all sections"
  echo "   • Update Current Goals & Priorities"
  echo "   • Document all Recent Changes"
  echo "   • Review Known Issues"
  echo "   • Check Tech Stack versions"
  echo ""
  echo "   ⏰ Time Required: ~15-20 minutes"
  echo ""
fi

# Check for uncommitted changes
if git diff --quiet HEAD -- "$CONTEXT_FILE" 2>/dev/null; then
  echo ""
else
  echo ""
  echo -e "${YELLOW}📝 Note: You have uncommitted changes to $CONTEXT_FILE${NC}"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit with appropriate code
if [ $DAYS_SINCE -gt 90 ]; then
  exit 2  # Critical
elif [ $DAYS_SINCE -gt 30 ]; then
  exit 1  # Warning
else
  exit 0  # OK
fi

