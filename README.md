# Shutter Shots by KP

Portfolio and lightweight content manager for photographer Karan Pande. The
public React site presents wedding, pre-wedding, and cinematic albums; the
FastAPI dashboard manages albums, media, testimonials, and site settings.

## Local setup

### Frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_BACKEND_URL` when the API is hosted on another origin. During a
temporary API outage the public portfolio uses bundled read-only sample content,
so visitors never see an empty site. Admin operations always require the API.

### Backend

```bash
cp backend/.env.example backend/.env
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.server:app --reload --port 8000
```

Copy `backend/.env.example` to `backend/.env`, then replace every placeholder.
The API stores albums, settings, and optimized image uploads in Postgres. It
intentionally refuses to start with missing credentials rather than exposing a
default admin password.

## Deployment

The root Vercel project builds the React app and exposes FastAPI through the
same `/api` origin. Neon supplies persistent Postgres storage, including admin
uploads, so edits survive serverless restarts and new deployments.

## Production checks

```bash
npm --prefix frontend run build
python -m py_compile backend/server.py backend/postgres_store.py api/index.py
```
