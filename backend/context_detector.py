from __future__ import annotations
import asyncio
import sys
import time
from dataclasses import dataclass
from typing import Awaitable, Callable, Optional
import os

POLL_INTERVAL_SECONDS = 0.7
DEBOUNCE_SECONDS = 1.5

if sys.platform == "win32":
    import win32api
    import win32con
    import win32gui
    import win32process
    import psutil
else:
    win32api = None
    win32con = None
    win32gui = None
    win32process = None
    psutil = None

@dataclass
class DetectedContext:
    mode_id: str
    app_name: Optional[str]
    process_name: Optional[str]

CUE_PID = int(os.environ["CUE_PID"]) if os.environ.get("CUE_PID") else None

def _is_foreground_fullscreen(hwnd) -> bool:
    if win32api is None or hwnd is None:
        return False
    try:
        monitor = win32api.MonitorFromWindow(hwnd, win32con.MONITOR_DEFAULTTONEAREST)
        monitor_rect = win32api.GetMonitorInfo(monitor)["Monitor"]
        window_rect = win32gui.GetWindowRect(hwnd)
        return window_rect == monitor_rect
    except Exception:
        return False

def _get_foreground_snapshot() -> tuple[Optional[str], Optional[str], bool]:
    if win32gui is None:
        return None, None, False
    hwnd = win32gui.GetForegroundWindow()
    if not hwnd:
        return None, None, False
    title = win32gui.GetWindowText(hwnd) or None
    is_fullscreen = _is_foreground_fullscreen(hwnd)
    try:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process_name = psutil.Process(pid).name()
    except (psutil.NoSuchProcess, psutil.AccessDenied, OSError):
        process_name = None
    return process_name, title, is_fullscreen

def resolve_mode(process_name: Optional[str], modes: list[dict], is_fullscreen: bool = False) -> str:
    if process_name:
        lowered = process_name.lower()
        for mode in modes:
            if mode["id"] == "idle":
                continue
            for pattern in mode["processPatterns"]:
                if pattern.lower() in lowered:
                    return mode["id"]
    if is_fullscreen:
        return "gaming"
    return "idle"

class ContextDetector:
    def __init__(
        self,
        get_modes: Callable[[], list[dict]],
        on_change: Callable[[DetectedContext], Awaitable[None]],
    ):
        self._get_modes = get_modes
        self._on_change = on_change
        self._task: Optional[asyncio.Task] = None
        self._commited: Optional[DetectedContext] = None
        self._candidate_mode_id: Optional[str] = None
        self._candidate_since: Optional[float] = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _run(self) -> None:
        while True:
            process_name, title, is_fullscreen = await asyncio.get_running_loop().run_in_executor(
                None, _get_foreground_snapshot
            )
            modes = self._get_modes()
            mode_id = resolve_mode(process_name, modes, is_fullscreen)
            now = time.monotonic()
            if self._commited is None:
                self._commited = DetectedContext(mode_id, title, process_name)
                self._candidate_mode_id = mode_id
                self._candidate_since = now
                await self._on_change(self._commited)
            elif mode_id == self._commited.mode_id:
                self._candidate_mode_id = mode_id
                self._candidate_since = now
                if title != self._commited.app_name:
                    self._commited = DetectedContext(mode_id, title, process_name)
                    await self._on_change(self._commited)
            else:
                if mode_id != self._candidate_mode_id:
                    self._candidate_mode_id = mode_id
                    self._candidate_since = now
                elif now - self._candidate_since >= DEBOUNCE_SECONDS:
                    self._commited = DetectedContext(mode_id, title, process_name)
                    await self._on_change(self._commited)
            await asyncio.sleep(POLL_INTERVAL_SECONDS)