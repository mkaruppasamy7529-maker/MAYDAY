import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ollama / AI provider
    ai_provider: str = "ollama"
    ollama_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:latest"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    production: bool = False
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Database
    database_url: str = ""

    # Rate limiting
    rate_limit_window_ms: int = 60000
    rate_limit_max_requests: int = 30
    daily_message_limit: int = 100

    # JWT
    jwt_secret: str = "mayday-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # SMTP (for password reset, email verification)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@mayday.ai"
    app_base_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Resolve database_url default after init
if not settings.database_url:
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(db_dir, exist_ok=True)
    settings.database_url = os.path.join(db_dir, "mayday.db")
