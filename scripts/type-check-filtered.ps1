# TypeScript type checking with validator.ts errors filtered out (PowerShell version)
# This script runs tsc but filters out errors from the generated validator.ts file

Write-Host "🔍 Running TypeScript type check (excluding validator.ts)...`n" -ForegroundColor Cyan

try {
    # Run tsc and capture output
    $output = npx tsc --noEmit --pretty false 2>&1 | Out-String
    
    # Filter out validator.ts errors
    $lines = $output -split "`n"
    $filteredLines = $lines | Where-Object { 
        $_ -notmatch '\.next/dev/types/validator\.ts'
    }
    
    # Count errors
    $errorLines = $filteredLines | Where-Object { $_ -match 'error TS' }
    $validatorErrors = $lines | Where-Object { $_ -match '\.next/dev/types/validator\.ts' }
    
    if ($validatorErrors.Count -gt 0) {
        Write-Host "⚠️  Filtered out $($validatorErrors.Count) errors from validator.ts (generated file)`n" -ForegroundColor Yellow
    }
    
    # Output filtered errors
    if ($filteredLines.Count -gt 0 -and ($filteredLines | Where-Object { $_.Trim() -ne '' }).Count -gt 0) {
        Write-Host ($filteredLines -join "`n")
    }
    
    if ($errorLines.Count -gt 0) {
        Write-Host "`n❌ Found $($errorLines.Count) TypeScript errors (excluding validator.ts)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "`n✅ No TypeScript errors found!" -ForegroundColor Green
        exit 0
    }
} catch {
    # If tsc command fails, try to parse the error
    $errorOutput = $_.Exception.Message
    $lines = $errorOutput -split "`n"
    $filteredLines = $lines | Where-Object { 
        $_ -notmatch '\.next/dev/types/validator\.ts'
    }
    
    if ($filteredLines.Count -gt 0) {
        Write-Host ($filteredLines -join "`n")
        exit 1
    } else {
        Write-Host "✅ No TypeScript errors found (excluding validator.ts)!" -ForegroundColor Green
        exit 0
    }
}


