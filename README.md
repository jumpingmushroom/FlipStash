# 🎮 FlipStash

A self-hosted, dockerized web application for tracking your physical video game collection, including purchase prices, current market values, and sale information.

## Features

- **Complete Game Management**: Add, edit, view, and delete games in your collection
- **IGDB Integration**: Search and fetch game metadata (cover art, release dates, platforms) from IGDB
- **Market Value Tracking**: Automated web scraping from PriceCharting.com and Finn.no to determine current market prices
- **Smart Pricing**: Automatically calculate recommended selling prices based on market data
- **Comprehensive Data**: Track purchase value, market value, selling value, sold value, dates, condition, and notes
- **Analytics Dashboard**: View collection statistics including total value, profit/loss, and sales data
- **Filtering & Sorting**: Filter by platform, status (sold/available), and sort by various criteria
- **Modern UI**: Clean, responsive interface with dark mode design

## Prerequisites

- Docker and Docker Compose installed on your system
- IGDB API credentials (Client ID and Client Secret)

## Getting IGDB API Credentials

1. Go to [https://api.igdb.com/](https://api.igdb.com/)
2. Sign up for a Twitch account if you don't have one
3. Register your application to get your Client ID and Client Secret

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FlipStash
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** and add your IGDB credentials:
   ```
   IGDB_CLIENT_ID=your_actual_client_id
   IGDB_CLIENT_SECRET=your_actual_client_secret
   ```

4. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

### Adding a Game

1. Click the "Add Game" button
2. Search for the game using IGDB search (optional but recommended)
3. Select the correct game from search results to auto-fill details
4. Fill in additional information:
   - Platform (required)
   - Purchase value and date
   - Condition (Sealed, CIB, Loose, etc.)
   - Notes
5. Market value can be left blank initially
6. Click "Add Game"

### Refreshing Market Value

1. Find the game in your collection
2. Click "Refresh Market" button on the game card
3. The app will scrape current prices from PriceCharting and Finn.no
4. Market value and recommended selling value will be updated automatically

### Tracking Sales

1. Edit a game
2. Fill in the "Sold Value" and "Sale Date" fields
3. The profit/loss will be automatically calculated and displayed

### Filtering & Sorting

- Use the search bar to find games by name or platform
- Filter by specific platform using the dropdown
- Filter by status (All, Available, Sold)
- Sort by newest, name, purchase value, or market value

## Project Structure

```
FlipStash/
├── docker-compose.yml          # Docker orchestration
├── backend/                    # Node.js Express backend
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js           # Express server
│       ├── db/                # SQLite database
│       ├── routes/            # API routes
│       ├── controllers/       # Request handlers
│       └── services/
│           ├── igdb.js        # IGDB API integration
│           └── scraper.js     # Web scraping service
└── frontend/                  # React frontend
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.jsx            # Main application
        ├── components/        # React components
        └── services/
            └── api.js         # API client
```

## API Endpoints

- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get a specific game
- `POST /api/games` - Create a new game
- `PUT /api/games/:id` - Update a game
- `DELETE /api/games/:id` - Delete a game
- `GET /api/games/igdb/search?query=<name>` - Search IGDB
- `POST /api/games/:id/refresh-market-value` - Refresh market value

## Data Persistence

Game data is stored in a SQLite database that persists in a Docker volume named `flipstash-data`. Your data will be preserved even if you restart or rebuild the containers.

## Troubleshooting

### Backend won't start
- Check that your IGDB credentials are correctly set in `.env`
- View logs: `docker-compose logs backend`

### Web scraping not working
- Web scraping can be unreliable due to website changes
- Check logs for specific errors: `docker-compose logs backend`
- You can manually enter market values if scraping fails

### Frontend can't connect to backend
- Ensure both containers are running: `docker-compose ps`
- Check if backend is healthy: http://localhost:3001/health

## Updating

```bash
# Stop the application
docker-compose down

# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Backup

To backup your database:

```bash
docker cp flipstash-backend:/app/data/flipstash.db ./flipstash-backup.db
```

To restore:

```bash
docker cp ./flipstash-backup.db flipstash-backend:/app/data/flipstash.db
docker-compose restart backend
```

## Development

To run in development mode:

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Database**: SQLite with better-sqlite3
- **Web Scraping**: Puppeteer
- **External APIs**: IGDB (Internet Game Database)
- **Deployment**: Docker, Docker Compose

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
