import json
import os
import uuid
from datetime import datetime
from typing import Optional

SESSIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(SESSIONS_DIR, exist_ok=True)


def _session_path(session_id: str) -> str:
    return os.path.join(SESSIONS_DIR, f"{session_id}.json")


def _get_default_settings():
    return {
        "theme": "dark",
        "fontSize": "base",
        "temperature": 0.7,
    }


def create_session(user_id: int = 0) -> dict:
    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "user_id": user_id,
        "title": "New conversation",
        "messages": [],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
        "pinned": False,
        "settings": _get_default_settings(),
    }
    with open(_session_path(session_id), "w", encoding="utf-8") as f:
        json.dump(session, f, indent=2)
    return session


def get_session(session_id: str) -> Optional[dict]:
    path = _session_path(session_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def update_session(session_id: str, data: dict) -> Optional[dict]:
    session = get_session(session_id)
    if not session:
        return None
    session.update(data)
    session["updatedAt"] = datetime.utcnow().isoformat()
    with open(_session_path(session_id), "w", encoding="utf-8") as f:
        json.dump(session, f, indent=2)
    return session


def delete_session(session_id: str) -> bool:
    path = _session_path(session_id)
    if not os.path.exists(path):
        return False
    os.remove(path)
    return True


def list_sessions(user_id: int = 0) -> list[dict]:
    sessions = []
    if not os.path.exists(SESSIONS_DIR):
        return sessions
    for fname in sorted(os.listdir(SESSIONS_DIR), reverse=True):
        if not fname.endswith(".json"):
            continue
        if fname == "users.db":
            continue
        try:
            with open(os.path.join(SESSIONS_DIR, fname), "r", encoding="utf-8") as f:
                session = json.load(f)
            sid = session.get("user_id", 0)
            if sid != user_id:
                continue
            sessions.append({
                "id": session["id"],
                "title": session["title"],
                "createdAt": session["createdAt"],
                "updatedAt": session["updatedAt"],
                "pinned": session.get("pinned", False),
                "messageCount": len(session.get("messages", [])),
                "preview": session["messages"][-1]["content"][:100] if session.get("messages") else "",
            })
        except (json.JSONDecodeError, IOError):
            continue
    return sessions


def add_message(session_id: str, role: str, content: str) -> Optional[dict]:
    session = get_session(session_id)
    if not session:
        return None
    messages = session.get("messages", [])
    messages.append({
        "id": str(uuid.uuid4()),
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
    })
    return update_session(session_id, {"messages": messages})
