"""Cloudinary-backed file storage for creatives / attachments.

Durable off-box storage (HF Spaces' local disk is ephemeral). Config via a single
`CLOUDINARY_URL` secret (`cloudinary://<api_key>:<api_secret>@<cloud_name>`), or the
three separate `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
"""
import os

from starlette.concurrency import run_in_threadpool


def is_configured() -> bool:
    return bool(os.environ.get("CLOUDINARY_URL") or os.environ.get("CLOUDINARY_CLOUD_NAME"))


def _configure():
    import cloudinary
    if os.environ.get("CLOUDINARY_URL"):
        cloudinary.config()  # SDK reads CLOUDINARY_URL from the environment
    else:
        cloudinary.config(
            cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
            api_key=os.environ.get("CLOUDINARY_API_KEY"),
            api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
            secure=True,
        )


def attachment_url(url: str) -> str:
    """Turn a Cloudinary delivery URL into a forced-download URL (fl_attachment)."""
    marker = "/upload/"
    if marker in url and "fl_attachment" not in url:
        return url.replace(marker, f"{marker}fl_attachment/", 1)
    return url


async def upload(file_bytes: bytes, folder: str = "mawanads") -> dict:
    """Upload bytes to Cloudinary. Returns a normalized creative record."""
    import cloudinary.uploader
    _configure()
    res = await run_in_threadpool(
        cloudinary.uploader.upload,
        file_bytes,
        resource_type="auto",
        folder=folder,
        use_filename=True,
        unique_filename=True,
    )
    url = res.get("secure_url", "")
    return {
        "url": url,
        "download_url": attachment_url(url),
        "public_id": res.get("public_id", ""),
        "resource_type": res.get("resource_type", "image"),
        "format": res.get("format", ""),
        "bytes": res.get("bytes", 0),
    }


async def destroy(public_id: str, resource_type: str = "image") -> None:
    import cloudinary.uploader
    _configure()
    await run_in_threadpool(
        cloudinary.uploader.destroy, public_id, resource_type=resource_type, invalidate=True
    )
