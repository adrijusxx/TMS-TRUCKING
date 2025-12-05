# Check when PROJECT-CONTEXT.md was last updated and remind if stale

$CONTEXT_FILE = "PROJECT-CONTEXT.md"

Write-Host ""
Write-Host "================================================================" -ForegroundColor White
Write-Host "  PROJECT-CONTEXT.md Update Check" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor White
Write-Host ""

# Check if file exists
if (-not (Test-Path $CONTEXT_FILE)) {
    Write-Host "ERROR: $CONTEXT_FILE not found!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Get last commit date for the file
try {
    $lastUpdate = git log -1 --format=%cd --date=short -- $CONTEXT_FILE 2>$null
    
    if ([string]::IsNullOrEmpty($lastUpdate)) {
        Write-Host "WARNING: Could not determine last update date" -ForegroundColor Yellow
        Write-Host "   (File may not be committed yet)" -ForegroundColor Gray
        Write-Host ""
        exit 0
    }
    
    # Calculate days since last update
    $lastUpdateDate = [DateTime]::ParseExact($lastUpdate, "yyyy-MM-dd", $null)
    $today = Get-Date
    $daysSince = ($today - $lastUpdateDate).Days
    
    Write-Host "Last Updated: $lastUpdate ($daysSince days ago)" -ForegroundColor Cyan
    Write-Host ""
    
    # Determine status and recommendations
    if ($daysSince -lt 7) {
        Write-Host "Status: UP TO DATE" -ForegroundColor Green
        Write-Host "   Great! Context document is fresh." -ForegroundColor Gray
        
    } elseif ($daysSince -lt 30) {
        Write-Host "Status: COULD USE UPDATE" -ForegroundColor Yellow
        Write-Host "   Consider reviewing:" -ForegroundColor Gray
        Write-Host "   - Current Goals and Priorities" -ForegroundColor Gray
        Write-Host "   - Recent Changes section" -ForegroundColor Gray
        
    } elseif ($daysSince -lt 90) {
        Write-Host "Status: NEEDS UPDATE" -ForegroundColor Red
        Write-Host ""
        Write-Host "   It has been over a month! Please update:" -ForegroundColor Gray
        Write-Host "   - Current Goals and Priorities" -ForegroundColor Gray
        Write-Host "   - Recent Changes and Cleanup" -ForegroundColor Gray
        Write-Host "   - Known Issues and Technical Debt" -ForegroundColor Gray
        Write-Host "   - Tech Stack versions (if upgraded)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Quick Update: Open PROJECT-CONTEXT.md in your editor" -ForegroundColor Cyan
        
    } else {
        Write-Host "Status: CRITICALLY OUTDATED" -ForegroundColor Red
        Write-Host ""
        Write-Host "   PROJECT-CONTEXT.md is over 90 days old!" -ForegroundColor Red
        Write-Host "   This document is meant to be a living memory bank." -ForegroundColor Gray
        Write-Host ""
        Write-Host "   REQUIRED UPDATES:" -ForegroundColor Yellow
        Write-Host "   - Full review of all sections" -ForegroundColor Gray
        Write-Host "   - Update Current Goals and Priorities" -ForegroundColor Gray
        Write-Host "   - Document all Recent Changes" -ForegroundColor Gray
        Write-Host "   - Review Known Issues" -ForegroundColor Gray
        Write-Host "   - Check Tech Stack versions" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Time Required: ~15-20 minutes" -ForegroundColor Cyan
        Write-Host ""
    }
    
    # Check for uncommitted changes
    $gitDiff = git diff --quiet HEAD -- $CONTEXT_FILE 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Note: You have uncommitted changes to $CONTEXT_FILE" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "================================================================" -ForegroundColor White
    Write-Host ""
    
    # Exit with appropriate code
    if ($daysSince -gt 90) {
        exit 2  # Critical
    } elseif ($daysSince -gt 30) {
        exit 1  # Warning
    } else {
        exit 0  # OK
    }
    
} catch {
    Write-Host "Error checking git history: $_" -ForegroundColor Yellow
    Write-Host "   Make sure git is installed and the file is committed." -ForegroundColor Gray
    Write-Host ""
    exit 1
}
