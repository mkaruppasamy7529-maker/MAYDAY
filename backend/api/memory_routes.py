import logging
from fastapi import APIRouter, HTTPException, Request
from database import get_memories, add_memory, delete_memory, delete_all_memories
from services.auth import require_valid_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/memories")
async def api_get_memories(request: Request):
    auth = require_valid_user(request)
    memories = get_memories(auth["user_id"])
    return {"memories": memories}


@router.post("/api/memories")
async def api_add_memory(request: Request):
    auth = require_valid_user(request)
    data = await request.json()
    key = data.get("key", "").strip()
    value = data.get("value", "").strip()
    category = data.get("category", "general")
    if not key or not value:
        raise HTTPException(status_code=400, detail="Key and value required")
    memory = add_memory(auth["user_id"], key, value, category)
    return {"memory": memory}


@router.delete("/api/memories/{memory_id}")
async def api_delete_memory(memory_id: int, request: Request):
    auth = require_valid_user(request)
    if not delete_memory(memory_id, auth["user_id"]):
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"success": True}


@router.delete("/api/memories")
async def api_clear_memories(request: Request):
    auth = require_valid_user(request)
    delete_all_memories(auth["user_id"])
    return {"success": True}
