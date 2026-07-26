from __future__ import annotations
import httpx

MYMEMORY_URL = "http://api.mymemory.translated.net/get"
MAX_INPUT_CHARS = 500
_cache: dict[tuple[str, str], str] = {}

async def translate(text: str, source_lang: str, target_lang: str) -> str:
    text = text[:MAX_INPUT_CHARS]
    langpair = f"{source_lang}|{target_lang}"
    cache_key = (text, langpair)
    if cache_key in _cache:
        return _cache[cache_key]
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(MYMEMORY_URL, params={"q": text, "langpair": langpair})
        response.raise_for_status()
        data = response.json()
    if data.get("responseStatus") != 200:
        raise ValueError(data.get("responseDetails", "Translation failed"))
    result = data["responseData"]["translatedText"]
    _cache[cache_key] = result
    return result