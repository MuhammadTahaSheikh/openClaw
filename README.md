# BestechVision

Lead scraping bot for remote job platforms.

- `frontend/` — React UI to select platform, keyword, and run the bot
- `backend/` — Express API + scrapers (OnlineJobs.ph supported)

## Quick start

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev

# Or run bot from CLI
cd backend && npm run bot -- --platform onlinejobs-ph --keyword "social media"
```

Each folder is maintained in its own Git repository.
