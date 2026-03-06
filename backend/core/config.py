from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator
from typing import List, Union

class Settings(BaseSettings):
    # Where this API is hosted (for logging/debug only)
    PROJECT_NAME: str = "LinkedIn Researcher API"

    # --- MANUAL TOGGLE: CORS ---
    # LOCAL MODE: This will read the list you just added to your .env
    BACKEND_CORS_ORIGINS: List[str] = []

    # CLOUD MODE: (Commented out - hardcoded fallback for Netlify)
    # BACKEND_CORS_ORIGINS: List[str] = ["https://nexusresearch-ai.netlify.app"]

    # External services (Pulled from .env)
    PROXYCURL_API_KEY: str | None = None
    LOVABLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None  # Added to match your services

    # Polling / worker settings
    MAX_TASK_AGE_SECONDS: int = 10 * 60  # 10 minutes

    # New Pydantic v2 way of handling config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached instance of the settings.
    The print statement confirms the .env is being read.
    """
    print("📡 [DEBUG] Reading .env file and initializing settings...")
    return Settings()