import json
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.llm import generate_response_stream, generate_title
from database import (
    create_session_db, get_session_db, update_session_db, delete_session_db,
    list_sessions_db, add_message_db, check_daily_limit, increment_daily_usage,
)
from services.auth import require_valid_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user_id(request: Request) -> int:
    try:
        auth = require_valid_user(request)
        return auth["user_id"]
    except HTTPException:
        return 0


@router.get("/")
async def root():
    return {"service": "AVIOS API", "status": "running", "version": "1.0.0"}


@router.get("/health")
async def health():
    return {"status": "healthy"}


@router.post("/api/new-session")
async def api_new_session(request: Request):
    user_id = _get_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    session = create_session_db(user_id)
    return {"session": {"id": session["id"], "title": session["title"], "createdAt": session["createdAt"], "updatedAt": session["updatedAt"]}}


@router.get("/api/history")
async def api_history(request: Request):
    user_id = _get_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    sessions = list_sessions_db(user_id)
    return {"sessions": sessions}


@router.get("/api/session/{session_id}")
async def api_get_session(session_id: str, request: Request):
    session = get_session_db(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": session}


@router.delete("/api/session/{session_id}")
async def api_delete_session(session_id: str, request: Request):
    session = get_session_db(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    delete_session_db(session_id)
    return {"deleted": True}


@router.get("/api/usage")
async def api_usage(fastapi_request: Request):
    user_id = _get_user_id(fastapi_request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    under, used, limit = check_daily_limit(user_id)
    return {"used": used, "limit": limit, "remaining": limit - used}


@router.post("/api/chat")
async def api_chat(request: ChatRequest, fastapi_request: Request):
    user_id = _get_user_id(fastapi_request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    auth = require_valid_user(fastapi_request)
    if auth["role"] != "admin":
        under_limit, used, limit = check_daily_limit(user_id)
        if not under_limit:
            raise HTTPException(status_code=429, detail=f"Daily message limit reached ({limit}/{limit}). Resets at midnight UTC.")

    session_id = request.session_id
    if not session_id:
        session = create_session_db(user_id)
        session_id = session["id"]
    else:
        session = get_session_db(session_id)
        if not session:
            session = create_session_db(user_id)
            session_id = session["id"]

    add_message_db(session_id, "user", request.message)
    if auth["role"] != "admin":
        increment_daily_usage(user_id)

    messages = [{"role": m.role, "content": m.content} for m in request.history]
    messages.append({"role": "user", "content": request.message})

    async def stream():
        full_content = ""
        try:
            async for chunk in generate_response_stream(messages):
                full_content += chunk
                yield f"data: {json.dumps({'content': chunk, 'sessionId': session_id})}\n\n"

            add_message_db(session_id, "assistant", full_content)

            title = session.get("title", "")
            if (not title or title == "New conversation") and len(full_content) > 0:
                try:
                    title_result = await generate_title(
                        [{"role": "user", "content": request.message}]
                    )
                    if title_result:
                        update_session_db(session_id, {"title": title_result})
                        yield f"data: {json.dumps({'done': True, 'sessionId': session_id, 'title': title_result})}\n\n"
                        return
                except Exception:
                    pass

            yield f"data: {json.dumps({'done': True, 'sessionId': session_id})}\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e), 'sessionId': session_id})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/api/generate-title")
async def api_generate_title(request: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.history]
        messages.append({"role": "user", "content": request.message})
        title = await generate_title(messages)
        if not title:
            words = request.message.strip().split()[:5]
            title = " ".join(words)
            if len(title) > 40:
                title = title[:40] + "..."
        return {"title": title}
    except Exception as e:
        logger.error(f"Title generation error: {e}")
        return {"title": request.message.strip()[:40]}


@router.post("/api/settings")
async def api_update_settings(request: Request):
    data = await request.json()
    session_id = data.get("sessionId")
    settings_data = data.get("settings", {})
    if session_id:
        session = get_session_db(session_id)
        if session:
            current_settings = session.get("settings", {})
            current_settings.update(settings_data)
            update_session_db(session_id, {"settings": json.dumps(current_settings)})
    return {"saved": True}
