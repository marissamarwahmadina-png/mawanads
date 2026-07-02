"""Ads monitor — track running ad campaigns, keep ROAS healthy, scale up measurably.

Manual entry now (spend / revenue / results). Live pull from Meta/Google Ads APIs
is a future enhancement (requires per-account OAuth on the backend)."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

import core
import meta_ads

router = APIRouter(prefix="/api")

PLATFORMS = ["meta", "google", "tiktok", "lainnya"]
STATUSES = ["active", "paused", "ended"]
OBJECTIVES = ["fundraising", "awareness", "traffic", "leads", "conversion", "lainnya"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AdIn(BaseModel):
    name: str
    platform: str = "meta"
    objective: str = "fundraising"
    client_id: Optional[str] = None
    client_name: str = ""
    spend: float = 0
    revenue: float = 0
    results: int = 0
    target_roas: float = 0
    status: str = "active"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    advertiser_id: Optional[str] = None
    notes: str = ""


class AdUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    objective: Optional[str] = None
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    spend: Optional[float] = None
    revenue: Optional[float] = None
    results: Optional[int] = None
    target_roas: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    advertiser_id: Optional[str] = None
    notes: Optional[str] = None


def _validate(platform: Optional[str], status: Optional[str], objective: Optional[str]):
    if platform and platform not in PLATFORMS:
        raise HTTPException(status_code=400, detail="Platform tidak valid")
    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    if objective and objective not in OBJECTIVES:
        raise HTTPException(status_code=400, detail="Objective tidak valid")


@router.get("/ad-campaigns")
async def list_ads(_: dict = Depends(core.get_current_user),
                   platform: Optional[str] = None, status: Optional[str] = None):
    query: dict = {}
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    return await core.db.ad_campaigns.find(query, {"_id": 0}).sort("spend", -1).to_list(2000)


@router.get("/ad-campaigns/stats")
async def ad_stats(_: dict = Depends(core.get_current_user)):
    totals = {"spend": 0.0, "revenue": 0.0, "results": 0, "count": 0, "active": 0}
    per_platform: dict = {}
    async for a in core.db.ad_campaigns.find({}, {"_id": 0}):
        totals["spend"] += a.get("spend", 0) or 0
        totals["revenue"] += a.get("revenue", 0) or 0
        totals["results"] += a.get("results", 0) or 0
        totals["count"] += 1
        if a.get("status") == "active":
            totals["active"] += 1
        p = a.get("platform", "lainnya")
        pp = per_platform.setdefault(p, {"platform": p, "spend": 0.0, "revenue": 0.0, "count": 0})
        pp["spend"] += a.get("spend", 0) or 0
        pp["revenue"] += a.get("revenue", 0) or 0
        pp["count"] += 1
    totals["roas"] = round(totals["revenue"] / totals["spend"], 2) if totals["spend"] else 0
    for pp in per_platform.values():
        pp["roas"] = round(pp["revenue"] / pp["spend"], 2) if pp["spend"] else 0
    return {"totals": totals, "per_platform": sorted(per_platform.values(), key=lambda x: x["spend"], reverse=True)}


@router.post("/ad-campaigns")
async def create_ad(body: AdIn, user: dict = Depends(core.get_current_user)):
    _validate(body.platform, body.status, body.objective)
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "created_by": user["id"], "created_at": _now(), "updated_at": _now()})
    await core.db.ad_campaigns.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/ad-campaigns/{aid}")
async def update_ad(aid: str, body: AdUpdate, _: dict = Depends(core.get_current_user)):
    if not await core.db.ad_campaigns.find_one({"id": aid}):
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan")
    _validate(body.platform, body.status, body.objective)
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if update:
        update["updated_at"] = _now()
        await core.db.ad_campaigns.update_one({"id": aid}, {"$set": update})
    return await core.db.ad_campaigns.find_one({"id": aid}, {"_id": 0})


@router.delete("/ad-campaigns/{aid}")
async def delete_ad(aid: str, _: dict = Depends(core.require_roles("owner", "admin", "advertiser"))):
    await core.db.ad_campaigns.delete_one({"id": aid})
    return {"success": True}


@router.get("/ad-campaigns/meta/status")
async def meta_status(_: dict = Depends(core.get_current_user)):
    """Whether the backend has Meta Ads credentials configured."""
    return {"configured": meta_ads.is_configured()}


@router.post("/ad-campaigns/meta/sync")
async def meta_sync(_: dict = Depends(core.require_roles("owner", "admin", "advertiser"))):
    """Tarik data campaign live dari Meta Ads (Graph API) dan upsert ke dashboard."""
    try:
        return await meta_ads.sync()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gagal sync Meta: {e}")
