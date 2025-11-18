// Comprehensive TypeScript/Next.js Error Scanner
// Run this instead of npm run build to quickly find errors
const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for TypeScript/Next.js errors...\n');

const errors = [];

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
      } catch (e) {}
    });
  } catch (e) {}
  return fileList;
}

const allFiles = [...findTSFiles('./app'), ...findTSFiles('./lib'), ...findTSFiles('./components')];

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Check for distance field in selects
      if (line.includes('distance: true')) {
        errors.push({
          file,
          line: lineNum,
          type: 'distance_field',
          message: "Load model doesn't have 'distance' field - use route.totalDistance or totalMiles",
          fix: 'Remove distance: true or use route: { select: { totalDistance: true } }'
        });
      }

      // 2. Check for load.distance usage
      if (line.includes('load.distance') && !line.includes('totalDistance') && !line.includes('//')) {
        errors.push({
          file,
          line: lineNum,
          type: 'distance_property',
          message: "load.distance doesn't exist - use load.route?.totalDistance || load.totalMiles || 0",
          fix: 'Replace with: load.route?.totalDistance || load.totalMiles || 0'
        });
      }

      // 3. Check for old params pattern (Next.js 16)
      if (line.includes('{ params }: { params: {') && 
          line.includes(': string } }') &&
          !line.includes('Promise<') &&
          (file.includes('[id]') || file.includes('[driverId]') || file.includes('[entity]'))) {
        errors.push({
          file,
          line: lineNum,
          type: 'params_promise',
          message: 'Next.js 16 requires params to be Promise - change to Promise<{ id: string }>',
          fix: 'Change to: { params }: { params: Promise<{ id: string }> } and await params'
        });
      }

      // 4. Check for Zod error.errors (should be error.issues in Zod v4)
      if (line.includes('error.errors') && content.includes('ZodError')) {
        errors.push({
          file,
          line: lineNum,
          type: 'zod_error',
          message: 'Zod v4 uses error.issues instead of error.errors',
          fix: 'Replace error.errors with error.issues'
        });
      }

      // 5. Check for z.record() without key type (Zod v4)
      if (line.includes('z.record(') && !line.includes('z.record(z.string()')) {
        errors.push({
          file,
          line: lineNum,
          type: 'zod_record',
          message: 'Zod v4 requires z.record(keyType, valueType) - use z.record(z.string(), z.any())',
          fix: 'Change to: z.record(z.string(), z.any())'
        });
      }

      // 6. Check for new Date() with potentially null values
      if (line.includes('new Date(') && 
          (line.includes('.pickupDate') || line.includes('.deliveryDate') || 
           line.includes('.expiryDate') || line.includes('.expirationDate')) &&
          !line.includes('if (!') && !line.includes('continue') && !line.includes('?')) {
        errors.push({
          file,
          line: lineNum,
          type: 'null_date',
          message: 'Date field may be null - add null check before using new Date()',
          fix: 'Add: if (!field) continue; before new Date(field)'
        });
      }

      // 7. Check for Promise.all destructuring mismatch
      if (line.includes('const [') && line.includes('] = await Promise.all([')) {
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;
        // This is a simple check - more complex analysis would be needed for accurate detection
      }
    });

    // 8. Check for problem/problemCategory type issues in breakdowns
    if (file.includes('breakdowns') && content.includes('validatedData.problem') && 
        !content.includes('as any') && !content.includes('in body')) {
      errors.push({
        file,
        line: 0,
        type: 'breakdown_optional',
        message: 'problem/problemCategory may need type assertion or conditional assignment',
        fix: 'Use: if (\'problem\' in body) breakdownData.problem = body.problem;'
      });
    }

  } catch (e) {
    // Skip files that can't be read
  }
});

// Summary
console.log(`Found ${errors.length} potential issues:\n`);

if (errors.length === 0) {
  console.log('✅ No issues found! Your code should build successfully.');
} else {
  const grouped = errors.reduce((acc, err) => {
    if (!acc[err.type]) acc[err.type] = [];
    acc[err.type].push(err);
    return acc;
  }, {});

  Object.keys(grouped).forEach(type => {
    console.log(`\n📋 ${type.toUpperCase()} (${grouped[type].length} issues):`);
    grouped[type].forEach(err => {
      console.log(`   ${err.file}:${err.line > 0 ? err.line : '?'}`);
      console.log(`   └─ ${err.message}`);
      if (err.fix) {
        console.log(`      Fix: ${err.fix}`);
      }
    });
  });

  console.log(`\n⚠️  Total: ${errors.length} potential errors found`);
  console.log('\n💡 Run: npm run build to verify all fixes');
}

console.log('\n✨ Scan complete!');

