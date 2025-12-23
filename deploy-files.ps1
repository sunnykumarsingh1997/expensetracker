# Deployment Script for VPS
$server = "213.136.74.135"
$user = "root"
$password = "R793gCeQpHx5YMKL"
$remotePath = "/opt/agent-expense-tracker"
$localPath = $PSScriptRoot

# Files to deploy (excluding node_modules and .env.local)
$filesToDeploy = @(
    "lib/types.ts",
    "lib/google-sheets.ts",
    "app/api/balance/route.ts",
    "app/balance/page.tsx"
)

Write-Host "Deploying updated files to VPS..." -ForegroundColor Cyan

foreach ($file in $filesToDeploy) {
    $localFile = Join-Path $localPath $file
    $remoteFile = "$remotePath/$file"
    $remoteDir = Split-Path $remoteFile -Parent

    Write-Host "Copying $file..." -ForegroundColor Yellow

    # Using scp - will prompt for password
    scp -o StrictHostKeyChecking=no "$localFile" "${user}@${server}:${remoteFile}"
}

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "Now restart the app on the server with: pm2 restart agent-expense-tracker" -ForegroundColor Cyan
