#!/bin/bash

# Grand City Guest Pass System - Production Deployment Script
# Supports: Vercel, Heroku, Railway, Docker, and Manual deployment

set -e

echo "🚀 Grand City Guest Pass System - Production Deployment"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_status "Node.js $(node --version) detected"
}

# Install dependencies
install_deps() {
    print_step "Installing production dependencies..."
    npm ci --only=production
    print_status "Dependencies installed successfully"
}

# Build the application
build_app() {
    print_step "Building application..."
    
    # Create production build directory
    mkdir -p dist
    
    # Copy essential files
    cp guest-pass-system.html dist/index.html
    cp server-prod.js dist/server.js
    cp package.json dist/
    cp .env.production dist/.env
    
    # Create logs directory
    mkdir -p dist/logs
    
    print_status "Build completed successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_step "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_status "Starting Vercel deployment..."
    vercel --prod --yes
    
    print_status "Vercel deployment completed!"
}

# Deploy to Heroku
deploy_heroku() {
    print_step "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_warning "Heroku CLI not found. Installing..."
        npm install -g heroku
    fi
    
    # Check if Heroku app exists
    if ! heroku apps:info &> /dev/null; then
        print_warning "No Heroku app found. Creating new app..."
        read -p "Enter app name (or press Enter for auto-generated): " app_name
        
        if [ -n "$app_name" ]; then
            heroku create "$app_name"
        else
            heroku create
        fi
    fi
    
    print_status "Deploying to Heroku..."
    git add . && git commit -m "Production deployment $(date +%Y%m%d_%H%M%S)"
    git push heroku main
    
    print_status "Heroku deployment completed!"
}

# Deploy to Railway
deploy_railway() {
    print_step "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    print_status "Starting Railway deployment..."
    railway login
    railway up
    
    print_status "Railway deployment completed!"
}

# Deploy with Docker
deploy_docker() {
    print_step "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    print_status "Building Docker image..."
    docker build -t grand-city-guest-pass:latest .
    
    print_status "Starting Docker container..."
    docker-compose up -d
    
    print_status "Docker deployment completed!"
    print_status "Application running on: http://localhost:8080"
}

# Manual deployment instructions
manual_deployment() {
    print_step "Manual Deployment Instructions"
    echo ""
    echo "📋 Manual Deployment Steps:"
    echo "1. Copy the following files to your production server:"
    echo "   - guest-pass-system.html"
    echo "   - server-prod.js"
    echo "   - package.json"
    echo "   - .env.production (rename to .env)"
    echo ""
    echo "2. Install dependencies:"
    echo "   npm ci --only=production"
    echo ""
    echo "3. Start the application:"
    echo "   NODE_ENV=production node server-prod.js"
    echo ""
    echo "4. Configure your web server (Nginx/Apache) to proxy requests to port 8080"
    echo ""
    echo "5. Set up SSL/TLS certificates for HTTPS"
    echo ""
}

# Main deployment function
main() {
    echo "Choose your deployment method:"
    echo "1. Vercel (Serverless)"
    echo "2. Heroku (Platform as a Service)"
    echo "3. Railway (Modern PaaS)"
    echo "4. Docker (Containerized)"
    echo "5. Manual Deployment"
    echo "6. Build Only (Prepare for deployment)"
    echo ""
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            check_node
            install_deps
            build_app
            deploy_vercel
            ;;
        2)
            check_node
            install_deps
            build_app
            deploy_heroku
            ;;
        3)
            check_node
            install_deps
            build_app
            deploy_railway
            ;;
        4)
            check_node
            deploy_docker
            ;;
        5)
            check_node
            install_deps
            build_app
            manual_deployment
            ;;
        6)
            check_node
            install_deps
            build_app
            print_status "Build completed! Files are ready in the 'dist' directory."
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Deployment process completed! 🎉"
    print_status "Check the logs above for deployment URLs and next steps."
}

# Run the main function
main