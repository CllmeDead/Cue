from __future__ import annotations
import time
import httpx

FRANKFURTER_BASE = "https://api.frankfurter.dev/v1"
CACHE_TTL_SECONDS = 60 * 60
_rates_cache: dict[str, tuple[float, dict]] = {}
_symbols_cache: dict | None = None

async def get_supported_symbols() -> dict:
    global _symbols_cache
    if _symbols_cache is not None:
        return _symbols_cache
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{FRANKFURTER_BASE}/currencies")
        response.raise_for_status()
        _symbols_cache = response.json()
    return _symbols_cache

async def _get_rates_for_base(base:str) -> dict:
    now = time.monotonic()
    cached = _rates_cache.get(base)
    if cached and (now - cached[0] < CACHE_TTL_SECONDS):
        return cached[1]
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{FRANKFURTER_BASE}/latest", params={"base": base})
        response.raise_for_status()
        data = response.json()
        rates = data["rates"]
        _rates_cache[base] = (now, rates)
        return rates

async def convert(amount: float, from_currency: str, to_currency: str) -> dict:
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    if from_currency == to_currency:
        return {"amount": amount, "from": from_currency, "to": to_currency, "result": amount, "rate": 1.0}
    rates = await _get_rates_for_base(from_currency)
    if to_currency not in rates:
        raise ValueError(f"Unsupported currency: {to_currency}")
    rate = rates[to_currency]
    return {
        "amount": amount,
        "from": from_currency,
        "to": to_currency,
        "result": round(amount * rate, 4),
        "rate": rate,
    }