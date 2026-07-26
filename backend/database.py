from __future__ import annotations
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

APP_DIR_NAME = "Cue"
CLIPBOARD_HISTORY_CAP = 200

def get_app_data_dir() -> Path:
    if os.name == "nt":
        base = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    elif os.uname().sysname == "Darwin":
        base = str(Path.home() / "Library" / "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
    app_dir = Path(base) / APP_DIR_NAME
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir

def get_db_path() -> Path:
    return get_app_data_dir() / "cue.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS modes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    icon TEXT NOT NULL,
    process_patterns TEXT NOT NULL DEFAULT '[]', --JSON array of strings
    is_custom INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mode_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode_id TEXT NOT NULL REFERENCES modes(id),
    app_name TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT
);

CREATE TABLE IF NOT EXISTS clipboard_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_started_at ON mode_history(started_at);

CREATE TABLE IF NOT EXISTS file_shelf (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    added_at    TEXT NOT NULL
);
"""
@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(get_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db(default_modes: list[dict]) -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        existing = conn.execute("SELECT COUNT(*) AS n FROM modes").fetchone()["n"]
        if existing == 0:
            for order, mode in enumerate(default_modes):
                conn.execute(
                    """
                    INSERT INTO modes (id, name, accent_color, icon, process_patterns, is_custom, sort_order)
                    VALUES (?, ?, ?, ?, ?, 0, ?)
                    """,
                    (
                        mode["id"],
                        mode["name"],
                        mode["accentColor"],
                        mode["icon"],
                        json.dumps(mode["processPatterns"]),
                        order,
                    ),
                )

def fetch_all_modes() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM modes ORDER BY sort_order ASC").fetchall()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "accentColor": row["accent_color"],
            "icon": row["icon"],
            "processPatterns": json.loads(row["process_Patterns"]),
            "isCustom": bool(row["is_custom"]),
        }
        for row in rows
    ]

def insert_clipboard_entry(content: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        last = conn.execute(
            "SELECT content FROM clipboard_history ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if last and last["content"] == content:
            row = conn.execute(
                "SELECT id, content, created_at FROM clipboard_history ORDER BY id DESC LIMIT 1"
            ).fetchone()
            return dict(row)
        cursor = conn.execute(
            "INSERT INTO clipboard_history (content, created_at) VALUES (?, ?)",
            (content, now),
        )
        conn.execute(
            """
            DELETE FROM clipboard_history
            WHERE id NOT IN (
                SELECT id FROM clipboard_history ORDER BY id DESC LIMIT ?
            )
            """,
            (CLIPBOARD_HISTORY_CAP,),
        )
        return {"id": cursor.lastrowid, "content": content, "created_at": now}
    
def fetch_recent_clipboard_entries(limit: int = 100) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, content, created_at FROM clipboard_history ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]

def delete_clipboard_entry(entry_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM clipboard_history WHERE id = ?", (entry_id,))
        return cursor.rowcount > 0

def record_mode_transition(mode_id: str, app_name: str | None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE mode_history SET ended_at = ? WHERE ended_at IS NULL",
            (now,),
        )
        conn.execute(
            "INSERT INTO mode_history (mode_id, app_name, started_at) VALUES (?, ?, ?)",
            (mode_id, app_name, now),
        )

def add_shelf_item(path: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    name = Path(path).name
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id, path, name, added_at FROM file_shelf WHERE path = ?", (path,)
        ).fetchone()
        if existing:
            return dict(existing)
        cursor = conn.execute(
            "INSERT INTO file_shelf (path, name, added_at) VALUES (?, ?, ?)",
            (path, name, now),
        )
        return {"id": cursor.lastrowid, "path": path, "name": name, "added_at": now}

def fetch_shelf_items() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, path, name, added_at FROM file_shelf ORDER BY id DESC"
        ).fetchall()
    return [dict(row) for row in rows]

def remove_shelf_item(item_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM file_shelf WHERE id = ?", (item_id,))
        return cursor.rowcount > 0