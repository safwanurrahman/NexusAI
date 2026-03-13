from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "LinkedIn Researcher API"

    # --- Redis Configuration ---
    # We use 'redis' as the hostname because that is the service name in docker-compose.yml
    REDIS_URL: str = "redis://redis:6379/0"

    # --- MANUAL TOGGLE: CORS ---
    # LOCAL MODE: This reads from your .env list
    BACKEND_CORS_ORIGINS: List[str] = []

    # CLOUD MODE: (Keeping this commented out per your request)
    # BACKEND_CORS_ORIGINS: List[str] = ["https://nexusresearch-ai.netlify.app"]

    # External services (Pulled from .env)
    PROXYCURL_API_KEY: str | None = None
    LOVABLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # Polling / worker settings
    MAX_TASK_AGE_SECONDS: int = 10 * 60  # 10 minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" 
    )

@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached instance of the settings.
    """
    print("📡 [DEBUG] Reading settings and connecting to Redis...")
    return Settings()