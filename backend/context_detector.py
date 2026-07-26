from __future__ import annotations
import asyncio
import sys
from dataclasses import dataclass
from typing import Awaitable, Callable, Optional
import os


POLL_INTERVAL_SECONDS = 0.7
if sys.platform == "win32":
    import win32gui
    import win32process
    import psutil
else:
    win32gui = None
    win32process = None
    psutil = None

@dataclass
class DetectedContext:
    mode_id: str
    app_name: Optional[str]
    process_name: Optional[str]

CUE_PID = int(os.environ["CUE_PID"]) if os.environ.get("CUE_PID") else None

def _get_foreground_process_and_title() -> tuple[Optional[str], Optional[str], Optional[int]]:
    if win32gui is None:
        return None, None, None
    hwnd = win32gui.GetForegroundWindow()
    if not hwnd:
        return None, None, None
    title = win32gui.GetWindowText(hwnd) or None
    try:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process_name = psutil.Process(pid).name()
    except (psutil.NoSuchProcess, psutil.AccessDenied, OSError):
        process_name = None
        pid = None
    return process_name, title, pid

def resolve_mode(process_name: Optional[str], modes: list[dict]) -> str:
    if not process_name:
        return "idle"
    lowered = process_name.lower()
    for mode in modes:
        if mode["id"] == "idle":
            continue
        for pattern in mode["processPatterns"]:
            if pattern.lower() in lowered:
                return mode["id"]
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
        self._last: Optional[DetectedContext] = None
    
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
            process_name, title, pid = await asyncio.get_running_loop().run_in_executor(
                None, _get_foreground_process_and_title
            )
            if pid is not None and CUE_PID is not None and pid == CUE_PID:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                continue
            modes = self._get_modes()
            mode_id = resolve_mode(process_name, modes)
            current = DetectedContext(mode_id=mode_id, app_name=title, process_name=process_name)
            changed = (
                self._last is None
                or current.mode_id != self._last.mode_id
                or current.app_name != self._last.app_name
            )
            if changed:
                self._last = current
                await self._on_change(current)
            await asyncio.sleep(POLL_INTERVAL_SECONDS)