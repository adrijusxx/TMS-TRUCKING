# 📝 Documentation Update Reminder System

> **Automated reminders** to keep PROJECT-CONTEXT.md up to date

---

## 🔔 Reminder Schedule

### Weekly Check (Every Monday)
⏰ **When:** Start of each week  
📋 **Action:** Quick review

**Checklist:**
- [ ] Are "Current Goals" still accurate?
- [ ] Any completed tasks to mark as done?
- [ ] Any new priorities to add?
- [ ] Any blockers to document?

**Time Required:** 2-3 minutes

---

### Monthly Update (First Monday of Month)
⏰ **When:** First Monday of each month  
📋 **Action:** Comprehensive review

**Checklist:**
- [ ] Update "Current Goals & Priorities" section
- [ ] Review and update "Known Issues & Technical Debt"
- [ ] Update "Recent Changes" section
- [ ] Check if any dependencies upgraded (package.json)
- [ ] Review performance targets
- [ ] Update long-term vision if needed

**Time Required:** 10-15 minutes

---

### Quarterly Review (First Monday of Quarter)
⏰ **When:** January, April, July, October (first Monday)  
📋 **Action:** Deep review and planning

**Checklist:**
- [ ] Full review of PROJECT-CONTEXT.md
- [ ] Update long-term vision and phases
- [ ] Review tech stack for upgrades
- [ ] Audit completed vs planned features
- [ ] Update deployment information
- [ ] Review and update performance targets
- [ ] Clean up completed items from "Known Issues"
- [ ] Plan next quarter priorities

**Time Required:** 30-45 minutes

---

## 🚀 Trigger-Based Updates (Do Immediately)

### ✅ Major Feature Completed
**When:** You finish a significant feature  
**Update:**
- [ ] Add to "Recent Changes" section
- [ ] Remove from "Current Goals" if listed
- [ ] Update architecture diagram if needed
- [ ] Document any new patterns used

### 📦 Dependency Upgraded
**When:** You upgrade major dependencies  
**Update:**
- [ ] Update version numbers in "Tech Stack" section
- [ ] Note any breaking changes in "Recent Changes"
- [ ] Update relevant code examples if patterns changed

### 🏗️ Architecture Change
**When:** You make structural changes to the codebase  
**Update:**
- [ ] Update "Architecture Overview" section
- [ ] Update file structure if changed
- [ ] Document new patterns in PROJECT_RULES.md
- [ ] Update "Key Patterns & Conventions"

### 🔴 Critical Refactoring
**When:** You refactor major components/files  
**Update:**
- [ ] Remove from "Oversized Files" list
- [ ] Add to "Recent Changes"
- [ ] Update any affected patterns

### 🐛 Critical Bug Fixed
**When:** You fix a major bug or security issue  
**Update:**
- [ ] Add to "Recent Changes"
- [ ] Update "Known Issues" if it was listed
- [ ] Document the fix if it's a pattern to follow

---

## 📅 Calendar Integration

### Add These to Your Calendar

**Weekly Reminder:**
```
Title: 📝 Update PROJECT-CONTEXT.md (Weekly Check)
When: Every Monday, 9:00 AM
Duration: 5 minutes
Recurrence: Weekly
```

**Monthly Reminder:**
```
Title: 📝 Update PROJECT-CONTEXT.md (Monthly Review)
When: First Monday of Month, 9:00 AM
Duration: 15 minutes
Recurrence: Monthly
```

**Quarterly Reminder:**
```
Title: 📝 Update PROJECT-CONTEXT.md (Quarterly Review)
When: First Monday of Jan/Apr/Jul/Oct, 9:00 AM
Duration: 45 minutes
Recurrence: Every 3 months
```

---

## 🤖 Automated Git Hook (Optional)

### Setup Pre-Push Hook

Create `.git/hooks/pre-push` (or update if exists):

```bash
#!/bin/bash

# Check last update date of PROJECT-CONTEXT.md
CONTEXT_FILE="PROJECT-CONTEXT.md"
LAST_UPDATE=$(git log -1 --format=%cd --date=short -- "$CONTEXT_FILE")
DAYS_SINCE=$(( ($(date +%s) - $(date -d "$LAST_UPDATE" +%s)) / 86400 ))

# Remind if over 30 days since last update
if [ $DAYS_SINCE -gt 30 ]; then
  echo ""
  echo "⚠️  WARNING: PROJECT-CONTEXT.md hasn't been updated in $DAYS_SINCE days!"
  echo ""
  echo "Please consider updating:"
  echo "  - Current Goals & Priorities"
  echo "  - Recent Changes"
  echo "  - Known Issues"
  echo ""
  read -p "Continue with push? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-push
```

---

## 📊 Update Tracking

### Update Log Template

When you update PROJECT-CONTEXT.md, add an entry here:

```markdown
## Update Log

### 2025-12-04 - Initial Creation
- Created PROJECT-CONTEXT.md with full current state
- Added all tech stack versions
- Documented recent cleanup
- Set up reminder system

### [Next Update Date] - [Brief Description]
- [What was updated]
- [Why it was updated]
- [Any important changes]
```

---

## 🎯 Quick Update Commands

### Copy-paste these when updating:

**Check when last updated:**
```bash
git log -1 --format="%cd - %s" --date=short -- PROJECT-CONTEXT.md
```

**See what changed:**
```bash
git diff HEAD~1 PROJECT-CONTEXT.md
```

**Update timestamp (add to bottom of PROJECT-CONTEXT.md):**
```markdown
**Last Updated:** December 4, 2025
```

---

## ✅ Update Checklist (Print & Post)

```
┌─────────────────────────────────────────┐
│   📝 PROJECT-CONTEXT.md UPDATE          │
│                                          │
│   WEEKLY (Every Monday):                │
│   □ Review current goals                │
│   □ Update completed tasks              │
│                                          │
│   MONTHLY (First Monday):               │
│   □ Update all sections                 │
│   □ Check dependency versions           │
│   □ Review known issues                 │
│                                          │
│   ON MAJOR CHANGES:                     │
│   □ Feature completed                   │
│   □ Dependency upgraded                 │
│   □ Architecture changed                │
│   □ Critical refactoring                │
│                                          │
│   Last Updated: _______________         │
└─────────────────────────────────────────┘
```

---

## 💡 Tips for Staying Consistent

1. **Make it a Habit:** Update every Monday morning before standup
2. **Keep it Short:** Most updates take < 5 minutes
3. **Document as You Go:** Add to "Recent Changes" when you finish features
4. **Use Reminders:** Set phone/calendar reminders
5. **Review in Retrospectives:** Make it part of sprint retrospectives
6. **Team Responsibility:** Everyone can update (not just one person)

---

## 🚨 Signs You Need to Update

- ❌ Someone asks "what version of Next.js are we using?"
- ❌ AI assistant suggests outdated patterns
- ❌ New developer can't understand current priorities
- ❌ Tech stack section has wrong versions
- ❌ "Current Goals" lists completed features
- ❌ "Recent Changes" is over 60 days old

---

## 📞 Accountability

**Primary Owner:** Tech Lead / System Architect  
**Backup Owner:** Senior Developer  
**Team Responsibility:** Everyone

**Review Schedule:**
- Team Lead reviews: Monthly
- Team reviews together: Quarterly

---

**Status:** ✅ **REMINDER SYSTEM ACTIVE**

**Next Review:** [Mark your calendar!]

---

## 🔗 Quick Links

- [PROJECT-CONTEXT.md](../PROJECT-CONTEXT.md)
- [PROJECT_RULES.md](../PROJECT_RULES.md)
- [Organization Guidelines](../docs/PROJECT_ORGANIZATION_GUIDELINES.md)

