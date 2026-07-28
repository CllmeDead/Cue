from __future__ import annotations
import sys
import psutil

_DISK_PATH = "C:\\" if sys.platform == "win32" else "/"

def get_system_stats() -> dict:
    cpu_percent = psutil.cpu_percent(interval=0.3)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(_DISK_PATH)

    return {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_used_gb": round(memory.used / (1024 ** 3), 1),
        "memory_total_gb": round(memory.total / (1024 ** 3), 1),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024 ** 3), 1),
        "disk_total_gb": round(disk.total / (1024 ** 3), 1),
    }

def get_top_processes(limit: int = 5) -> list[dict]:
    processes = []
    for proc in psutil.process_iter(["pid", "name", "memory_info"]):
        try:
            info = proc.info
            if info["memory_info"] is None:
                continue
            processes.append({
                "pid": info["pid"],
                "name": info["name"],
                "memory_mb": round(info["memory_info"].rss / (1024 ** 2), 1),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(key=lambda p: p["memory_mb"], reverse=True)
    return processes[:limit]