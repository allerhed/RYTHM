#!/bin/bash

# Build and deploy all RYTHM containers directly to Azure
# Usage: ./scripts/build-all-direct.sh [tag]

set -e

# Get tag from argument or use timestamp
TAG=${1:-$(date +%Y%m%d-%H%M%S)}

echo "🚀 Building and deploying all RYTHM containers with tag: $TAG"
echo ""

# Build API
echo "🔧 Building API..."
./scripts/build-api-direct.sh "$TAG"
echo ""

# Build Mobile App
echo "📱 Building Mobile App..."
./scripts/build-mobile-direct.sh "$TAG"
echo ""

# Build Admin App
echo "⚙️ Building Admin App..."
./scripts/build-admin-direct.sh "$TAG"
echo ""

echo "🎉 All containers built and deployed successfully!"
echo "📅 Tag: $TAG"
echo ""
echo "🌐 Live URLs:"
echo "   Mobile: https://rythm.training"
echo "   Admin:  https://admin.rythm.training"
echo "   API:    https://api.rythm.training (when DNS is configured)"
echo ""
echo "🔗 Azure URLs:"
echo "   Mobile: https://ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io"
echo "   Admin:  https://ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io"
echo "   API:    https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io"