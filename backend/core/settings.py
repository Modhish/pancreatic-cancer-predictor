import logging
import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from core.security import init_security

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

init_security(app)

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
        times_candidates = [
            os.path.abspath(os.path.join(fonts_dir, "TimesNewRoman.ttf")),
            os.path.abspath(os.path.join(fonts_dir, "Times New Roman.ttf")),
            os.path.abspath(os.path.join(fonts_dir, "times.ttf")),
        ]
        dejavu_candidates = [
            os.path.abspath(os.path.join(fonts_dir, "DejaVuSans.ttf")),
        ]
        has_times = any(os.path.exists(path) for path in times_candidates)
        has_dejavu = any(os.path.exists(path) for path in dejavu_candidates)
        if not (has_times or has_dejavu):
            logger.warning(
                "PDF Unicode font missing: %s. Russian text in PDFs may not render. "
                "Add TimesNewRoman.ttf (preferred) or DejaVuSans.ttf (see backend/fonts/README.md)",
                times_candidates[0],
            )
    except Exception as exc:  # pragma: no cover
        logger.debug("Font check skipped due to error: %s", exc)


_check_pdf_unicode_font()
