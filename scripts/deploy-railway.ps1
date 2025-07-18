# Railway Deployment Script for Zoho MCP Server + AnythingLLM (PowerShell)
# This script automates the deployment process to Railway

param(
    [string]$ZohoClientId,
    [string]$ZohoClientSecret,
    [string]$ZohoRefreshToken,
    [string]$ZohoBooksOrgId,
    [string]$ZohoDataCenter = "com",
    [string]$LogLevel = "info"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Railway CLI is installed
function Test-RailwayCLI {
    try {
        $null = Get-Command railway -ErrorAction Stop
        Write-Success "Railway CLI is installed"
        return $true
    }
    catch {
        Write-Error "Railway CLI is not installed. Please install it first:"
        Write-Host "npm install -g @railway/cli" -ForegroundColor Cyan
        return $false
    }
}

# Check if user is logged in to Railway
function Test-RailwayAuth {
    try {
        $null = railway whoami 2>$null
        Write-Success "Logged in to Railway"
        return $true
    }
    catch {
        Write-Error "Not logged in to Railway. Please login first:"
        Write-Host "railway login" -ForegroundColor Cyan
        return $false
    }
}

# Validate environment variables
function Test-EnvironmentVariables {
    $requiredVars = @(
        "ZohoClientId",
        "ZohoClientSecret", 
        "ZohoRefreshToken",
        "ZohoBooksOrgId"
    )
    
    foreach ($var in $requiredVars) {
        if ([string]::IsNullOrEmpty((Get-Variable $var -ErrorAction SilentlyContinue).Value)) {
            Write-Error "Missing required parameter: $var"
            return $false
        }
    }
    Write-Success "All required parameters are provided"
    return $true
}

# Build the application
function Build-App {
    Write-Status "Building the application..."
    try {
        npm run build
        Write-Success "Application built successfully"
        return $true
    }
    catch {
        Write-Error "Failed to build application"
        return $false
    }
}

# Deploy to Railway
function Deploy-ToRailway {
    Write-Status "Deploying to Railway..."
    
    try {
        # Set environment variables
        railway variables set ZOHO_CLIENT_ID="$ZohoClientId"
        railway variables set ZOHO_CLIENT_SECRET="$ZohoClientSecret"
        railway variables set ZOHO_REFRESH_TOKEN="$ZohoRefreshToken"
        railway variables set ZOHO_DATA_CENTER="$ZohoDataCenter"
        railway variables set ZOHO_BOOKS_ORGANIZATION_ID="$ZohoBooksOrgId"
        railway variables set NODE_ENV="production"
        railway variables set MULTI_CONFIG_ENABLED="true"
        railway variables set MULTI_CONFIG_ENVIRONMENT="production"
        railway variables set LOG_LEVEL="$LogLevel"
        
        # Deploy
        railway up
        
        Write-Success "Deployed to Railway successfully"
        return $true
    }
    catch {
        Write-Error "Failed to deploy to Railway"
        return $false
    }
}

# Get the deployed URL
function Get-DeployedUrl {
    Write-Status "Getting deployed URL..."
    try {
        $url = railway domain
        if ($url) {
            Write-Success "Your application is deployed at: $url"
            Write-Host "Zoho MCP Server URL: $url" -ForegroundColor Cyan
            Write-Host "Health check: $url/health" -ForegroundColor Cyan
        }
        else {
            Write-Warning "Could not get deployed URL. Check Railway dashboard."
        }
    }
    catch {
        Write-Warning "Could not get deployed URL"
    }
}

# Main deployment function
function Start-Deployment {
    Write-Status "Starting Railway deployment..."
    
    # Pre-flight checks
    if (-not (Test-RailwayCLI)) { return }
    if (-not (Test-RailwayAuth)) { return }
    if (-not (Test-EnvironmentVariables)) { return }
    
    # Build and deploy
    if (-not (Build-App)) { return }
    if (-not (Deploy-ToRailway)) { return }
    Get-DeployedUrl
    
    Write-Success "Deployment completed successfully!"
    Write-Status "Next steps:"
    Write-Host "1. Configure AnythingLLM with the MCP server URL" -ForegroundColor Cyan
    Write-Host "2. Test the integration" -ForegroundColor Cyan
    Write-Host "3. Set up monitoring and alerts" -ForegroundColor Cyan
}

# Run deployment if script is executed directly
if ($MyInvocation.InvocationName -ne '.') {
    Start-Deployment
} 