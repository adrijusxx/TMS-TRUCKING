# deploy-to-vm.ps1$123
# Usage: .\deploy-to-vm.ps1 "Your commit message"

param(
    [string]$CommitMessage = "Deploy to VM"
)

$VM_USER = "telegram-userbot-vm"
$VM_IP = "34.121.40.233"
$VM_PATH = "/home/telegram-userbot-vm/TMS-TRUCKING"

Write-Host "Building locally..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing to git..." -ForegroundColor Yellow
git add .
$commitResult = git commit -m $CommitMessage 2>&1
if ($LASTEXITCODE -eq 0) {
    git push
} else {
    Write-Host "Nothing to commit or commit failed - this is OK" -ForegroundColor Yellow
}

Write-Host "Transferring .next to VM..." -ForegroundColor Yellow

# Fix SSH config permissions
$sshConfigPath = "$env:USERPROFILE\.ssh\config"
if (Test-Path $sshConfigPath) {
    try {
        $acl = Get-Acl $sshConfigPath
        $acl.SetAccessRuleProtection($true, $false)
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
        $acl.SetAccessRule($rule)
        Set-Acl $sshConfigPath $acl
        Write-Host "Fixed SSH config permissions" -ForegroundColor Green
    } catch {
        Write-Host "Could not fix SSH config automatically. Run manually:" -ForegroundColor Yellow
        Write-Host "icacls `"$env:USERPROFILE\.ssh\config`" /inheritance:r /grant `${env:USERNAME}:F" -ForegroundColor Cyan
    }
}

$scpCommand = "scp"
$scpArgs = @(
    "-r",
    ".next\*",
    "${VM_USER}@${VM_IP}:${VM_PATH}/.next/"
)

try {
    & $scpCommand $scpArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Transfer failed. Make sure:" -ForegroundColor Red
        Write-Host "  1. OpenSSH client is installed" -ForegroundColor Yellow
        Write-Host "  2. VM_PATH is correct: $VM_PATH" -ForegroundColor Yellow
        Write-Host "  3. SSH key is set up" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "scp not found. Install OpenSSH Client" -ForegroundColor Red
    exit 1
}

Write-Host "Done! Now SSH to VM and run: npm start" -ForegroundColor Green