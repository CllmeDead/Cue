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