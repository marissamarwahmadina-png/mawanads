"""Design production requests (Pengajuan Desain) — briefs, footage/brief links,
preview results, and a Diajukan → Diproses → Revisi → Selesai workflow."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel

import core
import notifications as notif
import storage

router = APIRouter(prefix="/api")

MAX_UPLOAD_MB = 100

CATEGORIES = ["flyer_poster", "feed_ig", "story_ig", "video", "motion", "banner", "logo", "lainnya"]
STATUSES = ["diajukan", "diproses", "revisi", "selesai"]
PRIORITIES = ["rendah", "sedang", "tinggi", "urgent"]
_STATUS_LABEL = {"diajukan": "Diajukan", "diproses": "Diproses", "revisi": "Revisi", "selesai": "Selesai"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ResultLink(BaseModel):
    label: str = ""
    url: str


class DesignRequestIn(BaseModel):
    title: str
    category: str = "flyer_poster"
    priority: str = "sedang"
    requester: str = ""
    division: str = ""
    deadline: Optional[str] = None
    designer_id: Optional[str] = None
    brief: str = ""
    output_format: str = ""
    footage_link: str = ""
    brief_link: str = ""
    results: List[ResultLink] = []
    status: str = "diajukan"
    notes: str = ""


class DesignRequestUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    requester: Optional[str] = None
    division: Optional[str] = None
    deadline: Optional[str] = None
    designer_id: Optional[str] = None
    brief: Optional[str] = None
    output_format: Optional[str] = None
    footage_link: Optional[str] = None
    brief_link: Optional[str] = None
    results: Optional[List[ResultLink]] = None
    status: Optional[str] = None
    notes: Optional[str] = None


async def _next_number() -> str:
    year = datetime.now(timezone.utc).year
    count = await core.db.design_requests.count_documents({"number": {"$regex": f"^DSN/{year}/"}})
    return f"DSN/{year}/{count + 1:03d}"


async def _enrich(items: List[dict]) -> List[dict]:
    ids = {i.get("designer_id") for i in items if i.get("designer_id")}
    names = {}
    if ids:
        async for u in core.db.users.find({"id": {"$in": list(ids)}}, {"_id": 0, "id": 1, "name": 1}):
            names[u["id"]] = u["name"]
    for i in items:
        i["designer_name"] = names.get(i.get("designer_id"))
    return items


def _validate(cat: Optional[str], status: Optional[str], prio: Optional[str]):
    if cat and cat not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Kategori tidak valid")
    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    if prio and prio not in PRIORITIES:
        raise HTTPException(status_code=400, detail="Prioritas tidak valid")


@router.get("/design-requests")
async def list_requests(
    _: dict = Depends(core.get_current_user),
    status: Optional[str] = None,
    designer_id: Optional[str] = None,
    division: Optional[str] = None,
):
    query: dict = {}
    if status:
        query["status"] = status
    if designer_id:
        query["designer_id"] = designer_id
    if division:
        query["division"] = division
    items = await core.db.design_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return await _enrich(items)


@router.get("/design-requests/stats")
async def request_stats(_: dict = Depends(core.get_current_user)):
    by_status = {s: 0 for s in STATUSES}
    async for row in core.db.design_requests.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        if row["_id"] in by_status:
            by_status[row["_id"]] = row["n"]
    return {"by_status": by_status, "total": sum(by_status.values())}


@router.get("/design-requests/{req_id}")
async def get_request(req_id: str, _: dict = Depends(core.get_current_user)):
    item = await core.db.design_requests.find_one({"id": req_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    return (await _enrich([item]))[0]


@router.post("/design-requests")
async def create_request(body: DesignRequestIn, user: dict = Depends(core.get_current_user)):
    _validate(body.category, body.status, body.priority)
    doc = body.model_dump()
    doc["results"] = [r if isinstance(r, dict) else r.model_dump() for r in doc.get("results", [])]
    doc.update({
        "id": str(uuid.uuid4()), "number": await _next_number(), "creatives": [],
        "created_by": user["id"], "created_at": _now(), "updated_at": _now(),
    })
    await core.db.design_requests.insert_one(doc)
    doc.pop("_id", None)
    if doc.get("designer_id") and doc["designer_id"] != user["id"]:
        await notif.notify(doc["designer_id"], "Pengajuan desain baru",
                           f"{doc['number']} — \"{doc['title']}\" ditugaskan ke kamu.",
                           link="/admin/desain")
    return (await _enrich([doc]))[0]


@router.put("/design-requests/{req_id}")
async def update_request(req_id: str, body: DesignRequestUpdate, user: dict = Depends(core.get_current_user)):
    existing = await core.db.design_requests.find_one({"id": req_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    _validate(body.category, body.status, body.priority)
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "results" in update and update["results"] is not None:
        update["results"] = [r if isinstance(r, dict) else r for r in update["results"]]
    if update:
        update["updated_at"] = _now()
        await core.db.design_requests.update_one({"id": req_id}, {"$set": update})
    fresh = await core.db.design_requests.find_one({"id": req_id}, {"_id": 0})

    new_designer = fresh.get("designer_id")
    if "designer_id" in update and new_designer and new_designer != existing.get("designer_id") and new_designer != user["id"]:
        await notif.notify(new_designer, "Pengajuan desain ditugaskan ke kamu",
                           f"{fresh['number']} — \"{fresh['title']}\".", link="/admin/desain")
    elif "status" in update and update["status"] != existing.get("status") and new_designer and new_designer != user["id"]:
        await notif.notify(new_designer, "Status pengajuan desain berubah",
                           f"{fresh['number']} kini {_STATUS_LABEL.get(update['status'], update['status'])}.",
                           link="/admin/desain")
    return (await _enrich([fresh]))[0]


@router.delete("/design-requests/{req_id}")
async def delete_request(req_id: str, user: dict = Depends(core.get_current_user)):
    item = await core.db.design_requests.find_one({"id": req_id})
    if not item:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if user.get("role") not in ("owner", "admin") and item.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Hanya pembuat atau admin yang bisa menghapus")
    # best-effort: clean up uploaded creatives from Cloudinary
    for c in item.get("creatives", []) or []:
        if c.get("public_id"):
            try:
                await storage.destroy(c["public_id"], c.get("resource_type", "image"))
            except Exception:
                pass
    await core.db.design_requests.delete_one({"id": req_id})
    return {"success": True}


@router.get("/design-storage/status")
async def storage_status(_: dict = Depends(core.get_current_user)):
    """Whether file uploads (Cloudinary) are configured on the backend."""
    return {"configured": storage.is_configured(), "max_mb": MAX_UPLOAD_MB}


@router.post("/design-requests/{req_id}/creatives")
async def upload_creative(req_id: str, file: UploadFile = File(...),
                          user: dict = Depends(core.get_current_user)):
    """Upload a creative file (image/video/pdf) and attach it to the request."""
    if not storage.is_configured():
        raise HTTPException(status_code=400, detail="Penyimpanan file belum dikonfigurasi (Cloudinary)")
    item = await core.db.design_requests.find_one({"id": req_id})
    if not item:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File kosong")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File terlalu besar (maks {MAX_UPLOAD_MB}MB)")
    try:
        rec = await storage.upload(data, folder=f"mawanads/desain/{item.get('number', req_id)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gagal upload: {e}")
    rec.update({
        "id": str(uuid.uuid4()), "filename": file.filename or "file",
        "uploaded_by": user["id"], "uploaded_by_name": user.get("name", ""), "uploaded_at": _now(),
    })
    await core.db.design_requests.update_one(
        {"id": req_id}, {"$push": {"creatives": rec}, "$set": {"updated_at": _now()}})
    fresh = await core.db.design_requests.find_one({"id": req_id}, {"_id": 0})
    return (await _enrich([fresh]))[0]


@router.delete("/design-requests/{req_id}/creatives/{creative_id}")
async def delete_creative(req_id: str, creative_id: str, user: dict = Depends(core.get_current_user)):
    item = await core.db.design_requests.find_one({"id": req_id})
    if not item:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    target = next((c for c in item.get("creatives", []) or [] if c.get("id") == creative_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    if target.get("public_id"):
        try:
            await storage.destroy(target["public_id"], target.get("resource_type", "image"))
        except Exception:
            pass
    await core.db.design_requests.update_one(
        {"id": req_id}, {"$pull": {"creatives": {"id": creative_id}}, "$set": {"updated_at": _now()}})
    fresh = await core.db.design_requests.find_one({"id": req_id}, {"_id": 0})
    return (await _enrich([fresh]))[0]
