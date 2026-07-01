"""In-app + email notifications for the Mawana team workspace."""
import os
import uuid
import asyncio
import logging
from datetime import datetime, timezone

import resend
from fastapi import APIRouter, Depends, HTTPException

import core

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_URL = os.environ.get("REACT_APP_FRONTEND_URL", "https://www.mawanads.com").rstrip("/")


def _send_email(to: str, subject: str, message: str, link: str):
    """Blocking Resend call — run via asyncio.to_thread so it never blocks the loop."""
    try:
        resend.Emails.send({
            "from": f"Mawana Workspace <{SENDER}>",
            "to": [to],
            "subject": subject,
            "html": (
                "<div style=\"font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:auto;"
                "border:1px solid #e5e7eb;border-radius:14px;overflow:hidden\">"
                "<div style=\"background:linear-gradient(135deg,#0891b2,#2563eb);padding:18px 24px\">"
                "<span style=\"color:#fff;font-weight:700;font-size:16px\">Mawana Workspace</span></div>"
                f"<div style=\"padding:24px\"><h2 style=\"margin:0 0 8px;font-size:17px;color:#111827\">{subject}</h2>"
                f"<p style=\"color:#4b5563;font-size:14px;line-height:1.5\">{message}</p>"
                f"<a href=\"{APP_URL}{link}\" style=\"display:inline-block;margin-top:14px;background:#0891b2;"
                "color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px\">"
                "Buka Workspace</a></div>"
                "<div style=\"padding:12px 24px;background:#f9fafb;color:#9ca3af;font-size:12px\">"
                "Notifikasi otomatis dari Mawana Workspace</div></div>"
            ),
        })
    except Exception as e:  # pragma: no cover - best effort
        logger.warning(f"Email notif gagal ke {to}: {e}")


async def notify(user_id: str, title: str, message: str, link: str = "/admin/tugas", send_email: bool = True):
    """Create an in-app notification and fire a best-effort email (non-blocking)."""
    if not user_id:
        return
    user = await core.db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    await core.db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "title": title, "message": message,
        "link": link, "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if send_email and resend.api_key and user.get("email"):
        try:
            asyncio.create_task(asyncio.to_thread(_send_email, user["email"], title, message, link))
        except Exception as e:
            logger.warning(f"Gagal menjadwalkan email: {e}")


@router.get("/notifications")
async def list_notifications(user: dict = Depends(core.get_current_user)):
    items = await core.db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    unread = await core.db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread}


@router.get("/notifications/count")
async def notifications_count(user: dict = Depends(core.get_current_user)):
    unread = await core.db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"unread": unread}


@router.post("/notifications/{nid}/read")
async def mark_read(nid: str, user: dict = Depends(core.get_current_user)):
    await core.db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"success": True}


@router.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(core.get_current_user)):
    await core.db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"success": True}
