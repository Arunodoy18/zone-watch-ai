# DeadZone AI Demo Checklist

## Before Presentation (10-15 min earlier)

1. Start backend:

```powershell
Set-Location "c:/DEVOP/DeadZone AI/backend"
& "c:/DEVOP/DeadZone AI/.venv/Scripts/python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

2. Start frontend:

```powershell
Set-Location "c:/DEVOP/DeadZone AI"
npx vite --host 127.0.0.1 --port 5173
```

3. Open app and run one analysis once to warm services.
4. Keep both terminals open.

## Cloud Demo (Netlify + Render)

1. Open the Netlify site.
2. Click `Run Analysis` once and wait for live response.
3. If Render is cold, wait for wake-up banner and auto-retry.
4. If backend is still slow, app falls back to sample data and remains demo-ready.

## Quick Health Checks

Backend docs:
- `https://YOUR-RENDER-URL.onrender.com/docs`

Backend analyze (sample payload):

```powershell
$payload = @{ lat = 27.6244; lng = 88.6124; radius_km = 5; disaster_type = 'landslide' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://YOUR-RENDER-URL.onrender.com/analyze" -ContentType "application/json" -Body $payload
```

## Environment Variables

Frontend (Netlify):
- `VITE_API_BASE_URL=https://YOUR-RENDER-URL.onrender.com`

Backend (Render):
- `ALLOWED_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app,http://localhost:5173,http://127.0.0.1:5173`
