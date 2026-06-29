import logging
import signal
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from config.settings import settings
from middleware.cors import setup_cors
from middleware.rate_limit import RateLimitMiddleware
from middleware.security import SecurityHeadersMiddleware
from api.routes import router
from api.auth_routes import router as auth_router
from api.admin_routes import router as admin_router
from api.memory_routes import router as memory_router
from database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("AVIOS API v2.0.0 starting up")
    logger.info(f"Mode: {'production' if settings.production else 'development'}")
    logger.info(f"CORS origins: {settings.cors_origins}")
    logger.info(f"AI Provider: {settings.ai_provider}")
    logger.info(f"Database: {settings.database_url}")
    yield
    logger.info("AVIOS API shutting down gracefully")


app = FastAPI(title="AVIOS API", version="2.0.0", lifespan=lifespan)

setup_cors(app, settings.cors_origins)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.include_router(router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(memory_router)


def graceful_shutdown(sig, frame):
    logger.info(f"Received signal {sig}, shutting down...")
    sys.exit(0)


try:
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)
except (ValueError, RuntimeError):
    pass

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.production,
        log_level="info",
    )
