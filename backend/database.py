import sqlite3
import os
import secrets
import uuid
import bcrypt
from datetime import datetime, timedelta
from config.settings import settings

DB_PATH = settings.database_url


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            status TEXT NOT NULL DEFAULT 'active',
            token_version INTEGER NOT NULL DEFAULT 0,
            email_verified INTEGER NOT NULL DEFAULT 0,
            verification_token TEXT,
            reset_token TEXT,
            reset_token_expires TEXT,
            created_at TEXT NOT NULL,
            last_login TEXT,
            settings TEXT DEFAULT '{}',
            theme TEXT DEFAULT 'dark',
            accent_color TEXT DEFAULT '#6366f1',
            font_size TEXT DEFAULT 'base',
            animations_enabled INTEGER DEFAULT 1,
            memory_enabled INTEGER DEFAULT 1,
            suspended_until TEXT,
            daily_limit INTEGER
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT DEFAULT 'New conversation',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            timestamp TEXT NOT NULL,
            success INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);

        CREATE TABLE IF NOT EXISTS daily_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            UNIQUE(user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    conn.commit()

    try:
        conn.execute("ALTER TABLE users ADD COLUMN suspended_until TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE users ADD COLUMN daily_limit INTEGER")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    admin_email = os.environ.get("MAYDAY_ADMIN_EMAIL", "").strip()
    admin_password = os.environ.get("MAYDAY_ADMIN_PASSWORD", "").strip()
    if admin_email and admin_password:
        cursor = conn.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
        if not cursor.fetchone():
            _create_user(conn, "Admin", admin_email, admin_password, "admin")

    conn.close()


def _create_user(conn, name, email, password, role="user"):
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO users (name, email, password_hash, role, created_at, email_verified) VALUES (?, ?, ?, ?, ?, ?)",
        (name, email, password_hash, role, now, 1 if role == "admin" else 0),
    )
    conn.commit()


def register_user(name: str, email: str, password: str) -> dict | None:
    conn = _get_conn()
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    now = datetime.utcnow().isoformat()
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role, created_at, email_verified) VALUES (?, ?, ?, ?, ?, 0)",
            (name, email, password_hash, "user", now),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return None
    cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = dict(cursor.fetchone())
    conn.close()
    return user


def verify_user(email: str, password: str) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    user = dict(row)
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return None
    conn = _get_conn()
    now = datetime.utcnow().isoformat()
    conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user["id"]))
    conn.close()
    return user


def get_user_by_id(user_id: int) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_email(email: str) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_identifier(identifier: str) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM users WHERE email = ? OR name = ?", (identifier, identifier))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_reset_token(token: str) -> dict | None:
    conn = _get_conn()
    now = datetime.utcnow().isoformat()
    cursor = conn.execute(
        "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?",
        (token, now),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user(user_id: int, data: dict) -> bool:
    conn = _get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    vals = list(data.values()) + [user_id]
    conn.execute(f"UPDATE users SET {sets} WHERE id = ?", vals)
    conn.commit()
    conn.close()
    return True


def increment_token_version(user_id: int):
    conn = _get_conn()
    conn.execute("UPDATE users SET token_version = token_version + 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def set_user_daily_limit(user_id: int, limit: int | None):
    conn = _get_conn()
    conn.execute("UPDATE users SET daily_limit = ? WHERE id = ?", (limit, user_id))
    conn.commit()
    conn.close()


def suspend_user(user_id: int, duration_minutes: int | None = None):
    conn = _get_conn()
    now = datetime.utcnow()
    if duration_minutes is None:
        new_status = "disabled"
        suspended_until = None
    else:
        new_status = "suspended"
        expires = now + timedelta(minutes=duration_minutes)
        suspended_until = expires.isoformat()
    conn.execute("UPDATE users SET status = ?, suspended_until = ?, token_version = token_version + 1 WHERE id = ?",
                 (new_status, suspended_until, user_id))
    conn.commit()
    conn.close()


def check_daily_limit(user_id: int) -> tuple[bool, int, int]:
    today = datetime.utcnow().isoformat()[:10]
    conn = _get_conn()
    row = conn.execute(
        "SELECT count FROM daily_usage WHERE user_id = ? AND date = ?", (user_id, today)
    ).fetchone()
    current = row[0] if row else 0
    user_row = conn.execute("SELECT daily_limit FROM users WHERE id = ?", (user_id,)).fetchone()
    limit = user_row["daily_limit"] if user_row and user_row["daily_limit"] is not None else settings.daily_message_limit
    conn.close()
    return current < limit, current, limit


def increment_daily_usage(user_id: int):
    today = datetime.utcnow().isoformat()[:10]
    conn = _get_conn()
    conn.execute(
        "INSERT INTO daily_usage (user_id, date, count) VALUES (?, ?, 1) "
        "ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1",
        (user_id, today),
    )
    conn.commit()
    conn.close()


def get_user_status(user_id: int) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT id, status, token_version, suspended_until FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def list_users() -> list[dict]:
    conn = _get_conn()
    cursor = conn.execute(
        "SELECT id, name, email, role, status, email_verified, created_at, last_login, suspended_until, daily_limit FROM users WHERE role != 'admin' ORDER BY created_at DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_user(user_id: int) -> bool:
    conn = _get_conn()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return True


def log_login(user_id: int, ip: str = "", agent: str = "", success: bool = True):
    conn = _get_conn()
    conn.execute(
        "INSERT INTO login_history (user_id, ip_address, user_agent, timestamp, success) VALUES (?, ?, ?, ?, ?)",
        (user_id, ip, agent, datetime.utcnow().isoformat(), 1 if success else 0),
    )
    conn.commit()
    conn.close()


def get_stats() -> dict:
    conn = _get_conn()
    total_users = conn.execute("SELECT COUNT(*) FROM users WHERE role != 'admin'").fetchone()[0]
    active_users = conn.execute("SELECT COUNT(*) FROM users WHERE role != 'admin' AND status = 'active'").fetchone()[0]
    today = datetime.utcnow().isoformat()[:10]
    new_today = conn.execute("SELECT COUNT(*) FROM users WHERE role != 'admin' AND created_at LIKE ?", (f"{today}%",)).fetchone()[0]
    total_sessions = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    total_messages = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    unique_logins_today = conn.execute(
        "SELECT COUNT(DISTINCT user_id) FROM login_history WHERE timestamp LIKE ? AND success = 1",
        (f"{today}%",),
    ).fetchone()[0]
    conn.close()
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "newToday": new_today,
        "totalConversations": total_sessions,
        "totalMessages": total_messages,
        "onlineNow": unique_logins_today,
    }


# --- Memory ---
def get_memories(user_id: int) -> list[dict]:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM memories WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_memory(user_id: int, key: str, value: str, category: str = "general") -> dict:
    conn = _get_conn()
    now = datetime.utcnow().isoformat()
    cursor = conn.execute(
        "SELECT id FROM memories WHERE user_id = ? AND key = ?", (user_id, key)
    )
    existing = cursor.fetchone()
    if existing:
        conn.execute(
            "UPDATE memories SET value = ?, updated_at = ? WHERE id = ?",
            (value, now, existing[0]),
        )
    else:
        conn.execute(
            "INSERT INTO memories (user_id, key, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, key, value, category, now, now),
        )
    conn.commit()
    conn.close()
    return {"key": key, "value": value, "category": category}


def delete_memory(memory_id: int, user_id: int) -> bool:
    conn = _get_conn()
    conn.execute("DELETE FROM memories WHERE id = ? AND user_id = ?", (memory_id, user_id))
    conn.commit()
    conn.close()
    return True


def delete_all_memories(user_id: int):
    conn = _get_conn()
    conn.execute("DELETE FROM memories WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


# --- Sessions ---
def create_session_db(user_id: int, title: str = "New conversation") -> dict:
    conn = _get_conn()
    sid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (sid, user_id, title, now, now),
    )
    conn.commit()
    conn.close()
    return {"id": sid, "user_id": user_id, "title": title, "createdAt": now, "updatedAt": now}


def get_session_db(session_id: str) -> dict | None:
    conn = _get_conn()
    cursor = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    s = dict(row)
    msgs = conn.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp", (session_id,))
    s["messages"] = [dict(m) for m in msgs.fetchall()]
    conn.close()
    return s


def list_sessions_db(user_id: int) -> list[dict]:
    conn = _get_conn()
    cursor = conn.execute(
        "SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count, "
        "(SELECT content FROM messages m WHERE m.session_id = s.id ORDER BY m.timestamp DESC LIMIT 1) as preview "
        "FROM sessions s WHERE s.user_id = ? ORDER BY s.updated_at DESC", (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_session_db(session_id: str, data: dict) -> bool:
    conn = _get_conn()
    data["updated_at"] = datetime.utcnow().isoformat()
    sets = ", ".join(f"{k} = ?" for k in data)
    vals = list(data.values()) + [session_id]
    conn.execute(f"UPDATE sessions SET {sets} WHERE id = ?", vals)
    conn.commit()
    conn.close()
    return True


def delete_session_db(session_id: str) -> bool:
    conn = _get_conn()
    conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return True


def add_message_db(session_id: str, role: str, content: str) -> dict:
    conn = _get_conn()
    mid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
        (mid, session_id, role, content, now),
    )
    conn.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (now, session_id))
    conn.commit()
    conn.close()
    return {"id": mid, "role": role, "content": content, "timestamp": now}
