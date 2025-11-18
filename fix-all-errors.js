// Comprehensive fix script for common TypeScript/Next.js errors
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all potential errors...\n');

let fixedCount = 0;

// Find all TypeScript files
function findTSFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('dist')) {
          findTSFiles(filePath, fileList);
        } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.d.ts')) {
          fileList.push(filePath);
        }
      } catch (e) {
        // Skip files that can't be accessed
      }
    });
  } catch (e) {
    // Skip directories that can't be accessed
  }
  return fileList;
}

const allFiles = [...findTSFiles('./app'), ...findTSFiles('./lib'), ...findTSFiles('./components')];

allFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix 1: Remove distance: true from select statements
    if (content.includes('distance: true')) {
      // Remove distance: true, line
      content = content.replace(/^\s*distance:\s*true,?\s*$/gm, '');
      // Remove distance: true, (inline)
      content = content.replace(/distance:\s*true,?\s*/g, '');
      modified = true;
    }

    // Fix 2: Replace load.distance with route?.totalDistance || totalMiles || 0
    content = content.replace(/load\.distance(\s*\|\|)?/g, '(load.route?.totalDistance || load.totalMiles || 0)$1');
    if (content !== originalContent) modified = true;

    // Fix 3: Fix Zod error.errors to error.issues (Zod v4)
    if (content.includes('error.errors') && content.includes('ZodError')) {
      content = content.replace(/error\.errors/g, 'error.issues');
      modified = true;
    }

    // Fix 4: Fix params Promise type in route handlers (if still using old pattern)
    // This is more complex, so we'll do a targeted fix
    if (file.includes('[id]') || file.includes('[driverId]') || file.includes('[entity]')) {
      // Check if it's a route file and has old params pattern
      const oldPattern = /\{ params \}:\s*\{ params:\s*\{ (id|driverId|entity):\s*string \} \}/;
      if (oldPattern.test(content) && !content.includes('Promise<{')) {
        // This needs manual review, so we'll just log it
        console.log(`⚠️  ${file} may need params Promise fix`);
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  } catch (e) {
    // Skip files that can't be processed
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n💡 Tip: Clear .next cache if errors persist: rm -rf .next (or Remove-Item -Recurse -Force .next on Windows)');

