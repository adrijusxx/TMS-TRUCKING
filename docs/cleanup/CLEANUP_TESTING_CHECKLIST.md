# Cleanup Testing Checklist

**Quick Reference for Testing After Cleanup**

---

## 🚀 Pre-Testing Setup

```bash
# 1. Install updated dependencies
npm install

# 2. Verify no TypeScript errors
npm run type-check

# 3. Check for any remaining issues
npx knip
```

---

## ✅ Critical Tests (Do These First)

### 1. Application Startup
- [ ] `npm run dev` - Dev server starts without errors
- [ ] `npm run build` - Production build completes successfully
- [ ] No console errors on page load

### 2. Core Features
- [ ] **Documents:** Upload, view, delete documents
- [ ] **Batches:** Create, view, send to factoring, delete batches
- [ ] **Safety Pages:** All 7 compliance types load correctly:
  - [ ] MVR Tracking (`/dashboard/safety/drivers/[id]/mvr`)
  - [ ] CDL Records (`/dashboard/safety/drivers/[id]/cdl`)
  - [ ] HOS Monitoring (`/dashboard/safety/drivers/[id]/hos`)
  - [ ] Drug Tests (`/dashboard/safety/drivers/[id]/drug-tests`)
  - [ ] DQF Management (`/dashboard/safety/drivers/[id]/dqf`)
  - [ ] Medical Cards (`/dashboard/safety/drivers/[id]/medical-cards`)
  - [ ] Annual Review (`/dashboard/safety/drivers/[id]/annual-review`)

### 3. UI Components
- [ ] **Theme Switching:** Light/dark mode works
- [ ] **Command Component:** Search/command palette works (uses @radix-ui/react-visually-hidden)
- [ ] **Toast Notifications:** Success/error toasts appear (using sonner)

---

## 🔍 Specific Areas to Test

### Dependencies Removed
- [ ] **Maps:** If you use maps, verify they still work (leaflet removed)
- [ ] **State Management:** Verify no zustand usage (removed)
- [ ] **Theme:** Custom ThemeProvider works (next-themes removed)

### Files Removed
- [ ] **Scripts:** Verify no npm scripts reference deleted script files
- [ ] **Types:** No imports from `types/index.ts` (deleted)

---

## 🐛 If Something Breaks

### Quick Fixes

1. **Missing Dependency Error:**
   ```bash
   # Check CLEANUP_BACKUP_LOG.md for what was removed
   # Restore specific dependency:
   npm install <package-name>@<version>
   ```

2. **Import Error:**
   ```bash
   # Check if file was deleted in CLEANUP_BACKUP_LOG.md
   # Restore from git:
   git checkout HEAD~1 -- <file-path>
   ```

3. **Full Rollback:**
   ```bash
   # Restore all removed dependencies:
   # Windows:
   .\scripts\restore-removed-dependencies.ps1
   
   # Linux/Mac:
   bash scripts/restore-removed-dependencies.sh
   ```

---

## 📊 Expected Results

### After Cleanup:
- ✅ Fewer unused files (22 removed)
- ✅ Cleaner package.json (11 dependencies removed, 3 added)
- ✅ Smaller node_modules (after `npm install`)
- ✅ Faster build times (fewer dependencies to process)

### Knip Output Should Show:
- ✅ Fewer unused files
- ✅ No missing dependencies
- ✅ Same or fewer unused exports (we didn't remove those)

---

## 🎯 Success Criteria

✅ **All tests pass**  
✅ **No runtime errors**  
✅ **No missing dependency errors**  
✅ **Application functions normally**  
✅ **Build completes successfully**

---

## 📝 Notes

- All changes are documented in `CLEANUP_BACKUP_LOG.md`
- Restoration scripts available in `scripts/` folder
- Git history contains all deleted files (can be restored)

---

**Status:** Ready for Testing  
**Next Step:** Run `npm install` and start testing!






