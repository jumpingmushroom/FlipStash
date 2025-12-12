#!/bin/bash

# FlipStash Diagnostics Script

echo "🔍 FlipStash Diagnostics"
echo "========================"
echo ""

echo "📂 Git Information:"
echo "  Current branch: $(git branch --show-current)"
echo "  Latest commit: $(git log -1 --oneline)"
echo ""

echo "🐳 Docker Images:"
docker images | grep -E "flipstash|REPOSITORY"
echo ""

echo "📦 Running Containers:"
docker ps -a | grep -E "flipstash|CONTAINER"
echo ""

echo "🏗️  Frontend Build Check:"
if [ -d "frontend/dist" ]; then
    echo "  ✅ frontend/dist exists"
    echo "  📁 Main files in dist:"
    ls -lh frontend/dist/ | head -10
else
    echo "  ❌ frontend/dist does not exist - frontend not built!"
fi
echo ""

echo "🔌 Backend Check:"
if docker ps | grep -q "flipstash-backend"; then
    echo "  ✅ Backend container is running"
    echo "  📝 Last 5 backend log lines:"
    docker-compose logs --tail=5 backend 2>/dev/null | tail -5
else
    echo "  ❌ Backend container is NOT running"
fi
echo ""

echo "🌐 Frontend Check:"
if docker ps | grep -q "flipstash-frontend"; then
    echo "  ✅ Frontend container is running"
    echo "  📝 Last 5 frontend log lines:"
    docker-compose logs --tail=5 frontend 2>/dev/null | tail -5
else
    echo "  ❌ Frontend container is NOT running"
fi
echo ""

echo "📊 Database Check:"
if docker ps | grep -q "flipstash-backend"; then
    echo "  Checking database schema..."
    docker exec flipstash-backend node -e "
      const Database = require('better-sqlite3');
      const db = new Database('/app/data/flipstash.db');
      const columns = db.prepare('PRAGMA table_info(games)').all();
      const newColumns = ['igdb_slug', 'igdb_url', 'igdb_summary', 'igdb_genres', 'igdb_rating'];
      newColumns.forEach(col => {
        const exists = columns.some(c => c.name === col);
        console.log(\`  \${exists ? '✅' : '❌'} Column '\${col}' \${exists ? 'exists' : 'MISSING'}\`);
      });
    " 2>/dev/null
else
    echo "  ⚠️  Cannot check database - backend container not running"
fi
echo ""

echo "🔗 Port Availability:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend accessible on http://localhost:3000"
else
    echo "  ❌ Frontend NOT accessible on http://localhost:3000"
fi

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "  ✅ Backend accessible on http://localhost:3001"
else
    echo "  ❌ Backend NOT accessible on http://localhost:3001"
fi
echo ""

echo "Diagnostics complete!"
