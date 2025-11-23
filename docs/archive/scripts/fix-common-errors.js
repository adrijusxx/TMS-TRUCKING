// Script to batch-fix common TypeScript errors
const fs = require('fs');
const path = require('path');

function findTSFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
          findTSFiles(filePath, fileList);
        } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.') && !file.includes('.spec.')) {
          fileList.push(filePath);
        }
      } catch (e) {}
    });
  } catch (e) {}
  return fileList;
}

const fixes = {
  // Fix 1: Status enum indexing with type assertions
  statusColors: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    // Patterns to fix: statusColors[entity.status] -> statusColors[entity.status as EnumType]
    const statusPatterns = [
      { pattern: /statusColors\[(\w+)\.status\]/g, replacement: (match, entity) => {
        // Determine enum type based on context
        if (filePath.includes('settlement')) return `statusColors[${entity}.status as SettlementStatus]`;
        if (filePath.includes('truck')) return `statusColors[${entity}.status as TruckStatus]`;
        if (filePath.includes('driver')) return `statusColors[${entity}.status as DriverStatus]`;
        if (filePath.includes('load')) return `statusColors[${entity}.status as LoadStatus]`;
        if (filePath.includes('invoice')) return `statusColors[${entity}.status as InvoiceStatus]`;
        return match; // Don't change if we can't determine
      }},
      { pattern: /statusColors\[(\w+)\]\./g, replacement: (match, status) => {
        // If it's already a variable, might need type assertion
        return match;
      }}
    ];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let changed = false;
      
      // Fix statusColors[entity.status] patterns
      if (line.includes('statusColors[') && line.includes('.status]') && !line.includes(' as ')) {
        if (filePath.includes('settlement')) {
          line = line.replace(/statusColors\[(\w+)\.status\]/g, 'statusColors[$1.status as SettlementStatus]');
          changed = true;
        } else if (filePath.includes('truck')) {
          line = line.replace(/statusColors\[(\w+)\.status\]/g, 'statusColors[$1.status as TruckStatus]');
          changed = true;
        } else if (filePath.includes('driver')) {
          line = line.replace(/statusColors\[(\w+)\.status\]/g, 'statusColors[$1.status as DriverStatus]');
          changed = true;
        } else if (filePath.includes('load')) {
          line = line.replace(/statusColors\[(\w+)\.status\]/g, 'statusColors[$1.status as LoadStatus]');
          changed = true;
        } else if (filePath.includes('invoice')) {
          line = line.replace(/statusColors\[(\w+)\.status\]/g, 'statusColors[$1.status as InvoiceStatus]');
          changed = true;
        }
      }
      
      if (changed) {
        lines[i] = line;
        modified = true;
      }
    }
    
    return { content: lines.join('\n'), modified };
  },

  // Fix 2: Add missing imports for enum types
  addEnumImports: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    // Check if file uses status enums but doesn't import them
    const needsSettlementStatus = content.includes('SettlementStatus') && !content.includes("from '@prisma/client'") && !content.includes("from \"@prisma/client\"");
    const needsTruckStatus = content.includes('TruckStatus') && !content.includes("from '@prisma/client'") && !content.includes("from \"@prisma/client\"");
    const needsDriverStatus = content.includes('DriverStatus') && !content.includes("from '@prisma/client'") && !content.includes("from \"@prisma/client\"");
    const needsLoadStatus = content.includes('LoadStatus') && !content.includes("from '@prisma/client'") && !content.includes("from \"@prisma/client\"");
    const needsInvoiceStatus = content.includes('InvoiceStatus') && !content.includes("from '@prisma/client'") && !content.includes("from \"@prisma/client\"");
    
    if (needsSettlementStatus || needsTruckStatus || needsDriverStatus || needsLoadStatus || needsInvoiceStatus) {
      // Find the last import statement
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith("import ")) {
          lastImportIndex = i;
        } else if (lastImportIndex >= 0 && lines[i].trim() === '') {
          break;
        }
      }
      
      if (lastImportIndex >= 0) {
        const enums = [];
        if (needsSettlementStatus) enums.push('SettlementStatus');
        if (needsTruckStatus) enums.push('TruckStatus');
        if (needsDriverStatus) enums.push('DriverStatus');
        if (needsLoadStatus) enums.push('LoadStatus');
        if (needsInvoiceStatus) enums.push('InvoiceStatus');
        
        if (enums.length > 0) {
          // Check if there's already a Prisma import
          let hasPrismaImport = false;
          let prismaImportIndex = -1;
          for (let i = 0; i <= lastImportIndex; i++) {
            if (lines[i].includes("@prisma/client")) {
              hasPrismaImport = true;
              prismaImportIndex = i;
              break;
            }
          }
          
          if (hasPrismaImport && prismaImportIndex >= 0) {
            // Add to existing import
            const importLine = lines[prismaImportIndex];
            if (importLine.includes('{')) {
              // Extract existing imports
              const match = importLine.match(/import\s+\{([^}]+)\}\s+from\s+['"]@prisma\/client['"]/);
              if (match) {
                const existing = match[1].split(',').map(s => s.trim()).filter(s => s);
                const allEnums = [...existing, ...enums].filter((v, i, a) => a.indexOf(v) === i);
                lines[prismaImportIndex] = `import { ${allEnums.join(', ')} } from '@prisma/client';`;
                modified = true;
              }
            }
          } else {
            // Add new import after last import
            lines.splice(lastImportIndex + 1, 0, `import { ${enums.join(', ')} } from '@prisma/client';`);
            modified = true;
          }
        }
      }
    }
    
    return { content: lines.join('\n'), modified };
  },

  // Fix 3: Fix null/undefined issues with optional chaining
  nullChecks: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let changed = false;
      
      // Fix: load.pickupCity -> load.pickupCity || ''
      // Only for function calls that expect string
      if (line.includes('load.pickupCity') && !line.includes('||') && !line.includes('?.') && 
          (line.includes('calculateEmptyMiles') || line.includes('('))) {
        // This is more complex, skip for now
      }
      
      // Fix: Convert empty string to null for optional fields
      if (line.includes('|| ""') && line.includes(':')) {
        // Check if it's in a data object
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
        if (context.includes('data:') || context.includes('update:') || context.includes('create:')) {
          line = line.replace(/\|\| ""/g, '|| null');
          changed = true;
        }
      }
      
      if (changed) {
        lines[i] = line;
        modified = true;
      }
    }
    
    return { content: lines.join('\n'), modified };
  }
};

// Main execution
const files = findTSFiles('./components').concat(findTSFiles('./lib')).concat(findTSFiles('./app'));

let totalFixed = 0;
const fixedFiles = [];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Apply all fixes
    for (const [fixName, fixFn] of Object.entries(fixes)) {
      const result = fixFn(content, file);
      content = result.content;
      if (result.modified) {
        modified = true;
        console.log(`  ✓ ${fixName} in ${file}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      fixedFiles.push(file);
      totalFixed++;
    }
  } catch (e) {
    console.error(`✗ Error processing ${file}:`, e.message);
  }
});

console.log(`\n✅ Fixed ${totalFixed} files:`);
fixedFiles.forEach(f => console.log(`  - ${f}`));
console.log('\n✨ Done!');

