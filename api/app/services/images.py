"""Product photos uploaded by retailers, kept on local disk under api/uploads/.

Only the public path (/uploads/products/<file>) goes into products.image_url;
main.py serves the folder. Files are named by a random id, never by what the
browser sent, so an upload can't pick its own path.
"""

from __future__ import annotations

import uuid
from pathlib import Path

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
PRODUCT_DIR = UPLOAD_ROOT / "products"
PUBLIC_PREFIX = "/uploads/products/"
MAX_BYTES = 5 * 1024 * 1024


class ImageError(ValueError):
    """The upload was rejected; the message is safe to show to the user."""


def _sniff_extension(data: bytes) -> str | None:
    """Trust the file's first bytes, not its name or the declared content type."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def save_product_image(data: bytes) -> str:
    """Store the photo and return the path to put in products.image_url."""
    if not data:
        raise ImageError("The file is empty.")
    if len(data) > MAX_BYTES:
        raise ImageError("Images can be at most 5 MB.")
    extension = _sniff_extension(data)
    if extension is None:
        raise ImageError("Upload a JPG, PNG or WebP image.")

    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{extension}"
    (PRODUCT_DIR / name).write_bytes(data)
    return PUBLIC_PREFIX + name


def delete_product_image(image_url: str | None) -> None:
    """Remove a photo we stored; external links are left alone."""
    if not image_url or not image_url.startswith(PUBLIC_PREFIX):
        return
    path = PRODUCT_DIR / Path(image_url).name
    path.unlink(missing_ok=True)
