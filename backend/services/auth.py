import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
from config.settings import settings
from database import get_user_status, update_user


def create_token(user_id: int, name: str, email: str, role: str, token_version: int = 0) -> str:
    payload = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "token_version": token_version,
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_header(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:]


def require_valid_user(request: Request) -> dict:
    token = get_token_from_header(request.headers.get("Authorization"))
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_status = get_user_status(payload["user_id"])
    if not user_status:
        raise HTTPException(status_code=401, detail="User no longer exists")

    if user_status["status"] == "suspended":
        suspended_str = user_status.get("suspended_until")
        if suspended_str:
            try:
                suspended_until = datetime.fromisoformat(suspended_str)
                if datetime.utcnow() >= suspended_until:
                    update_user(payload["user_id"], {"status": "active", "suspended_until": None})
                else:
                    until = suspended_until.strftime("%Y-%m-%d %H:%M UTC")
                    raise HTTPException(status_code=403, detail=f"Account is suspended until {until}")
            except ValueError:
                raise HTTPException(status_code=403, detail="Account is suspended")
        else:
            raise HTTPException(status_code=403, detail="Account is suspended")
    elif user_status["status"] != "active":
        raise HTTPException(status_code=403, detail="Account is permanently blocked")

    if payload.get("token_version", -1) != user_status["token_version"]:
        raise HTTPException(status_code=401, detail="Session expired — please log in again")

    return {
        "user_id": payload["user_id"],
        "name": payload["name"],
        "email": payload["email"],
        "role": payload["role"],
        "token_version": payload.get("token_version", 0),
    }
