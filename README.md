# BestechVision

Lead scraping bot for remote job platforms.

- `frontend/` — React UI to select platform, keyword, and run the bot
- `backend/` — Express API + scrapers (OnlineJobs.ph and Upwork supported)

## Quick start

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev

# Or run bot from CLI
cd backend && npm run bot -- --platform onlinejobs-ph --keyword "social media"
cd backend && npm run bot -- --platform upwork --category social-media
```

Upwork requires an [Apify](https://apify.com) token — add `APIFY_TOKEN` to `backend/.env` (see `backend/.env.example`).

Each folder is maintained in its own Git repository.
