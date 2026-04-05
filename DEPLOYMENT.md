# DeadZone AI Deployment (Netlify + Render)

## Architecture
- Frontend (React/Vite): Netlify
- Backend (FastAPI): Render

## 1) Deploy Backend on Render

Use the same repo and point Render Web Service to `backend` root directory.

Render settings:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Root directory: `backend`
- Plan: Free

Set backend env var:
- `ALLOWED_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app,http://localhost:5173,http://127.0.0.1:5173`

Example backend URL:
- `https://deadzone-ai-backend.onrender.com`

## 2) Deploy Frontend on Netlify

Netlify settings:
- Build command: `npm run build`
- Publish directory: `dist`

Set frontend env var in Netlify:
- `VITE_API_BASE_URL=https://deadzone-ai-backend.onrender.com`

Example frontend URL:
- `https://deadzone-ai.netlify.app`

## 3) Verify End-to-End

From browser:
- Open frontend URL
- Click `Run Analysis`
- Confirm map/sidebar update from live backend

## 4) Render Free Tier Wake-up

Render free services sleep after inactivity. First request may take ~30 seconds.

Demo tip:
- Open app 2-3 minutes before demo to warm backend.
- Frontend already has fallback to local sample data if backend call fails.
