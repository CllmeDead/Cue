from __future__ import annotations
from pathlib import Path
from PIL import Image
SUPPORTED_FORMATS = {"png", "jpg", "jpeg", "webp"}
OUTPUT_DIR = Path.home() / "Downloads" / "Cue" / "Converted"

def convert_image(source_path: str, target_format: str) -> str:
    target_format = target_format.lower()
    if target_format not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported target format: {target_format}")
    source = Path(source_path)
    if not source.is_file():
        raise FileNotFoundError(source_path)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{source.stem}.{target_format}"
    with Image.open(source) as img:
        if target_format in ("jpg", "jpeg") and img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[-1])
            background.save(output_path)
        else:
            img.convert("RGB" if target_format in ("jpg", "jpeg") else img.mode).save(output_path)
    return str(output_path)