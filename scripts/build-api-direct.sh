#!/bin/bash

# Direct API build and push to Azure Container Registry
# Usage: ./scripts/build-api-direct.sh [tag]

set -e

# Configuration
REGISTRY="crtvqklipuckq3a.azurecr.io"
IMAGE_NAME="rythm-api"
RESOURCE_GROUP="rg-rythm-prod"
CONTAINER_APP="ca-api-tvqklipuckq3a"

# Get tag from argument or use timestamp
TAG=${1:-$(date +%Y%m%d-%H%M%S)}
FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$TAG"

echo "🔧 Building and pushing API container directly to ACR..."
echo "📦 Image: $FULL_IMAGE_NAME"
echo "📅 Tag: $TAG"

# Login to ACR
echo "🔐 Logging into Azure Container Registry..."
az acr login --name crtvqklipuckq3a

# Build and push using ACR build (builds in the cloud)
echo "🏗️ Building image in Azure Container Registry..."
az acr build --registry crtvqklipuckq3a \
  --image "$IMAGE_NAME:$TAG" \
  --image "$IMAGE_NAME:latest" \
  --file apps/api/Dockerfile \
  .

echo "✅ Build completed successfully!"
echo "📦 Image: $FULL_IMAGE_NAME"

# Update container app to use new image
echo "🚀 Updating Container App to use new image..."
az containerapp update \
  --name "$CONTAINER_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --image "$FULL_IMAGE_NAME"

echo "🎉 API deployment completed!"
echo "🌐 API URL: https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io"
echo "🔗 Custom domain (when configured): https://api.rythm.training"