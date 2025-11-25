// TypeScript type checking with validator.ts errors filtered out
// This script runs tsc but filters out errors from the generated validator.ts file

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running TypeScript type check (excluding validator.ts)...\n');

try {
  // Run tsc and capture output
  const output = execSync('npx tsc --noEmit --pretty false', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ No TypeScript errors found!');
  process.exit(0);
} catch (error) {
  const output = error.stdout?.toString() || error.stderr?.toString() || '';
  const lines = output.split('\n');
  
  // Filter out validator.ts errors
  const filteredLines = lines.filter(line => {
    // Exclude validator.ts errors
    if (line.includes('.next/dev/types/validator.ts')) {
      return false;
    }
    // Keep everything else
    return true;
  });
  
  if (filteredLines.length === 0 || filteredLines.every(line => line.trim() === '')) {
    console.log('✅ No TypeScript errors found (excluding validator.ts)!');
    process.exit(0);
  }
  
  // Count errors
  const errorLines = filteredLines.filter(line => line.includes('error TS'));
  const validatorErrors = lines.filter(line => line.includes('.next/dev/types/validator.ts'));
  
  if (validatorErrors.length > 0) {
    console.log(`⚠️  Filtered out ${validatorErrors.length} errors from validator.ts (generated file)\n`);
  }
  
  // Output filtered errors
  console.log(filteredLines.join('\n'));
  
  if (errorLines.length > 0) {
    console.log(`\n❌ Found ${errorLines.length} TypeScript errors (excluding validator.ts)`);
    process.exit(1);
  } else {
    console.log('\n✅ No TypeScript errors found!');
    process.exit(0);
  }
}


