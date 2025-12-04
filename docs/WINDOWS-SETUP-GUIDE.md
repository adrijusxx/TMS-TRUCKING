# Windows Setup Guide for Documentation System

> **Windows-Specific Instructions** for using the documentation and quick reference system

---

## ✅ Working Now!

The documentation check script has been fixed for Windows PowerShell:

```powershell
npm run docs:check
```

**Expected Output:**
```
================================================================
  PROJECT-CONTEXT.md Update Check
================================================================

WARNING: Could not determine last update date
   (File may not be committed yet)
```

> **Note:** The warning appears because PROJECT-CONTEXT.md hasn't been committed to git yet. Once you commit it, the script will show the actual last update date.

---

## 🚀 Quick Start (Windows)

### 1. Check Documentation Age
```powershell
npm run docs:check
```

### 2. Open Files in Cursor/VS Code

**Option A: Through Windows Explorer**
- Right-click file
- Choose "Open with Cursor" or "Open with Code"

**Option B: Through PowerShell (if code/cursor in PATH)**
```powershell
# Open Quick Reference
cursor QUICK-REFERENCE.md
# or
code QUICK-REFERENCE.md

# Open Context
cursor PROJECT-CONTEXT.md
# or
code PROJECT-CONTEXT.md
```

**Option C: Direct PowerShell Command**
```powershell
# Open with default editor
Start-Process QUICK-REFERENCE.md
Start-Process PROJECT-CONTEXT.md
```

### 3. Browse Quick Reference
You can also open `QUICK-REFERENCE.md` in your browser:
- Navigate to file in Windows Explorer
- Right-click → Open with → Browser

---

## 📋 Windows-Specific Commands

### Open Files
```powershell
# Open in default editor
Start-Process QUICK-REFERENCE.md
Start-Process PROJECT-CONTEXT.md
Start-Process .github\DOCUMENTATION_REMINDER.md

# Open folder in explorer
Start-Process .
Start-Process docs\
```

### Git Commands
```powershell
# See last update to context
git log -1 --format="%cd - %s" --date=short -- PROJECT-CONTEXT.md

# See recent changes
git log -5 --oneline -- PROJECT-CONTEXT.md

# Commit the new files
git add .
git commit -m "Add documentation system and quick reference"
```

### Navigation
```powershell
# List files
Get-ChildItem
dir
ls  # PowerShell alias

# Go to docs folder
cd docs
Set-Location docs  # Full command

# Go back
cd ..
```

---

## 🔔 Setting Up Reminders (Windows)

### Method 1: Windows Task Scheduler (Recommended)

**Weekly Reminder:**
1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
   - Name: "Update PROJECT-CONTEXT Weekly"
   - Trigger: Weekly, Every Monday at 9:00 AM
   - Action: Display a message
   - Message: "Time to check PROJECT-CONTEXT.md! Run: npm run docs:check"

**Monthly Reminder:**
1. Create Basic Task
   - Name: "Update PROJECT-CONTEXT Monthly"
   - Trigger: Monthly, First Monday at 9:00 AM
   - Action: Display a message
   - Message: "Monthly review of PROJECT-CONTEXT.md needed! (~15 min)"

### Method 2: Windows Calendar/Outlook

**Copy-paste these into Outlook/Windows Calendar:**

**Weekly:**
```
Subject: 📝 Check PROJECT-CONTEXT.md
Recurrence: Weekly, every Monday at 9:00 AM
Reminder: 15 minutes before
Body: Run: npm run docs:check
Time: 5 minutes
```

**Monthly:**
```
Subject: 📝 Update PROJECT-CONTEXT.md (Monthly)
Recurrence: Monthly, first Monday at 9:00 AM
Reminder: 15 minutes before
Body: Full review of context document
Time: 15 minutes
```

### Method 3: Windows Sticky Notes

Create a sticky note with:
```
📝 Every Monday:
   npm run docs:check

📝 First Monday:
   Review PROJECT-CONTEXT.md
   (~15 min)
```

---

## 💡 Windows Tips

### 1. PowerShell Profile (Auto-Load Aliases)

Add shortcuts to your PowerShell profile:

```powershell
# Open profile
notepad $PROFILE

# Add these lines:
function docs { npm run docs:check }
function qref { Start-Process QUICK-REFERENCE.md }
function pcontext { Start-Process PROJECT-CONTEXT.md }

# Save and reload
. $PROFILE
```

Now you can just type:
```powershell
docs       # Run docs check
qref       # Open quick reference
pcontext   # Open context
```

### 2. Desktop Shortcuts

Create shortcuts on your desktop:

**Quick Reference Shortcut:**
1. Right-click desktop → New → Shortcut
2. Location: `C:\Users\ERIDAS\OneDrive\CURSOR PROJECTS\TMS-TRUCKING\QUICK-REFERENCE.md`
3. Name: "TMS Quick Reference"

**Context Document Shortcut:**
1. Right-click desktop → New → Shortcut
2. Location: `C:\Users\ERIDAS\OneDrive\CURSOR PROJECTS\TMS-TRUCKING\PROJECT-CONTEXT.md`
3. Name: "TMS Context"

### 3. Windows Terminal Settings

If using Windows Terminal, add to `settings.json`:

```json
{
  "profiles": {
    "list": [
      {
        "startingDirectory": "C:\\Users\\ERIDAS\\OneDrive\\CURSOR PROJECTS\\TMS-TRUCKING"
      }
    ]
  }
}
```

---

## 🔍 Troubleshooting

### Issue: "npm run docs:check" shows warning about git

**Problem:**
```
WARNING: Could not determine last update date
   (File may not be committed yet)
```

**Solution:**
Commit the files to git first:
```powershell
git add PROJECT-CONTEXT.md
git add QUICK-REFERENCE.md
git add scripts/check-context-update.ps1
git commit -m "Add documentation system"
```

After committing, run again:
```powershell
npm run docs:check
```

Now it will show:
```
Last Updated: 2025-12-04 (0 days ago)
Status: UP TO DATE
```

---

### Issue: Can't open files with "code" command

**Problem:**
```
code : The term 'code' is not recognized
```

**Solutions:**

**Option 1: Add to PATH**
1. Open "Edit system environment variables"
2. Click "Environment Variables"
3. Under "User variables", select "Path"
4. Click "Edit" → "New"
5. Add: `C:\Users\ERIDAS\AppData\Local\Programs\Microsoft VS Code\bin`
6. Click OK, restart terminal

**Option 2: Use Full Path**
```powershell
& "C:\Users\ERIDAS\AppData\Local\Programs\Microsoft VS Code\Code.exe" QUICK-REFERENCE.md
```

**Option 3: Use Windows Default**
```powershell
Start-Process QUICK-REFERENCE.md
```

---

### Issue: PowerShell Execution Policy

**Problem:**
```
execution of scripts is disabled on this system
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📦 Available Commands (Windows)

```powershell
# Documentation
npm run docs:check              # Check documentation age

# Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run type-check              # TypeScript check

# Database
npm run db:generate             # Generate Prisma client
npm run db:migrate              # Run migrations
npm run db:studio               # Open Prisma Studio
npm run db:seed                 # Seed database

# Audit
npm run audit:schema            # Extract schema
npm run audit:full              # Full audit

# Testing
npm run test                    # Run tests
npm run test:watch              # Watch mode
```

---

## 🎯 Daily Workflow (Windows)

### Morning Routine (Monday)
```powershell
# 1. Start your day
cd "C:\Users\ERIDAS\OneDrive\CURSOR PROJECTS\TMS-TRUCKING"

# 2. Check documentation
npm run docs:check

# 3. Open quick reference (keep it open)
Start-Process QUICK-REFERENCE.md

# 4. Start development
npm run dev
```

### Throughout the Day
- Keep `QUICK-REFERENCE.md` open in a second window
- Copy-paste templates as needed
- Reference commands quickly

### End of Day (if major changes)
```powershell
# Update context if you completed something major
Start-Process PROJECT-CONTEXT.md
# Add to "Recent Changes" section
# Update "Current Goals" if needed
```

---

## ✅ Quick Test Checklist

Test these commands now:

- [ ] `npm run docs:check` - Works?
- [ ] `Start-Process QUICK-REFERENCE.md` - Opens?
- [ ] `Start-Process PROJECT-CONTEXT.md` - Opens?
- [ ] `git log -1 -- PROJECT-CONTEXT.md` - Shows commits?
- [ ] Set up calendar reminder
- [ ] Bookmark `QUICK-REFERENCE.md` in browser

---

## 🎉 You're All Set!

**What Works Now:**
- ✅ Documentation check script (`npm run docs:check`)
- ✅ All files created and organized
- ✅ Quick reference ready to use
- ✅ Reminder system documented

**Next Steps:**
1. Commit the new files to git
2. Set up calendar reminders
3. Keep QUICK-REFERENCE.md handy
4. Run `npm run docs:check` every Monday

---

**Windows-Specific Files:**
- ✅ `scripts/check-context-update.ps1` (PowerShell version)
- ✅ `package.json` updated to use PowerShell script

**Universal Files:**
- ✅ `QUICK-REFERENCE.md`
- ✅ `PROJECT-CONTEXT.md`
- ✅ `.github/DOCUMENTATION_REMINDER.md`

---

**Last Updated:** December 4, 2025  
**System:** Windows 10/11 with PowerShell

