#!/bin/bash

# GitHub to Google Calendar Sync - Setup Script
# This script helps you set up the project quickly

set -e

echo "🚀 GitHub to Google Calendar Sync - Setup Script"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping creation."
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your credentials:"
    echo "   1. Add your GitHub Personal Access Token"
    echo "   2. Add your GitHub organizations/repositories"
    echo "   3. Add your Google OAuth credentials"
    echo ""
fi

# Create tokens directory
if [ -d "tokens" ]; then
    echo "✅ tokens/ directory already exists"
else
    echo "📁 Creating tokens/ directory..."
    mkdir -p tokens
    echo "✅ tokens/ directory created!"
fi

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your credentials:"
echo "   nano .env"
echo ""
echo "2. Start the development server:"
echo "   npm run start:dev"
echo ""
echo "3. Authorize Google Calendar:"
echo "   Open: http://localhost:3000/auth/google"
echo ""
echo "4. Trigger a manual sync:"
echo "   curl -X POST http://localhost:3000/sync/manual"
echo ""
echo "5. Check sync status:"
echo "   curl http://localhost:3000/sync/status"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - README.md (overview)"
echo "   - SETUP_GUIDE.md (step-by-step)"
echo "   - ARCHITECTURE.md (technical details)"
echo ""
echo "Happy syncing! 🎉"


