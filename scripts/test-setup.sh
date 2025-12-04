#!/bin/bash

# Test Setup Script
# Verifies that the environment is properly configured

echo "🔍 Testing GitHub to Google Calendar Sync Setup"
echo "================================================"
echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Run: cp .env.example .env"
    exit 1
fi

echo "✅ .env file exists"

# Check for required environment variables
required_vars=(
    "GITHUB_TOKEN"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "GOOGLE_REDIRECT_URI"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env || grep -q "^${var}=.*your.*" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "⚠️  Missing or incomplete environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please edit .env and add the required values."
    echo "See SETUP_GUIDE.md for instructions."
else
    echo "✅ All required environment variables are set"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found!"
    echo "   Run: npm install"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if dist exists (built)
if [ -d "dist" ]; then
    echo "✅ Project is built (dist/ exists)"
else
    echo "ℹ️  Project not built yet (run: npm run build)"
fi

# Check if tokens directory exists
if [ ! -d "tokens" ]; then
    echo "⚠️  tokens/ directory not found"
    echo "   Creating it now..."
    mkdir -p tokens
    echo "✅ tokens/ directory created"
else
    echo "✅ tokens/ directory exists"
fi

# Check if Google tokens exist
if [ -f "tokens/google-tokens.json" ]; then
    echo "✅ Google OAuth tokens found (already authorized)"
else
    echo "⚠️  Google OAuth tokens not found"
    echo "   You need to authorize the app:"
    echo "   1. Start the server: npm run start:dev"
    echo "   2. Visit: http://localhost:3000/auth/google"
fi

echo ""
echo "================================================"
echo "Setup Test Complete!"
echo "================================================"
echo ""

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ Your environment is ready!"
    echo ""
    echo "To start the server:"
    echo "  npm run start:dev"
    echo ""
    echo "To test the sync:"
    echo "  curl -X POST http://localhost:3000/sync/manual"
else
    echo "⚠️  Please complete the setup steps above."
    echo ""
    echo "See SETUP_GUIDE.md for detailed instructions."
fi

echo ""


