from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field

class ModeOut(BaseModel):
    id: str
    name: str
    accentColor: str
    icon: str
    processPatterns: list[str]
    isCustom: bool

class ContextUpdate(BaseModel):
    mode_id: str
    app_name: str | None = None
    process_name: str | None = None
    modes: list[ModeOut] | None = None

class HealthOut(BaseModel):
    status: str

class AppOut(BaseModel):
    id: str
    name: str
    targetPath: str
    arguments: str

class ClipboardEntryOut(BaseModel):
    id: int
    content: str
    created_at: str

class ClipboardEntryIn(BaseModel):
    content: str

class CurrencyConvertOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    amount: float
    from_: str = Field(alias="from")
    to: str
    result: float
    rate: float

class TranslateOut(BaseModel):
    translated: str
    source: str
    target: str

class DownloadRequestIn(BaseModel):
    url: str
    audio_only: bool = False

class DownloadJobOut(BaseModel):
    id: str
    url: str
    status: str
    percent: float | None
    error: str | None
    filename: str | None

class ConvertRequestIn(BaseModel):
    source_path: str
    target_format: str

class ConvertResultOut(BaseModel):
    output_path: str

class ShelfItemOut(BaseModel):
    id: int
    path: str
    name: str
    added_at: str

class ShelfItemIn(BaseModel):
    path: str

class SystemStatsOut(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_total_gb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float

class ProcessOut(BaseModel):
    pid: int
    name: str
    memory_mb: float

class SnippetOut(BaseModel):
    id: int
    name: str
    content: str
    created_at: str

class SnippetIn(BaseModel):
    name: str
    content: str

class MediaControlIn(BaseModel):
    action: str

class MicMuteOut(BaseModel):
    muted: bool

class TriggerUsageIn(BaseModel):
    trigger_key: str
    mode_id: str

class TriggerUsageOut(BaseModel):
    trigger_key: str
    count: int

class FavoriteAppIn(BaseModel):
    id: str
    name: str
    targetPath: str
    arguments: str = ""