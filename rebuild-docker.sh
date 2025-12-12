#!/bin/bash

# Complete Docker rebuild script for FlipStash
# This script performs a nuclear clean and rebuild

set -e  # Exit on any error

echo "🧹 Step 1: Stopping and removing all containers..."
docker-compose down

echo "🗑️  Step 2: Removing all FlipStash images..."
docker images | grep flipstash | awk '{print $3}' | xargs -r docker rmi -f

echo "🧽 Step 3: Pruning build cache..."
docker builder prune -af

echo "🏗️  Step 4: Building with no cache..."
docker-compose build --no-cache --pull

echo "🚀 Step 5: Starting containers..."
docker-compose up -d

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 Backend logs (last 20 lines):"
docker-compose logs --tail=20 backend

echo ""
echo "🌐 Frontend should be available at: http://localhost:3000"
echo "🔌 Backend should be available at: http://localhost:3001"
echo ""
echo "To view live logs, run: docker-compose logs -f"
