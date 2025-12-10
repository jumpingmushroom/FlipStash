# FlipStash - Project Context for Claude

## Project Overview

FlipStash is a self-hosted, dockerized web application for tracking a personal collection of physical video games. It tracks purchase values, current market values, and sale information to help collectors manage and potentially profit from their game collections.

**Current Status**: Fully implemented and functional. All core requirements have been met.

## Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3 (synchronous API)
- **Web Scraping**: Puppeteer (for market value scraping)
- **External API**: IGDB (Twitch) for game metadata

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Pure CSS (no framework)
- **State Management**: React hooks (useState, useEffect)

### Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Data Persistence**: Docker volume for SQLite database

## Architecture

```
FlipStash/
├── docker-compose.yml          # Orchestrates frontend and backend services
├── .env.example                # Template for environment variables
├── README.md                   # User-facing documentation
├── CLAUDE.md                   # This file - AI context
│
├── backend/                    # Node.js/Express API
│   ├── Dockerfile             # Multi-stage build with Puppeteer dependencies
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js           # Express server setup, port 3001
│       ├── db/
│       │   └── index.js       # SQLite database with prepared statements
│       ├── routes/
│       │   └── games.js       # API routes (note: /igdb/search before /:id)
│       ├── controllers/
│       │   └── gameController.js  # Business logic for CRUD + search + refresh
│       └── services/
│           ├── igdb.js        # IGDB API integration with OAuth token caching
│           └── scraper.js     # Web scraping for PriceCharting & Finn.no
│
└── frontend/                  # React SPA
    ├── Dockerfile            # Multi-stage build with serve
    ├── package.json
    ├── vite.config.js        # Dev proxy to backend
    ├── index.html
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Main application with filters, sorting, stats
        ├── App.css           # All styles (dark mode design)
        ├── components/
        │   ├── GameCard.jsx  # Individual game display with actions
        │   └── GameForm.jsx  # Modal form for add/edit with IGDB search
        └── services/
            └── api.js        # Axios-based API client

```

## Database Schema

**Table: games**
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  purchase_value REAL,
  market_value REAL,
  selling_value REAL,
  sold_value REAL,
  purchase_date TEXT,
  sale_date TEXT,
  condition TEXT,
  notes TEXT,
  igdb_id INTEGER,
  igdb_cover_url TEXT,
  igdb_release_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**Indexes**: `idx_games_platform`, `idx_games_name`

**Migration Logic**: The database initialization includes automatic migration to add `created_at` and `updated_at` columns if they're missing from existing databases.

## API Endpoints

All endpoints are prefixed with `/api/games`

- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get specific game
- `POST /api/games` - Create new game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game
- `GET /api/games/igdb/search?query=<name>` - Search IGDB (must be before /:id route!)
- `POST /api/games/:id/refresh-market-value` - Refresh market value via scraping

**Important Route Order**: The `/igdb/search` route MUST come before `/:id` parameterized routes to avoid route collision.

## Key Features

### 1. IGDB Integration
- **Authentication**: OAuth token obtained from Twitch API using Client ID + Secret
- **Token Caching**: Tokens cached with 5-minute safety margin before expiry
- **Search**: Returns game name, cover art, release date, platforms
- **Environment Variables**: `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` required

### 2. Web Scraping
- **Sources**: PriceCharting.com (USD) and Finn.no (NOK)
- **Technology**: Puppeteer with headless Chromium
- **Bot Detection Avoidance**:
  - Realistic user agents
  - Random delays between actions
  - Proper headers and viewport settings
  - Human-like typing speed
- **Market Value Calculation**: Average of available sources
- **Selling Value**: Market value × 1.10 (10% markup)
- **Error Handling**: Gracefully handles missing data, allows manual entry

### 3. Frontend Features
- **Filtering**: By search query, platform, status (all/available/sold)
- **Sorting**: By created date, name, purchase value, market value
- **Analytics**: Total games, collection value, total profit, sold count
- **Responsive Grid**: Auto-adjusts based on screen size
- **Dark Mode**: Modern dark theme with purple/blue accents

### 4. Business Logic
- **Profit Calculation**: `sold_value - purchase_value`
- **Selling Value Auto-calc**: When market value changes, selling value = market × 1.10
- **Condition Tracking**: Sealed, CIB, Loose, Box Only, Manual Only
- **Date Tracking**: Purchase date and sale date

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
IGDB_CLIENT_ID=<your_client_id>
IGDB_CLIENT_SECRET=<your_client_secret>
DB_PATH=/app/data/flipstash.db
```

### Frontend (build-time)
```env
VITE_API_URL=http://backend:3001  # For production container-to-container
# Or http://localhost:3001 for local development
```

## Docker Configuration

### Backend Dockerfile
- Base: `node:20-slim`
- Installs Chromium and dependencies for Puppeteer
- Sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
- Exposes port 3001
- Creates `/app/data` directory for SQLite

### Frontend Dockerfile
- Multi-stage build: build stage + production stage
- Build stage: Runs `npm run build` to create optimized bundle
- Production stage: Uses `serve` to serve static files
- Exposes port 3000

### Docker Compose
- **Services**: backend, frontend
- **Volumes**: `flipstash-data` for database persistence
- **Network**: Default bridge network allows services to communicate
- **Health Checks**: Backend has HTTP health check on `/health`
- **No nginx**: Applications serve traffic directly as requested

## Important Implementation Details

### 1. Route Order Bug Fix
The IGDB search route must come before parameterized routes:
```javascript
// Correct order:
router.get('/igdb/search', searchGames);  // First
router.get('/:id', getGameById);          // Second
```

### 2. Database Migration
Automatic migration checks for missing columns and adds them:
```javascript
const tableInfo = db.prepare("PRAGMA table_info(games)").all();
const columns = tableInfo.map(col => col.name);
if (!columns.includes('created_at')) {
  db.exec(`ALTER TABLE games ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`);
}
```

### 3. CORS Configuration
Backend uses `cors()` middleware to allow frontend requests from different origin.

### 4. Vite Proxy (Development)
In development, Vite proxies `/api` requests to backend to avoid CORS issues:
```javascript
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'http://localhost:3001',
    changeOrigin: true
  }
}
```

### 5. Prepared Statements
All database queries use prepared statements for performance and security.

## Known Considerations

### Web Scraping Fragility
- Web scrapers can break if target websites change their HTML structure
- PriceCharting and Finn.no may implement anti-bot measures
- Users can manually enter market values if scraping fails

### IGDB API Limits
- IGDB has rate limits (exact limits not specified in their docs)
- Token caching helps minimize auth requests
- Search is limited to 10 results per query

### Single-User Design
- No authentication/authorization implemented
- Designed for personal, self-hosted use
- All users have full access to all data

### SQLite Limitations
- Single writer at a time (not an issue for single-user)
- No built-in replication or clustering
- File-based, so backups are simple (just copy the .db file)

## Development Workflow

### Local Development
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with IGDB credentials
npm run dev  # Runs with nodemon on port 3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # Runs Vite dev server on port 3000
```

### Docker Development
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Database Backup
```bash
# Backup
docker cp flipstash-backend:/app/data/flipstash.db ./backup.db

# Restore
docker cp ./backup.db flipstash-backend:/app/data/flipstash.db
docker-compose restart backend
```

## Common Issues & Solutions

### Issue: Backend crashes with "no such column: created_at"
**Solution**: Fixed with automatic migration logic. Restart containers.

### Issue: IGDB search fails
**Solution**: Check IGDB credentials in .env. Verify they're valid at api.igdb.com.

### Issue: Web scraping returns null
**Solution**: This is normal and expected. Websites may be down or blocking requests. Users should manually enter market values.

### Issue: Frontend can't reach backend
**Solution**: Check that backend is running (`docker-compose ps`). Check health endpoint: `curl http://localhost:3001/health`

### Issue: Changes not reflected after rebuild
**Solution**: Use `docker-compose up -d --build` to force rebuild, or `docker-compose build --no-cache`

## Future Enhancement Ideas

These were not implemented but could be added:
- Multi-user support with authentication
- Image upload for custom photos
- Barcode scanning integration
- Price history charts over time
- Export to CSV/Excel
- Import from CSV
- Wishlist feature
- Trade/loan tracking
- Collection statistics dashboard expansion
- Mobile-responsive improvements
- PWA support for offline access
- Automated market value refresh (cron job)
- Email notifications for price changes
- Multiple currency support
- Integration with more price sources (eBay, GameStop, etc.)

## Git Branch

**Current Branch**: `claude/build-flipstash-docker-01E2XWwNu3vpV2DDnEwSzdVP`

All code is committed and pushed to this branch.

## Testing the Application

### Manual Testing Checklist
- [ ] Add a game manually
- [ ] Search IGDB and add a game from results
- [ ] Edit a game
- [ ] Refresh market value for a game
- [ ] Mark a game as sold (add sold_value)
- [ ] Filter by platform
- [ ] Filter by status (sold/available)
- [ ] Sort by different criteria
- [ ] Delete a game
- [ ] Check that statistics update correctly
- [ ] Verify database persists after container restart

### Health Check
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"2024-..."}
```

## Code Style & Conventions

- **ES Modules**: Using `import/export` (not `require`)
- **Async/Await**: Preferred over promise chains
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Console Logging**: Used for debugging and request logging
- **Comments**: Minimal inline comments, JSDoc for function descriptions
- **File Organization**: Separation of concerns (routes, controllers, services)

## Security Considerations

- **Environment Variables**: Secrets stored in .env, not committed to git
- **SQL Injection**: Prevented via prepared statements
- **XSS**: React handles escaping automatically
- **CORS**: Enabled for frontend-backend communication
- **No Authentication**: Intentional design for single-user self-hosted use
- **Docker**: Running as root in containers (could be improved with non-root user)

## Performance Notes

- **SQLite**: Synchronous API (better-sqlite3) is faster than async for this use case
- **Prepared Statements**: Reused for better performance
- **Token Caching**: IGDB tokens cached to reduce auth requests
- **Indexes**: Created on platform and name columns for faster queries
- **Frontend Bundle**: Optimized with Vite's production build
- **Multi-stage Docker Builds**: Smaller final images

---

**Last Updated**: 2024 (Project completed)
**Version**: 1.0.0
**Maintainer Context**: This document is for Claude AI to quickly understand the project in future conversations.
