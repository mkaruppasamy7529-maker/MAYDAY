import logging
import csv
import io
import bcrypt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from database import get_user_by_id, list_users, delete_user, update_user, get_stats, get_session_db, list_sessions_db, increment_token_version, suspend_user, set_user_daily_limit
from services.auth import require_valid_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _require_admin(request: Request):
    auth = require_valid_user(request)
    if auth["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return auth


@router.get("/api/admin/stats")
async def api_admin_stats(request: Request):
    _require_admin(request)
    return get_stats()


@router.get("/api/admin/users")
async def api_admin_users(request: Request):
    _require_admin(request)
    users = list_users()
    return {"users": users}


@router.get("/api/admin/users/search")
async def api_admin_search_users(request: Request):
    _require_admin(request)
    q = request.query_params.get("q", "").strip().lower()
    users = list_users()
    if q:
        users = [u for u in users if q in u["name"].lower() or q in u["email"].lower()]
    return {"users": users}


@router.get("/api/admin/users/{user_id}")
async def api_admin_get_user(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}


@router.delete("/api/admin/users/{user_id}")
async def api_admin_delete_user(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin account")

    increment_token_version(user_id)
    delete_user(user_id)
    return {"success": True}


@router.post("/api/admin/users/{user_id}/toggle-status")
async def api_admin_toggle_status(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = "disabled" if user["status"] == "active" else "active"
    update_user(user_id, {"status": new_status})
    increment_token_version(user_id)
    return {"status": new_status}


@router.post("/api/admin/users/{user_id}/limit")
async def api_admin_set_user_limit(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = await request.json()
    limit = data.get("limit")
    if limit is not None and (not isinstance(limit, int) or limit < 1):
        raise HTTPException(status_code=400, detail="Limit must be a positive integer or null to reset")
    set_user_daily_limit(user_id, limit)
    if limit:
        return {"limit": limit, "message": f"Daily limit set to {limit}"}
    else:
        return {"limit": None, "message": "Daily limit reset to default"}


@router.post("/api/admin/users/{user_id}/suspend")
async def api_admin_suspend_user(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot suspend admin account")
    data = await request.json()
    action = data.get("action", "")
    if action == "permanent":
        suspend_user(user_id, duration_minutes=None)
        return {"status": "disabled", "message": "User permanently blocked"}
    elif action == "suspend":
        value = data.get("value", 0)
        unit = data.get("unit", "minutes")
        multipliers = {"seconds": 1/60, "minutes": 1, "hours": 60, "days": 1440}
        multiplier = multipliers.get(unit, 1)
        duration = int(value * multiplier)
        if duration < 1:
            raise HTTPException(status_code=400, detail="Duration too short")
        suspend_user(user_id, duration_minutes=duration)
        return {"status": "suspended", "message": f"User suspended for {value} {unit}"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")


@router.post("/api/admin/users/{user_id}/reset-password")
async def api_admin_reset_password(user_id: int, request: Request):
    _require_admin(request)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = await request.json()
    new_password = data.get("newPassword", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    update_user(user_id, {"password_hash": new_hash})
    increment_token_version(user_id)
    return {"success": True}


@router.get("/api/admin/users/{user_id}/sessions")
async def api_admin_user_sessions(user_id: int, request: Request):
    _require_admin(request)
    sessions = list_sessions_db(user_id)
    return {"sessions": sessions}


@router.get("/api/admin/users/{user_id}/session/{session_id}")
async def api_admin_user_session(user_id: int, session_id: str, request: Request):
    _require_admin(request)
    session = get_session_db(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": session}


@router.get("/api/admin/export-users")
async def api_admin_export_users(request: Request):
    _require_admin(request)
    users = list_users()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Role", "Status", "Email Verified", "Created At", "Last Login"])
    for u in users:
        writer.writerow([u["id"], u["name"], u["email"], u["role"], u["status"], u["email_verified"], u["created_at"], u.get("last_login", "")])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )
