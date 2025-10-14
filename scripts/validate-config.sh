#!/bin/bash

# RYTHM Configuration Validation Script
# Validates that the development environment is correctly configured for Docker
# Run this before starting the dev environment to catch common issues

set -e

echo "🔍 RYTHM Configuration Validator"
echo "================================"
echo ""

ISSUES_FOUND=0

# Check 1: Look for .env.local files that would override Docker env vars
echo "1️⃣  Checking for .env.local files..."
if [ -f apps/mobile/.env.local ]; then
    echo "   ❌ apps/mobile/.env.local exists"
    echo "      This file will override Docker environment variables"
    echo "      Solution: mv apps/mobile/.env.local apps/mobile/.env.local.backup"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "   ✅ apps/mobile/.env.local not found (good)"
fi

if [ -f apps/admin/.env.local ]; then
    echo "   ❌ apps/admin/.env.local exists"
    echo "      This file will override Docker environment variables"
    echo "      Solution: mv apps/admin/.env.local apps/admin/.env.local.backup"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "   ✅ apps/admin/.env.local not found (good)"
fi

echo ""

# Check 2: Validate next.config.js priority order
echo "2️⃣  Validating next.config.js files..."

# Mobile
if [ -f apps/mobile/next.config.js ]; then
    if grep -q "process.env.API_URL || process.env.NEXT_PUBLIC_API_URL" apps/mobile/next.config.js; then
        echo "   ✅ apps/mobile/next.config.js has correct priority (API_URL first)"
    elif grep -q "process.env.NEXT_PUBLIC_API_URL || process.env.API_URL" apps/mobile/next.config.js; then
        echo "   ❌ apps/mobile/next.config.js has WRONG priority"
        echo "      NEXT_PUBLIC_API_URL should NOT come before API_URL"
        echo "      This causes container-to-container communication to fail"
        echo "      Solution: Change order to: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo "   ⚠️  apps/mobile/next.config.js: Cannot determine priority order"
    fi
else
    echo "   ❌ apps/mobile/next.config.js not found"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Admin
if [ -f apps/admin/next.config.js ]; then
    if grep -q "process.env.API_URL || process.env.NEXT_PUBLIC_API_URL" apps/admin/next.config.js; then
        echo "   ✅ apps/admin/next.config.js has correct priority (API_URL first)"
    elif grep -q "process.env.NEXT_PUBLIC_API_URL || process.env.API_URL" apps/admin/next.config.js; then
        echo "   ❌ apps/admin/next.config.js has WRONG priority"
        echo "      NEXT_PUBLIC_API_URL should NOT come before API_URL"
        echo "      This causes container-to-container communication to fail"
        echo "      Solution: Change order to: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo "   ⚠️  apps/admin/next.config.js: Cannot determine priority order"
    fi
else
    echo "   ❌ apps/admin/next.config.js not found"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check 3: Validate docker-compose.yml has correct env vars
echo "3️⃣  Checking docker-compose.yml environment variables..."
if [ -f docker-compose.yml ]; then
    # Check mobile service
    if grep -A 10 "mobile:" docker-compose.yml | grep -q "API_URL.*http://api:3001"; then
        echo "   ✅ Mobile service has correct API_URL (http://api:3001)"
    else
        echo "   ⚠️  Mobile service API_URL check inconclusive"
        echo "      Manually verify: API_URL=http://api:3001 in docker-compose.yml under mobile service"
    fi
    
    # Check admin service
    if grep -A 10 "admin:" docker-compose.yml | grep -q "API_URL.*http://api:3001"; then
        echo "   ✅ Admin service has correct API_URL (http://api:3001)"
    else
        echo "   ⚠️  Admin service API_URL check inconclusive"
        echo "      Manually verify: API_URL=http://api:3001 in docker-compose.yml under admin service"
    fi
else
    echo "   ❌ docker-compose.yml not found"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# Check 4: Validate .dockerignore excludes .env.local
echo "4️⃣  Checking .dockerignore..."
if [ -f .dockerignore ]; then
    if grep -q "\.env\.local" .dockerignore; then
        echo "   ✅ .dockerignore excludes .env.local files"
    else
        echo "   ❌ .dockerignore does not exclude .env.local files"
        echo "      Add: .env.local"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "   ⚠️  .dockerignore not found (not critical but recommended)"
fi

echo ""
echo "================================"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ All checks passed! Configuration is correct."
    echo ""
    echo "You can now run: npm run dev"
    exit 0
else
    echo "❌ Found $ISSUES_FOUND issue(s) that need to be fixed"
    echo ""
    echo "Please fix the issues above before starting the development environment."
    echo ""
    echo "📚 For more information, see:"
    echo "   - PROXY_FIX_SUMMARY.md"
    echo "   - docs/CONTAINER_FIRST_DEVELOPMENT.md"
    exit 1
fi
