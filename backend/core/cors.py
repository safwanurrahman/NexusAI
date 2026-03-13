# backend/core/cors.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import get_settings

def setup_cors(app: FastAPI) -> None:
    settings = get_settings()

    allow_origins = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
    ]

    # ☁️ CLOUD ORIGINS (Commented out for now)
    # allow_origins = ["https://nexusresearch-ai.netlify.app"]

    # Dynamically add from Railway environment variables if they exist
    if settings.BACKEND_CORS_ORIGINS:
        # settings.BACKEND_CORS_ORIGINS should be a list
        allow_origins.extend(settings.BACKEND_CORS_ORIGINS)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(set(allow_origins)), # set() removes duplicates
        allow_credentials=True,
        allow_methods=["*"], # Accepting all methods (GET, POST, OPTIONS)
        allow_headers=["*"], # Accepting all headers (Content-Type, etc.)
    )