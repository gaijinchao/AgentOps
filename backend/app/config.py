from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/agentops")
    run_list_limit_default: int = Field(default=50)
    run_list_limit_max: int = Field(default=200)
    cors_origins: str = Field(default="http://localhost:5173")


settings = Settings()
