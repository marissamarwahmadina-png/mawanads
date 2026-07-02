"""Crowdfunding monitor — track campaigns across platforms in one dashboard.

Manual entry now (fundraiser/donor counts, funds raised); per-platform auto-sync
(scraping/API) is a future enhancement — most platforms are JS-rendered and/or
restrict scraping, so a reliable importer is out of scope for v1.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

import core

router = APIRouter(prefix="/api")

PLATFORMS = ["kitabisa", "niatbaik", "kawanbantu", "raihmimpi", "sharinghappiness", "benihbaik", "wecare", "lainnya"]
STATUSES = ["active", "paused", "ended"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CampaignIn(BaseModel):
    name: str
    platform: str = "kitabisa"
    url: str = ""
    fundraiser: str = ""
    fundraiser_count: int = 0
    donor_count: int = 0
    raised: float = 0
    target: float = 0
    status: str = "active"
    advertiser_id: Optional[str] = None
    client_id: Optional[str] = None
    notes: str = ""


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    fundraiser: Optional[str] = None
    fundraiser_count: Optional[int] = None
    donor_count: Optional[int] = None
    raised: Optional[float] = None
    target: Optional[float] = None
    status: Optional[str] = None
    advertiser_id: Optional[str] = None
    client_id: Optional[str] = None
    notes: Optional[str] = None


def _validate(platform: Optional[str], status: Optional[str]):
    if platform and platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail="Platform tidak valid")
    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")


@router.get("/campaigns")
async def list_campaigns(_: dict = Depends(core.get_current_user),
                         platform: Optional[str] = None, status: Optional[str] = None):
    query: dict = {}
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    return await core.db.campaigns.find(query, {"_id": 0}).sort("raised", -1).to_list(2000)


@router.get("/campaigns/stats")
async def campaign_stats(_: dict = Depends(core.get_current_user)):
    totals = {"raised": 0.0, "donor": 0, "fundraiser": 0, "target": 0.0, "count": 0, "active": 0}
    per_platform: dict = {}
    async for c in core.db.campaigns.find({}, {"_id": 0}):
        totals["raised"] += c.get("raised", 0) or 0
        totals["donor"] += c.get("donor_count", 0) or 0
        totals["fundraiser"] += c.get("fundraiser_count", 0) or 0
        totals["target"] += c.get("target", 0) or 0
        totals["count"] += 1
        if c.get("status") == "active":
            totals["active"] += 1
        p = c.get("platform", "lainnya")
        pp = per_platform.setdefault(p, {"platform": p, "raised": 0.0, "donor": 0, "count": 0})
        pp["raised"] += c.get("raised", 0) or 0
        pp["donor"] += c.get("donor_count", 0) or 0
        pp["count"] += 1
    platforms = sorted(per_platform.values(), key=lambda x: x["raised"], reverse=True)
    return {"totals": totals, "per_platform": platforms}


@router.get("/campaigns/{cid}")
async def get_campaign(cid: str, _: dict = Depends(core.get_current_user)):
    c = await core.db.campaigns.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan")
    return c


@router.post("/campaigns")
async def create_campaign(body: CampaignIn, user: dict = Depends(core.get_current_user)):
    _validate(body.platform, body.status)
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "created_by": user["id"], "created_at": _now(), "updated_at": _now()})
    await core.db.campaigns.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/campaigns/{cid}")
async def update_campaign(cid: str, body: CampaignUpdate, _: dict = Depends(core.get_current_user)):
    if not await core.db.campaigns.find_one({"id": cid}):
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan")
    _validate(body.platform, body.status)
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if update:
        update["updated_at"] = _now()
        await core.db.campaigns.update_one({"id": cid}, {"$set": update})
    return await core.db.campaigns.find_one({"id": cid}, {"_id": 0})


@router.delete("/campaigns/{cid}")
async def delete_campaign(cid: str, user: dict = Depends(core.require_roles("owner", "admin", "advertiser"))):
    await core.db.campaigns.delete_one({"id": cid})
    return {"success": True}
