// Comprehensive error scanner for TMS project
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Scanning for potential TypeScript/Next.js errors...\n');

const errors = [];

// 1. Check for distance field in Prisma selects
function findDistanceInSelects(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      findDistanceInSelects(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const allFiles = findDistanceInSelects('./app');
const allLibFiles = findDistanceInSelects('./lib');

[...allFiles, ...allLibFiles].forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for distance in select statements
    if (content.includes('distance: true') || content.includes('distance: true,')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('distance: true')) {
          errors.push({
            file,
            line: index + 1,
            type: 'distance_field',
            message: `Found 'distance: true' in select statement (Load model doesn't have distance field)`,
            code: line.trim()
          });
        }
      });
    }
    
    // Check for load.distance usage
    if (content.includes('load.distance') || content.includes('loads') && content.includes('.distance')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('load.distance') || (line.includes('load') && line.includes('.distance') && !line.includes('totalDistance'))) {
          errors.push({
            file,
            line: index + 1,
            type: 'distance_property',
            message: `Found reference to load.distance property (doesn't exist, use route.totalDistance or totalMiles)`,
            code: line.trim()
          });
        }
      });
    }
    
    // Check for old params pattern (should be Promise)
    if (content.includes('{ params }: { params: { id: string } }') && 
        !content.includes('Promise<{ id: string }>') &&
        file.includes('[id]')) {
      errors.push({
        file,
        line: 0,
        type: 'params_promise',
        message: `Route handler may need Promise<{ id: string }> instead of { id: string }`,
        code: 'Check params type'
      });
    }
    
    // Check for error.errors (should be error.issues for Zod)
    if (content.includes('error.errors') && content.includes('z.ZodError')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('error.errors') && content.includes('ZodError')) {
          errors.push({
            file,
            line: index + 1,
            type: 'zod_error',
            message: `Zod v4 uses error.issues instead of error.errors`,
            code: line.trim()
          });
        }
      });
    }
  } catch (e) {
    // Skip files that can't be read
  }
});

console.log(`Found ${errors.length} potential issues:\n`);

if (errors.length === 0) {
  console.log('✅ No issues found!');
} else {
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.type.toUpperCase()}`);
    console.log(`   File: ${error.file}`);
    if (error.line > 0) {
      console.log(`   Line: ${error.line}`);
    }
    console.log(`   Issue: ${error.message}`);
    if (error.code) {
      console.log(`   Code: ${error.code}`);
    }
    console.log('');
  });
}

// Also check the specific file mentioned in error
const fuelFile = './app/api/analytics/fuel/route.ts';
if (fs.existsSync(fuelFile)) {
  const content = fs.readFileSync(fuelFile, 'utf8');
  if (content.includes('distance: true')) {
    console.log('⚠️  WARNING: fuel/route.ts still contains distance: true');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('distance: true')) {
        console.log(`   Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
}

