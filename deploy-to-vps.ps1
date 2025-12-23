# Agent Expense Tracker - Deploy to VPS
# PowerShell script to deploy to Contabo VPS

$VPS_IP = "213.136.74.135"
$VPS_USER = "root"
$APP_DIR = "/opt/agent-expense-tracker"

Write-Host "=== Agent Expense Tracker VPS Deployment ===" -ForegroundColor Green

# Check if ssh is available
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "SSH is not installed. Please install OpenSSH." -ForegroundColor Red
    exit 1
}

# Create archive of the project (excluding node_modules, .next)
Write-Host "Creating deployment archive..." -ForegroundColor Yellow
$excludeFiles = @(
    "node_modules",
    ".next",
    ".git",
    "data"
)

$currentDir = Get-Location
$archivePath = Join-Path $currentDir "deploy.tar.gz"

# Use tar if available, otherwise use 7z or built-in compression
if (Get-Command tar -ErrorAction SilentlyContinue) {
    $excludeArgs = $excludeFiles | ForEach-Object { "--exclude=$_" }
    tar -czf deploy.tar.gz $excludeArgs .
} else {
    Write-Host "Please install tar or manually transfer files" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading to VPS..." -ForegroundColor Yellow

# Create remote directory and upload
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $APP_DIR"
scp deploy.tar.gz "${VPS_USER}@${VPS_IP}:${APP_DIR}/"

Write-Host "Installing on VPS..." -ForegroundColor Yellow

# SSH commands to setup the application
$sshCommands = @"
cd $APP_DIR
tar -xzf deploy.tar.gz
rm deploy.tar.gz

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
npm install -g pm2

# Install dependencies
npm install

# Build application
npm run build

# Create data directory
mkdir -p data

# Start with PM2
pm2 delete agent-expense-tracker 2>/dev/null || true
pm2 start npm --name "agent-expense-tracker" -- start
pm2 save

echo "Deployment complete!"
"@

ssh "${VPS_USER}@${VPS_IP}" $sshCommands

# Cleanup local archive
Remove-Item deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Application deployed to: https://exp.codershive.in" -ForegroundColor Cyan
Write-Host "Default credentials: admin / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Configure Nginx with SSL (see nginx.conf)" -ForegroundColor White
Write-Host "2. Update .env.local with Google Sheets credentials" -ForegroundColor White
Write-Host "3. Import n8n-workflow.json to your n8n instance" -ForegroundColor White
