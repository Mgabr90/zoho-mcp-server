#!/bin/bash

# Railway Deployment Script for Zoho MCP Server + AnythingLLM
# This script automates the deployment process to Railway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check if user is logged in to Railway
check_railway_auth() {
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway. Please login first:"
        echo "railway login"
        exit 1
    fi
    print_success "Logged in to Railway"
}

# Validate environment variables
validate_env_vars() {
    local required_vars=(
        "ZOHO_CLIENT_ID"
        "ZOHO_CLIENT_SECRET"
        "ZOHO_REFRESH_TOKEN"
        "ZOHO_BOOKS_ORGANIZATION_ID"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Missing required environment variable: $var"
            exit 1
        fi
    done
    print_success "All required environment variables are set"
}

# Build the application
build_app() {
    print_status "Building the application..."
    npm run build
    print_success "Application built successfully"
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    # Set environment variables
    railway variables set ZOHO_CLIENT_ID="$ZOHO_CLIENT_ID"
    railway variables set ZOHO_CLIENT_SECRET="$ZOHO_CLIENT_SECRET"
    railway variables set ZOHO_REFRESH_TOKEN="$ZOHO_REFRESH_TOKEN"
    railway variables set ZOHO_DATA_CENTER="${ZOHO_DATA_CENTER:-com}"
    railway variables set ZOHO_BOOKS_ORGANIZATION_ID="$ZOHO_BOOKS_ORGANIZATION_ID"
    railway variables set NODE_ENV="production"
    railway variables set MULTI_CONFIG_ENABLED="true"
    railway variables set MULTI_CONFIG_ENVIRONMENT="production"
    railway variables set LOG_LEVEL="${LOG_LEVEL:-info}"
    
    # Deploy
    railway up
    
    print_success "Deployed to Railway successfully"
}

# Get the deployed URL
get_deployed_url() {
    print_status "Getting deployed URL..."
    local url=$(railway domain)
    if [ -n "$url" ]; then
        print_success "Your application is deployed at: $url"
        echo "Zoho MCP Server URL: $url"
        echo "Health check: $url/health"
    else
        print_warning "Could not get deployed URL. Check Railway dashboard."
    fi
}

# Main deployment function
main() {
    print_status "Starting Railway deployment..."
    
    # Pre-flight checks
    check_railway_cli
    check_railway_auth
    validate_env_vars
    
    # Build and deploy
    build_app
    deploy_to_railway
    get_deployed_url
    
    print_success "Deployment completed successfully!"
    print_status "Next steps:"
    echo "1. Configure AnythingLLM with the MCP server URL"
    echo "2. Test the integration"
    echo "3. Set up monitoring and alerts"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 