import logging
import secrets
import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request
from database import (
    register_user, get_user_by_id, get_user_by_identifier, get_user_by_email,
    update_user, delete_user, get_user_by_reset_token, increment_token_version,
    log_login, suspend_user, _get_conn,
)
from services.auth import create_token, require_valid_user
from services.email import send_email
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/register")
async def api_register(request: Request):
    data = await request.json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm = data.get("confirmPassword", "")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields required")
    if password != confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    user = register_user(name, email, password)
    if not user:
        raise HTTPException(status_code=409, detail="Email already registered")

    token = create_token(user["id"], user["name"], user["email"], user["role"], user.get("token_version", 0))

    if settings.smtp_host:
        try:
            verification_token = secrets.token_urlsafe(32)
            update_user(user["id"], {"verification_token": verification_token})
            verify_link = f"{settings.app_base_url}/verify-email?token={verification_token}"
            send_email(email, "Verify your AVIOS account",
                f"Hi {name},\n\nPlease verify your email by clicking:\n{verify_link}\n\nThanks,\nAVIOS Team")
        except Exception as e:
            logger.warning(f"Failed to send verification email: {e}")

    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@router.post("/api/login")
async def api_login(request: Request):
    data = await request.json()
    identifier = data.get("username", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Username/email and password required")

    user = get_user_by_identifier(identifier)
    if user and not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user["status"] == "disabled":
        raise HTTPException(status_code=403, detail="Account is permanently blocked")

    if user["status"] == "suspended":
        suspended_str = user.get("suspended_until")
        if suspended_str:
            try:
                suspended_until = datetime.fromisoformat(suspended_str)
                if datetime.utcnow() >= suspended_until:
                    update_user(user["id"], {"status": "active", "suspended_until": None})
                else:
                    until = suspended_until.strftime("%Y-%m-%d %H:%M UTC")
                    raise HTTPException(status_code=403, detail=f"Account is suspended until {until}")
            except ValueError:
                raise HTTPException(status_code=403, detail="Account is suspended")
        else:
            raise HTTPException(status_code=403, detail="Account is suspended")

    token = create_token(user["id"], user["name"], user["email"], user["role"], user.get("token_version", 0))

    ip = request.client.host if request.client else ""
    agent = request.headers.get("user-agent", "")
    log_login(user["id"], ip, agent, success=True)

    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@router.get("/api/me")
async def api_me(request: Request):
    auth = require_valid_user(request)
    user = get_user_by_id(auth["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
            "emailVerified": bool(user["email_verified"]),
            "theme": user["theme"],
            "accentColor": user["accent_color"],
            "fontSize": user["font_size"],
            "animationsEnabled": bool(user["animations_enabled"]),
            "memoryEnabled": bool(user["memory_enabled"]),
            "createdAt": user["created_at"],
            "lastLogin": user["last_login"],
        }
    }


@router.post("/api/change-password")
async def api_change_password(request: Request):
    auth = require_valid_user(request)
    user = get_user_by_id(auth["user_id"])
    data = await request.json()
    old = data.get("oldPassword", "")
    new = data.get("newPassword", "")
    if not bcrypt.checkpw(old.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    new_hash = bcrypt.hashpw(new.encode(), bcrypt.gensalt()).decode()
    update_user(user["id"], {"password_hash": new_hash})
    increment_token_version(user["id"])
    new_token = create_token(user["id"], user["name"], user["email"], user["role"], user.get("token_version", 0) + 1)
    return {"success": True, "token": new_token}


@router.post("/api/forgot-password")
async def api_forgot_password(request: Request):
    data = await request.json()
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    user = get_user_by_email(email)
    if not user:
        return {"success": True}

    reset_token = secrets.token_urlsafe(32)
    expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    update_user(user["id"], {"reset_token": reset_token, "reset_token_expires": expires})

    if settings.smtp_host:
        reset_link = f"{settings.app_base_url}/reset-password?token={reset_token}"
        try:
            send_email(email, "Reset your AVIOS password",
                f"Hi {user['name']},\n\nReset your password by clicking:\n{reset_link}\n\nThis link expires in 1 hour.\n\nThanks,\nAVIOS Team")
        except Exception as e:
            logger.warning(f"Failed to send reset email: {e}")

    return {"success": True}


@router.post("/api/reset-password")
async def api_reset_password(request: Request):
    data = await request.json()
    token = data.get("token", "").strip()
    new_password = data.get("newPassword", "")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password required")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = get_user_by_reset_token(token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    update_user(user["id"], {"password_hash": new_hash, "reset_token": None, "reset_token_expires": None})
    increment_token_version(user["id"])
    return {"success": True}


@router.post("/api/verify-email")
async def api_verify_email(request: Request):
    data = await request.json()
    token = data.get("token", "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    c = _get_conn()
    row = c.execute("SELECT id FROM users WHERE verification_token = ?", (token,)).fetchone()
    if not row:
        c.close()
        raise HTTPException(status_code=400, detail="Invalid verification token")
    c.execute("UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?", (row[0],))
    c.commit()
    c.close()
    return {"success": True}


@router.get("/api/password-strength")
async def api_password_strength(request: Request):
    password = request.query_params.get("password", "")
    score = 0
    checks = []
    if len(password) >= 8: score += 1
    else: checks.append("At least 8 characters")
    if any(c.isupper() for c in password): score += 1
    else: checks.append("One uppercase letter")
    if any(c.islower() for c in password): score += 1
    else: checks.append("One lowercase letter")
    if any(c.isdigit() for c in password): score += 1
    else: checks.append("One number")
    if any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in password): score += 1
    else: checks.append("One special character")
    labels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"]
    colors = ["#ef4444", "#ef4444", "#eab308", "#22c55e", "#6366f1"]
    return {
        "score": min(score, 4),
        "label": labels[min(score, 4)],
        "color": colors[min(score, 4)],
        "checks": checks,
    }


@router.post("/api/update-profile")
async def api_update_profile(request: Request):
    auth = require_valid_user(request)
    user = get_user_by_id(auth["user_id"])
    data = await request.json()
    updates = {}
    if "name" in data: updates["name"] = data["name"].strip()
    if "theme" in data: updates["theme"] = data["theme"]
    if "accentColor" in data: updates["accent_color"] = data["accentColor"]
    if "fontSize" in data: updates["font_size"] = data["fontSize"]
    if "animationsEnabled" in data: updates["animations_enabled"] = 1 if data["animationsEnabled"] else 0
    if "memoryEnabled" in data: updates["memory_enabled"] = 1 if data["memoryEnabled"] else 0
    if updates:
        update_user(user["id"], updates)
    return {"success": True}


@router.delete("/api/delete-account")
async def api_delete_account(request: Request):
    auth = require_valid_user(request)
    delete_user(auth["user_id"])
    return {"success": True}
