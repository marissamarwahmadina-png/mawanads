"""Clients + unified work board (tasks / Kanban) for the Mawana team."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

import core

router = APIRouter(prefix="/api")

SERVICE_TYPES = ["erp", "fundraising_mentoring", "ad_optimization", "whitelist", "other"]
TASK_STATUSES = ["todo", "in_progress", "review", "done"]
PRIORITIES = ["low", "medium", "high", "urgent"]
_PRIORITY_RANK = {"urgent": 0, "high": 1, "medium": 2, "low": 3}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────── Clients ───────────────────────────
class ClientIn(BaseModel):
    name: str
    services: List[str] = []
    pic: str = ""
    contact: str = ""
    notes: str = ""
    status: str = "active"


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    services: Optional[List[str]] = None
    pic: Optional[str] = None
    contact: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.get("/clients")
async def list_clients(_: dict = Depends(core.get_current_user)):
    clients = await core.db.clients.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    counts = {}
    async for row in core.db.tasks.aggregate([
        {"$match": {"status": {"$ne": "done"}}},
        {"$group": {"_id": "$client_id", "open": {"$sum": 1}}},
    ]):
        counts[row["_id"]] = row["open"]
    for c in clients:
        c["open_tasks"] = counts.get(c["id"], 0)
    return clients


@router.post("/clients")
async def create_client(body: ClientIn, user: dict = Depends(core.require_roles("owner", "admin"))):
    bad = [s for s in body.services if s not in SERVICE_TYPES]
    if bad:
        raise HTTPException(status_code=400, detail=f"Layanan tidak valid: {bad}")
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "created_by": user["id"], "created_at": _now(), "updated_at": _now()})
    await core.db.clients.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/clients/{client_id}")
async def update_client(client_id: str, body: ClientUpdate, _: dict = Depends(core.require_roles("owner", "admin"))):
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "services" in update:
        bad = [s for s in update["services"] if s not in SERVICE_TYPES]
        if bad:
            raise HTTPException(status_code=400, detail=f"Layanan tidak valid: {bad}")
    if update:
        update["updated_at"] = _now()
        await core.db.clients.update_one({"id": client_id}, {"$set": update})
    client = await core.db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client tidak ditemukan")
    return client


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, _: dict = Depends(core.require_roles("owner", "admin"))):
    await core.db.clients.delete_one({"id": client_id})
    # Detach tasks from the deleted client (keep the tasks)
    await core.db.tasks.update_many({"client_id": client_id}, {"$set": {"client_id": None}})
    return {"success": True}


# ─────────────────────────── Tasks ───────────────────────────
class TaskIn(BaseModel):
    title: str
    description: str = ""
    client_id: Optional[str] = None
    service_type: str = "other"
    assignee_id: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[str] = None
    service_type: Optional[str] = None
    assignee_id: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


async def _enrich(tasks: List[dict]) -> List[dict]:
    client_ids = {t.get("client_id") for t in tasks if t.get("client_id")}
    user_ids = {t.get("assignee_id") for t in tasks if t.get("assignee_id")}
    clients = {}
    if client_ids:
        async for c in core.db.clients.find({"id": {"$in": list(client_ids)}}, {"_id": 0, "id": 1, "name": 1}):
            clients[c["id"]] = c["name"]
    users = {}
    if user_ids:
        async for u in core.db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "id": 1, "name": 1}):
            users[u["id"]] = u["name"]
    for t in tasks:
        t["client_name"] = clients.get(t.get("client_id"))
        t["assignee_name"] = users.get(t.get("assignee_id"))
    return tasks


@router.get("/tasks")
async def list_tasks(
    user: dict = Depends(core.get_current_user),
    client_id: Optional[str] = None,
    service_type: Optional[str] = None,
    assignee_id: Optional[str] = None,
    status: Optional[str] = None,
    mine: bool = Query(False),
):
    query: dict = {}
    if client_id:
        query["client_id"] = client_id
    if service_type:
        query["service_type"] = service_type
    if assignee_id:
        query["assignee_id"] = assignee_id
    if status:
        query["status"] = status
    if mine:
        query["assignee_id"] = user["id"]
    tasks = await core.db.tasks.find(query, {"_id": 0}).to_list(3000)
    tasks.sort(key=lambda t: (
        _PRIORITY_RANK.get(t.get("priority"), 2),
        t.get("due_date") or "9999",
        t.get("created_at") or "",
    ))
    return await _enrich(tasks)


@router.get("/tasks/stats")
async def task_stats(user: dict = Depends(core.get_current_user)):
    pipeline = [{"$group": {"_id": "$status", "n": {"$sum": 1}}}]
    by_status = {s: 0 for s in TASK_STATUSES}
    async for row in core.db.tasks.aggregate(pipeline):
        if row["_id"] in by_status:
            by_status[row["_id"]] = row["n"]
    today = datetime.now(timezone.utc).date().isoformat()
    overdue = await core.db.tasks.count_documents({"status": {"$ne": "done"}, "due_date": {"$ne": None, "$lt": today}})
    mine_open = await core.db.tasks.count_documents({"assignee_id": user["id"], "status": {"$ne": "done"}})
    return {"by_status": by_status, "overdue": overdue, "mine_open": mine_open, "total": sum(by_status.values())}


@router.post("/tasks")
async def create_task(body: TaskIn, user: dict = Depends(core.get_current_user)):
    if body.service_type not in SERVICE_TYPES:
        raise HTTPException(status_code=400, detail="Jenis layanan tidak valid")
    if body.status not in TASK_STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    if body.priority not in PRIORITIES:
        raise HTTPException(status_code=400, detail="Prioritas tidak valid")
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "created_by": user["id"], "created_at": _now(), "updated_at": _now()})
    await core.db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return (await _enrich([doc]))[0]


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, body: TaskUpdate, user: dict = Depends(core.get_current_user)):
    task = await core.db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if update.get("status") and update["status"] not in TASK_STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    if update.get("service_type") and update["service_type"] not in SERVICE_TYPES:
        raise HTTPException(status_code=400, detail="Jenis layanan tidak valid")
    if update.get("priority") and update["priority"] not in PRIORITIES:
        raise HTTPException(status_code=400, detail="Prioritas tidak valid")
    if update:
        update["updated_at"] = _now()
        await core.db.tasks.update_one({"id": task_id}, {"$set": update})
    fresh = await core.db.tasks.find_one({"id": task_id}, {"_id": 0})
    return (await _enrich([fresh]))[0]


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(core.get_current_user)):
    task = await core.db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    if user.get("role") not in ("owner", "admin") and task.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Hanya pembuat atau admin yang bisa menghapus")
    await core.db.tasks.delete_one({"id": task_id})
    return {"success": True}
