#!/bin/bash

# Grand City Guest Pass System Deployment Script
# This script helps deploy the application to various hosting platforms

echo "🚀 Grand City Guest Pass System Deployment Script"
echo "================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create a simple build
echo "🏗️  Preparing build..."
mkdir -p dist
cp guest-pass-system.html dist/index.html
cp server.js dist/
cp package.json dist/
cp vercel.json dist/

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "🌐 Deployment Options:"
echo ""
echo "1. Local Development:"
echo "   npm start"
echo "   Open http://localhost:3000"
echo ""
echo "2. Deploy to Vercel:"
echo "   npm install -g vercel"
echo "   vercel --prod"
echo ""
echo "3. Deploy to Heroku:"
echo "   npm install -g heroku"
echo "   heroku create your-app-name"
echo "   git add . && git commit -m 'Deploy'"
echo "   git push heroku main"
echo ""
echo "4. Deploy to Railway:"
echo "   npm install -g @railway/cli"
echo "   railway login"
echo "   railway init"
echo "   railway up"
echo ""
echo "📋 Application Features:"
echo "- Multi-role authentication (Executive, Staff, Guard, Receptionist, Admin)"
echo "- QR code generation and scanning"
echo "- Visitor scheduling and approval workflow"
echo "- Digital pass generation and sharing"
echo "- Real-time check-in system"
echo "- Admin dashboard with analytics"
echo ""
echo "🔒 Security Features:"
echo "- Content Security Policy (CSP)"
echo "- X-Frame-Options protection"
echo "- Secure camera permissions"
echo "- Local data encryption"
echo ""
echo "Choose your deployment option and follow the instructions above!"