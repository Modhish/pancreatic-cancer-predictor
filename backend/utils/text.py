from __future__ import annotations

import base64
import re
import unicodedata
from typing import Any

__all__ = [
    "repair_text_encoding",
    "is_readable_russian",
    "encode_text_base64",
]

_MOJIBAKE_MARKERS = re.compile(r"[\u00C3\u00C2\u00D0\u00D1]")
_CTRL_CHARS = re.compile(r"[\x00-\x08\x0B-\x0C\x0E-\x1F]+")


def repair_text_encoding(text: Any) -> str:
    """Attempt to repair common UTF-8/Latin-1 mojibake artifacts."""
    try:
        s = str(text)
    except Exception:
        return "" if text is None else str(text)

    if not s:
        return s

    def count_cyr(value: str) -> int:
        return len(re.findall(r"[\u0400-\u04FF]", value))

    def count_gib(value: str) -> int:
        return len(_MOJIBAKE_MARKERS.findall(value))

    out = s
    for _ in range(3):
        if not _MOJIBAKE_MARKERS.search(out):
            break
        try:
            candidate = out.encode("latin-1", "ignore").decode("utf-8", "ignore")
        except Exception:
            break
        if count_cyr(candidate) > count_cyr(out) or count_gib(out) > 0:
            out = candidate
        else:
            break

    out = _CTRL_CHARS.sub(" ", out)
    try:
        out = unicodedata.normalize("NFC", out)
    except Exception:  # pragma: no cover
        pass
    return out


def is_readable_russian(text: str) -> bool:
    """Heuristic: ensure the string contains enough Cyrillic symbols."""
    if not isinstance(text, str) or not text.strip():
        return False
    if len(_MOJIBAKE_MARKERS.findall(text)) >= 2:
        return False
    cyr = len(re.findall(r"[\u0400-\u04FF]", text))
    alpha = len(re.findall(r"[A-Za-z\u0400-\u04FF]", text))
    return alpha > 0 and (cyr / alpha) >= 0.2


def encode_text_base64(value: str) -> str:
    """Safely encode text as base64 UTF-8 for transport."""
    raw = value if isinstance(value, str) else ("" if value is None else str(value))
    try:
        return base64.b64encode(raw.encode("utf-8")).decode("ascii")
    except Exception:  # pragma: no cover
        try:
            return base64.b64encode(raw.encode("utf-8", "ignore")).decode("ascii")
        except Exception:
            return ""
