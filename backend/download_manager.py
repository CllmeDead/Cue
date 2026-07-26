from __future__ import annotations
import uuid
from pathlib import Path
from typing import Literal
import yt_dlp

DOWNLOAD_DIR = Path.home() / "Downloads" / "Cue"
JobStatus = Literal["queued", "downloading", "finished", "error"]
_jobs: dict[str, dict] = {}

def _progress_hook(job_id: str):
    def hook(d: dict) -> None:
        job = _jobs.get(job_id)
        if job is None:
            return
        if d["status"] == "downloading":
            downloaded = d.get("downloaded_bytes") or 0
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            percent = round((downloaded / total) * 100, 1) if total else None
            job.update(status="downloading", percent=percent, speed=d.get("speed"), eta=d.get("eta"))
        elif d["status"] == "finished":
            job.update(percent=100, filename=d.get("filename"))
        elif d["status"] == "error":
            job.update(status="error", error="yt-dlp reported an error mid-download")
    return hook

def create_job(url: str, audio_only: bool = False) -> str:
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {
        "id": job_id,
        "url": url,
        "audio_only": audio_only,
        "status": "queued",
        "percent": 0,
        "error": None,
        "filename": None,
    }
    return job_id

def run_job(job_id: str) -> None:
    job = _jobs[job_id]
    url = job["url"]
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    job["status"] = "downloading"
    options = {
        "quiet": True,
        "nonplaylist": True,
        "outtmpl": str(DOWNLOAD_DIR / "%(title)s.%(ext)s"),
        "format": "bestaudio/best" if job.get("audio_only") else "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "progress_hooks": [_progress_hook(job_id)],
    }
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])
        job["status"] = "finished"
        job["percent"] = 100
    except Exception as err:
        job["status"] = "error"
        job["error"] = str(err)

def get_job(job_id: str) -> dict | None:
    return _jobs.get(job_id)