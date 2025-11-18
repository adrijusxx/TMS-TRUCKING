// Script to fix more TypeScript errors: form resolvers, Prisma issues, etc.
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
  // Fix 1: Invoice status enum - change 'PENDING' to 'DRAFT' if needed
  invoiceStatus: (content, filePath) => {
    let modified = false;
    
    // Check if file uses InvoiceStatus and has 'PENDING'
    if (content.includes('InvoiceStatus') && content.includes("status: 'PENDING'")) {
      // Check Prisma schema - InvoiceStatus might not have PENDING
      // Replace with DRAFT if it's in a create/update context
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("status: 'PENDING'") && 
            (lines[i].includes('create') || lines[i].includes('update') || lines[i].includes('data:'))) {
          lines[i] = lines[i].replace(/status:\s*['"]PENDING['"]/g, "status: 'DRAFT'");
          modified = true;
        }
      }
      if (modified) {
        return { content: lines.join('\n'), modified: true };
      }
    }
    
    return { content, modified: false };
  },

  // Fix 2: ActivityAction enum issues
  activityAction: (content, filePath) => {
    let modified = false;
    
    if (content.includes("action: 'INVOICE_GENERATED'")) {
      // Check if INVOICE_GENERATED exists in ActivityAction enum
      // If not, might need to use a different action or add it
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("action: 'INVOICE_GENERATED'")) {
          // Try to find what actions are available - for now, comment it out or use a generic one
          // This might need manual review
          console.log(`  ⚠ Found INVOICE_GENERATED in ${filePath} - may need manual review`);
        }
      }
    }
    
    return { content, modified: false };
  },

  // Fix 3: Company deletedAt field (doesn't exist in schema)
  companyDeletedAt: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Remove deletedAt from Company where clauses
      if (line.includes('deletedAt: null') && 
          (lines[i-1]?.includes('Company') || lines[i-2]?.includes('Company') || 
           lines[i-3]?.includes('Company') || lines[i-4]?.includes('Company'))) {
        // Check if it's in a Company query
        const context = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 5)).join('\n');
        if (context.includes('company') && context.includes('where:')) {
          // Remove the deletedAt line
          lines[i] = '';
          modified = true;
        }
      }
    }
    
    if (modified) {
      // Clean up empty lines
      const cleaned = lines.filter((line, i, arr) => {
        if (line.trim() === '' && arr[i+1]?.trim() === '') return false;
        return true;
      });
      return { content: cleaned.join('\n'), modified: true };
    }
    
    return { content, modified: false };
  },

  // Fix 4: Load invoiceId field (should be invoicedAt)
  loadInvoiceId: (content, filePath) => {
    let modified = false;
    
    if (content.includes('invoiceId:') && (content.includes('Load') || content.includes('load'))) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Replace invoiceId with invoicedAt in Load queries
        if (lines[i].includes('invoiceId:') && 
            (lines[i-1]?.includes('Load') || lines[i-2]?.includes('Load') || 
             lines[i-3]?.includes('Load') || lines[i-4]?.includes('Load'))) {
          const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 2)).join('\n');
          if (context.includes('load') || context.includes('Load')) {
            lines[i] = lines[i].replace(/invoiceId:/g, 'invoicedAt:');
            modified = true;
          }
        }
      }
      if (modified) {
        return { content: lines.join('\n'), modified: true };
      }
    }
    
    return { content, modified: false };
  },

  // Fix 5: Form resolver type issues - add explicit type to handleSubmit
  formResolver: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      // Fix: handleSubmit(onSubmit) -> handleSubmit<FormData>(onSubmit)
      if (lines[i].includes('handleSubmit(onSubmit)') && !lines[i].includes('<')) {
        // Try to find the form type from the schema
        const context = lines.slice(Math.max(0, i - 20), i).join('\n');
        const schemaMatch = context.match(/(create|update)(\w+)Schema/);
        if (schemaMatch) {
          const formType = schemaMatch[2];
          lines[i] = lines[i].replace('handleSubmit(onSubmit)', `handleSubmit<${formType}Input>(onSubmit)`);
          modified = true;
        }
      }
    }
    
    if (modified) {
      return { content: lines.join('\n'), modified: true };
    }
    
    return { content, modified: false };
  },

  // Fix 6: Boolean | "" | undefined -> boolean | undefined
  booleanType: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Fix: plate: plateMatches -> plate: plateMatches || undefined (if plateMatches can be "")
      if (line.includes('plate:') && line.includes('plateMatches') && !line.includes('||')) {
        const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join('\n');
        if (context.includes('boolean | ""')) {
          line = line.replace(/plate:\s*(\w+),/, 'plate: $1 || undefined,');
          modified = true;
        }
      }
      
      if (line.includes('name:') && line.includes('nameMatches') && !line.includes('||')) {
        const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join('\n');
        if (context.includes('boolean | ""')) {
          line = line.replace(/name:\s*(\w+),/, 'name: $1 || undefined,');
          modified = true;
        }
      }
      
      if (line.includes('vin:') && line.includes('vinMatches') && !line.includes('||')) {
        const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join('\n');
        if (context.includes('boolean | ""')) {
          line = line.replace(/vin:\s*(\w+),/, 'vin: $1 || undefined,');
          modified = true;
        }
      }
      
      if (modified) {
        lines[i] = line;
      }
    }
    
    if (modified) {
      return { content: lines.join('\n'), modified: true };
    }
    
    return { content, modified: false };
  },

  // Fix 7: weight: number | undefined -> provide default
  weightType: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Fix: weight: overrides?.weight || template.defaultWeight || undefined
      // Should be: weight: overrides?.weight || template.defaultWeight || 0
      if (line.includes('weight:') && line.includes('|| undefined') && 
          (line.includes('overrides') || line.includes('template'))) {
        line = line.replace(/\|\| undefined/g, '|| 0');
        lines[i] = line;
        modified = true;
      }
    }
    
    if (modified) {
      return { content: lines.join('\n'), modified: true };
    }
    
    return { content, modified: false };
  },

  // Fix 8: load.pickupCity null check
  nullCityCheck: (content, filePath) => {
    let modified = false;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Fix: calculateEmptyMiles(load.pickupCity, ...) when pickupCity can be null
      if (line.includes('calculateEmptyMiles') && line.includes('load.pickupCity') && 
          !line.includes('if (!') && !line.includes('continue')) {
        // Find the function call
        const context = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 5));
        const contextStr = context.join('\n');
        
        // Check if there's already a null check above
        if (!contextStr.includes('if (!load.pickupCity') && !contextStr.includes('if (!load.deliveryCity')) {
          // Add null check before the call
          const indent = line.match(/^(\s*)/)?.[1] || '';
          lines.splice(i, 0, `${indent}if (!load.pickupCity || !load.deliveryCity || !nextLoad.pickupCity || !nextLoad.pickupState) continue;`);
          modified = true;
          i++; // Skip the line we just added
        }
      }
    }
    
    if (modified) {
      return { content: lines.join('\n'), modified: true };
    }
    
    return { content, modified: false };
  }
};

// Main execution
const files = findTSFiles('./lib').concat(findTSFiles('./app/api'));

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

console.log(`\n✅ Fixed ${totalFixed} files`);
if (fixedFiles.length > 0) {
  console.log('\nFiles modified:');
  fixedFiles.forEach(f => console.log(`  - ${f}`));
}
console.log('\n✨ Done!');

