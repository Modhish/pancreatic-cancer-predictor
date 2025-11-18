import logging
import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
except Exception:  # pragma: no cover
    Limiter = None

__all__ = ["app", "logger", "rate_limit"]

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["JSON_AS_ASCII"] = False
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

CORS(
    app,
    origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
)

if Limiter is not None:
    limiter = Limiter(get_remote_address, app=app, storage_uri="memory://")
    rate_limit = limiter.limit
else:  # pragma: no cover
    class _NoopLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    limiter = _NoopLimiter()  # type: ignore
    rate_limit = limiter.limit


def _check_pdf_unicode_font() -> None:
    """Log a warning if the Unicode PDF font is missing."""
    try:
        fonts_dir = os.path.join(os.path.dirname(__file__), "..", "fonts")
        ttf_path = os.path.abspath(os.path.join(fonts_dir, "DejaVuSans.ttf"))
        if not os.path.exists(ttf_path):
            logger.warning(
                "PDF Unicode font missing: %s. Russian text in PDFs may not render. "
                "Add DejaVuSans.ttf (see backend/fonts/README.md)",
                ttf_path,
            )
    except Exception as exc:  # pragma: no cover
        logger.debug("Font check skipped due to error: %s", exc)


_check_pdf_unicode_font()
