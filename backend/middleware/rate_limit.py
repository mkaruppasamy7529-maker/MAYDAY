import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from config.settings import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time() * 1000
            window = settings.rate_limit_window_ms

            self.requests[client_ip] = [
                t for t in self.requests[client_ip] if now - t < window
            ]

            if len(self.requests[client_ip]) >= settings.rate_limit_max_requests:
                raise HTTPException(status_code=429, detail="Too many requests")

            self.requests[client_ip].append(now)

        response = await call_next(request)
        return response
