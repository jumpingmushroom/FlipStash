#!/bin/bash
# Complete rebuild script to clear all Docker cache

echo "🛑 Stopping all containers..."
docker compose down

echo "🗑️  Removing old images..."
docker compose rm -f frontend backend

echo "🧹 Pruning Docker cache..."
docker builder prune -f

echo "🔨 Building with no cache..."
docker compose build --no-cache --pull

echo "🚀 Starting containers..."
docker compose up -d

echo "✅ Done! Wait 10 seconds for containers to start, then:"
echo "   1. Open http://localhost:3000"
echo "   2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "   3. Click 'Add New Game'"
echo "   4. Look below the search bar for 'Filter by platform:' dropdown"
