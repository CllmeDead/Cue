from __future__ import annotations
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
import app_index
import database
import currency
import download_manager
import file_convert
import translation
from context_detector import ContextDetector, DetectedContext
from models import ( HealthOut, ModeOut, AppOut, ClipboardEntryIn, ClipboardEntryOut, ConvertRequestIn, ConvertResultOut, CurrencyConvertOut, DownloadJobOut, DownloadRequestIn, ShelfItemIn, ShelfItemOut, TranslateOut, ProcessOut, SnippetIn, SnippetOut, SystemStatsOut, )
from modes_seed import DEFAULT_MODES

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db(DEFAULT_MODES)
    global _apps_cache
    _apps_cache = app_index.scan_apps()
    global _detector
    _detector = ContextDetector(get_modes=_current_modes, on_change=_broadcast_context)
    _detector.start()
    try:
        yield
    finally:
        if _detector is not None:
            await _detector.stop()

app = FastAPI(title="Cue Backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
_active_sockets: set[WebSocket] = set()
_detector: ContextDetector | None = None
_apps_cache: list[dict] = []

def _current_modes() -> list[dict]:
    return database.fetch_all_modes()

async def _broadcast_context(ctx: DetectedContext) -> None:
    database.record_mode_transition(ctx.mode_id, ctx.app_name)
    payload = {
        "mode_id": ctx.mode_id,
        "app_name": ctx.app_name,
        "process_name": ctx.process_name,
    }
    dead: list[WebSocket] = []
    for ws in _active_sockets:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _active_sockets.discard(ws)

@app.get("/health", response_model=HealthOut)
async def health() -> HealthOut:
    return HealthOut(status="ok")

@app.get("/modes", response_model=list[ModeOut])
async def list_modes() -> list[ModeOut]:
    return [ModeOut(**mode) for mode in database.fetch_all_modes()]

@app.get("/apps", response_model=list[AppOut])
async def list_apps() -> list[AppOut]:
    return [AppOut(**app_entry) for app_entry in _apps_cache]

@app.get("/apps/rescan", response_model=list[AppOut])
async def rescan_apps() -> list[AppOut]:
    global _apps_cache
    _apps_cache = await asyncio.get_running_loop().run_in_executor(None, app_index.scan_apps)
    return [AppOut(**app_entry) for app_entry in _apps_cache]

@app.get("/clipboard-history", response_model=list[ClipboardEntryOut])
async def get_clipboard_history(limit: int = 100) -> list[ClipboardEntryOut]:
    return [ClipboardEntryOut(**entry) for entry in database.fetch_recent_clipboard_entries(limit)]

@app.post("/clipboard-history", response_model=ClipboardEntryOut)
async def add_clipboard_entry(entry: ClipboardEntryIn) -> ClipboardEntryOut:
    return ClipboardEntryOut(**database.insert_clipboard_entry(entry.content))

@app.delete("/clipboard-history/{entry_id}")
async def delete_clipboard_entry(entry_id: int) -> dict:
    deleted = database.delete_clipboard_entry(entry_id)
    return {"deleted": deleted}

@app.get("/currency/convert", response_model=CurrencyConvertOut)
async def convert_currency(amount: float, from_currency: str, to_currency: str) -> CurrencyConvertOut:
    try:
        result = await currency.convert(amount, from_currency, to_currency)
    except (ValueError, KeyError) as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception:
        raise HTTPException(status_code=502, detail="Currency service unavailable")
    return CurrencyConvertOut(**result)

@app.get("/currency/symbols")
async def currency_symbols() -> dict:
    return await currency.get_supported_symbols()

@app.get("/translate", response_model=TranslateOut)
async def translate_text(text: str, source: str = "en", target: str = "es") -> TranslateOut:
    try:
        translated = await translation.translate(text, source, target)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception:
        raise HTTPException(status_code=502, detail="Translation service unavailable")
    return TranslateOut(translated=translated, source=source, target=target)

@app.post("/downloads", response_model=DownloadJobOut)
async def start_download(request: DownloadRequestIn) -> DownloadJobOut:
    job_id = download_manager.create_job(request.url, request.audio_only)
    asyncio.get_running_loop().run_in_executor(
        None,
        download_manager.run_job,
        job_id,
    )
    job = download_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return DownloadJobOut(**job)

@app.get("/downloads/{job_id}", response_model=DownloadJobOut)
async def get_download(job_id: str) -> DownloadJobOut:
    job = download_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=400, detail="No such download job")
    return DownloadJobOut(**job)

@app.post("/convert", response_model=ConvertResultOut)
async def convert_file(request: ConvertRequestIn) -> ConvertResultOut:
    try:
        output_path = await asyncio.get_running_loop().run_in_executor(
            None, file_convert.convert_image, request.source_path, request.target_format
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Source file not found")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {err}")
    return ConvertResultOut(output_path=output_path)

@app.get("/shelf", response_model=list[ShelfItemOut])
async def get_shelf() -> list[ShelfItemOut]:
    return [ShelfItemOut(**item) for item in database.fetch_shelf_items()]

@app.post("/shelf", response_model=ShelfItemOut)
async def add_shelf_item(item: ShelfItemIn) -> ShelfItemOut:
    return ShelfItemOut(**database.add_shelf_item(item.path))

@app.delete("/shelf/{item_id}")
async def delete_shelf_item(item_id: int) -> dict:
    removed = database.remove_shelf_item(item_id)
    if not removed:
        raise HTTPException(status_code=404, detail="No such shelf item")
    return {"removed": True}

@app.get("/system/stats", response_model=SystemStatsOut)
async def get_system_stats() -> SystemStatsOut:
    stats = await asyncio.get_running_loop().run_in_executor(None, system_stats.get_system_stats)
    return SystemStatsOut(**stats)

@app.get("/system/processes", response_model=list[ProcessOut])
async def get_top_processes(limit: int = 5) -> list[ProcessOut]:
    processes = await asyncio.get_running_loop().run_in_executor(None, system_stats.get_top_processes, limit)
    return [ProcessOut(**p) for p in processes]

@app.get("/snippets", response_model=list[SnippetOut])
async def list_snippets() -> list[SnippetOut]:
    return [SnippetOut(**s) for s in database.fetch_snippets()]

@app.post("/snippets", response_model=SnippetOut)
async def save_snippet(snippet: SnippetIn) -> SnippetOut:
    return SnippetOut(**database.upsert_snippet(snippet.name, snippet.content))

@app.delete("/snippets/{item_id}")
async def delete_snippet(item_id: int) -> dict:
    removed = database.remove_snippet(item_id)
    if not removed:
        raise HTTPException(status_code=404, detail="No such snippet")
    return {"removed": True}

@app.websocket("/ws/context")
async def ws_context(websocket: WebSocket) -> None:
    await websocket.accept()
    _active_sockets.add(websocket)
    try:
        await websocket.send_json({
            "mode_id": "idle",
            "app_name": None,
            "process_name": None,
            "modes": database.fetch_all_modes(),
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _active_sockets.discard(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("CUE_BACKEND_PORT", "8756"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")