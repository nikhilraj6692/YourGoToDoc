#!/bin/bash

# MediConnect Railway Deployment Script
# Includes Vault integration for secure secrets management

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Railway CLI is installed
check_railway() {
    if command_exists railway; then
        return 0
    else
        return 1
    fi
}

# Function to display help
show_help() {
    echo "MediConnect Railway Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --service SERVICE    Service to deploy (backend|frontend|both)"
    echo "  -e, --environment ENV    Environment (dev|prod)"
    echo "  -v, --vault              Set up Vault (environment variables)"
    echo "  -d, --domain DOMAIN      Custom domain to configure"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Services:"
    echo "  backend                  Deploy only backend service"
    echo "  frontend                 Deploy only frontend service"
    echo "  both                     Deploy both services (default)"
    echo ""
    echo "Environments:"
    echo "  dev                      Development environment"
    echo "  prod                     Production environment (default)"
    echo ""
    echo "Examples:"
    echo "  $0                       # Deploy both services to production"
    echo "  $0 -s backend -e dev     # Deploy backend to development"
    echo "  $0 -v -d myapp.com       # Set up Vault and custom domain"
}

# Function to install Railway CLI
install_railway() {
    print_status "Installing Railway CLI..."
    
    if command_exists npm; then
        npm install -g @railway/cli
        print_success "Railway CLI installed successfully!"
    else
        print_error "npm is required to install Railway CLI"
        print_status "Please install Node.js and npm first"
        exit 1
    fi
}

# Function to setup Vault (environment variables)
setup_vault() {
    local env=$1
    
    print_status "Setting up Vault (environment variables) for $env environment..."
    
    # Check if user is logged in
    if ! railway whoami >/dev/null 2>&1; then
        print_error "You must be logged in to Railway first"
        print_status "Run: railway login"
        exit 1
    fi
    
    # Required variables
    local vars=(
        "MONGODB_URI"
        "JWT_SECRET"
        "S3_BUCKET_NAME"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "CORS_ALLOWED_ORIGINS"
        "REACT_APP_API_URL"
        "REACT_APP_WS_URL"
        "SERVER_PORT"
        "SERVER_CONTEXT_PATH"
        "ENVIRONMENT"
    )
    
    print_status "Setting up environment variables..."
    print_warning "You will be prompted to enter values for each variable"
    echo ""
    
    for var in "${vars[@]}"; do
        echo -n "Enter value for $var: "
        read -r value
        
        if [ -n "$value" ]; then
            railway variables set "$var=$value"
            print_success "Set $var"
        else
            print_warning "Skipped $var (empty value)"
        fi
    done
    
    # Optional variables
    local optional_vars=(
        "JWT_ACCESS_TOKEN_EXPIRATION=15"
        "JWT_REFRESH_TOKEN_EXPIRATION=7"
        "AWS_REGION=us-east-1"
        "LOG_LEVEL=INFO"
        "ENABLE_HTTPS=true"
        "ENABLE_HEALTH_CHECK=true"
        "ENABLE_COMPRESSION=true"
        "ENABLE_CACHING=true"
        "RATE_LIMIT_REQUESTS_PER_MINUTE=100"
        "MAX_FILE_SIZE=10"
        "ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx"
    )
    
    print_status "Setting up optional environment variables..."
    for var in "${optional_vars[@]}"; do
        railway variables set "$var"
        print_success "Set $var"
    done
    
    print_success "Vault setup completed successfully!"
}

# Function to deploy backend
deploy_backend() {
    local env=$1
    
    print_status "Deploying backend service for $env environment..."
    
    # Check if we're in the right directory
    if [ ! -f "railway.json" ] || [ ! -f "nixpacks.toml" ]; then
        print_error "Backend configuration files not found"
        print_status "Make sure you're in the project root directory"
        exit 1
    fi
    
    # Deploy backend
    print_status "Building and deploying backend..."
    railway up --service backend
    
    # Wait for deployment
    print_status "Waiting for backend deployment to complete..."
    sleep 30
    
    # Check health
    print_status "Checking backend health..."
    if railway status --service backend | grep -q "Deployed"; then
        print_success "Backend deployed successfully!"
        
        # Get the URL
        local backend_url=$(railway status --service backend | grep "URL" | awk '{print $2}')
        if [ -n "$backend_url" ]; then
            print_status "Backend URL: $backend_url"
            print_status "Health check: $backend_url/api/actuator/health"
        fi
    else
        print_error "Backend deployment failed"
        print_status "Check logs with: railway logs --service backend"
        exit 1
    fi
}

# Function to deploy frontend
deploy_frontend() {
    local env=$1
    
    print_status "Deploying frontend service for $env environment..."
    
    # Check if we're in the right directory
    if [ ! -d "mediconnect-ui" ]; then
        print_error "Frontend directory not found"
        print_status "Make sure you're in the project root directory"
        exit 1
    fi
    
    # Navigate to frontend directory
    cd mediconnect-ui
    
    # Check if Railway config exists
    if [ ! -f "railway.json" ] || [ ! -f "nixpacks.toml" ]; then
        print_error "Frontend Railway configuration not found"
        exit 1
    fi
    
    # Deploy frontend
    print_status "Building and deploying frontend..."
    railway up --service frontend
    
    # Wait for deployment
    print_status "Waiting for frontend deployment to complete..."
    sleep 30
    
    # Check health
    print_status "Checking frontend health..."
    if railway status --service frontend | grep -q "Deployed"; then
        print_success "Frontend deployed successfully!"
        
        # Get the URL
        local frontend_url=$(railway status --service frontend | grep "URL" | awk '{print $2}')
        if [ -n "$frontend_url" ]; then
            print_status "Frontend URL: $frontend_url"
        fi
    else
        print_error "Frontend deployment failed"
        print_status "Check logs with: railway logs --service frontend"
        exit 1
    fi
    
    # Go back to root directory
    cd ..
}

# Function to configure custom domain
configure_domain() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        print_warning "No domain specified, skipping domain configuration"
        return
    fi
    
    print_status "Configuring custom domain: $domain"
    
    # This would typically be done through Railway dashboard
    # For now, we'll provide instructions
    print_status "To configure custom domain:"
    echo "1. Go to Railway dashboard"
    echo "2. Navigate to Settings → Domains"
    echo "3. Add custom domain: $domain"
    echo "4. Update DNS records as instructed"
    echo "5. SSL certificate will be automatically provisioned"
    
    print_warning "Domain configuration must be done manually in Railway dashboard"
}

# Function to validate inputs
validate_inputs() {
    local service=$1
    local env=$2
    
    # Validate service
    if [ "$service" != "backend" ] && [ "$service" != "frontend" ] && [ "$service" != "both" ]; then
        print_error "Invalid service: $service"
        print_status "Valid services: backend, frontend, both"
        exit 1
    fi
    
    # Validate environment
    if [ "$env" != "dev" ] && [ "$env" != "prod" ]; then
        print_error "Invalid environment: $env"
        print_status "Valid environments: dev, prod"
        exit 1
    fi
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "railway.json" ] && [ ! -d "mediconnect-ui" ]; then
        print_error "This script must be run from the MediConnect project root directory"
        print_status "Please navigate to the project root and try again"
        exit 1
    fi
}

# Main script
main() {
    # Default values
    SERVICE="both"
    ENVIRONMENT="prod"
    SETUP_VAULT=false
    CUSTOM_DOMAIN=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--vault)
                SETUP_VAULT=true
                shift
                ;;
            -d|--domain)
                CUSTOM_DOMAIN="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validate inputs
    validate_inputs "$SERVICE" "$ENVIRONMENT"
    
    # Check if we're in the right directory
    check_directory
    
    print_status "MediConnect Railway Deployment Script"
    print_status "Service: $SERVICE"
    print_status "Environment: $ENVIRONMENT"
    echo ""
    
    # Check if Railway CLI is installed
    if ! check_railway; then
        print_warning "Railway CLI not found"
        read -p "Would you like to install Railway CLI? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_railway
        else
            print_error "Railway CLI is required for deployment"
            exit 1
        fi
    fi
    
    # Check if user is logged in
    if ! railway whoami >/dev/null 2>&1; then
        print_error "You must be logged in to Railway first"
        print_status "Run: railway login"
        exit 1
    fi
    
    # Setup Vault if requested
    if [ "$SETUP_VAULT" = true ]; then
        setup_vault "$ENVIRONMENT"
        echo ""
    fi
    
    # Deploy services
    case $SERVICE in
        "backend")
            deploy_backend "$ENVIRONMENT"
            ;;
        "frontend")
            deploy_frontend "$ENVIRONMENT"
            ;;
        "both")
            deploy_backend "$ENVIRONMENT"
            echo ""
            deploy_frontend "$ENVIRONMENT"
            ;;
    esac
    
    # Configure custom domain if specified
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo ""
        configure_domain "$CUSTOM_DOMAIN"
    fi
    
    print_success "Deployment completed successfully!"
    
    # Show next steps
    echo ""
    print_status "Next steps:"
    echo "  - Check logs: railway logs"
    echo "  - View status: railway status"
    echo "  - Update variables: railway variables"
    echo "  - Scale services: railway scale"
    
    if [ "$SERVICE" = "both" ]; then
        echo ""
        print_status "Your application should be available at:"
        local backend_url=$(railway status --service backend 2>/dev/null | grep "URL" | awk '{print $2}')
        local frontend_url=$(railway status --service frontend 2>/dev/null | grep "URL" | awk '{print $2}')
        
        if [ -n "$backend_url" ]; then
            echo "  - Backend: $backend_url"
        fi
        if [ -n "$frontend_url" ]; then
            echo "  - Frontend: $frontend_url"
        fi
    fi
}

# Run main function with all arguments
main "$@" 