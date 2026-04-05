# DeadZone AI FastAPI Backend

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
$env:ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoint

- `POST /analyze`

Request body:

```json
{
  "lat": 27.6244,
  "lng": 88.6124,
  "radius_km": 5,
  "disaster_type": "landslide"
}
```

## Production CORS

Set `ALLOWED_ORIGINS` as a comma-separated list, for example:

```text
https://deadzone-ai.netlify.app,http://localhost:5173,http://127.0.0.1:5173
```
