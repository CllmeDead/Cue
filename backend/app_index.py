from __future__ import annotations
import os
import sys
from pathlib import Path

if sys.platform == "win32":
    import win32com.client
else:
    win32com = None

def _start_menu_dirs() -> list[Path]:
    dirs = []
    appdata = os.environ.get("APPDATA")
    if appdata:
        dirs.append(Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs")
    programdata = os.environ.get("PROGRAMDATA")
    if programdata:
        dirs.append(Path(programdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs")
    return [d for d in dirs if d.is_dir()]

def scan_apps() -> list[dict]:
    if win32com is None:
        return []
    shell = win32com.client.Dispatch("WScript.Shell")
    apps: dict[str, dict] = {}
    for base_dir in _start_menu_dirs():
        for lnk_path in base_dir.rglob("*.lnk"):
            try:
                shortcut = shell.CreateShortcut(str(lnk_path))
                target = shortcut.TargetPath
                if not target or not os.path.isfile(target):
                    continue
                name = lnk_path.stem
                key = name.lower()
                if key in apps:
                    continue
                apps[key] = {
                    "id": key,
                    "name": name,
                    "targetPath": target,
                    "arguments": shortcut.Arguments or "",
                }
            except Exception:
                continue
    return sorted(apps.values(), key=lambda a: a["name"].lower())