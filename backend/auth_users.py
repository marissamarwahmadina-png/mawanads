"""Email+password authentication and team-member management."""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

import core

router = APIRouter(prefix="/api")


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserIn(BaseModel):
    email: EmailStr
    name: str
    role: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def _public(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "name": user.get("name", ""), "role": user["role"]}


@router.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await core.db.users.find_one({"email": email})
    if not user or not user.get("active", True) or not core.verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    token = core.create_access_token({
        "user_id": user["id"], "role": user["role"], "email": user["email"], "name": user.get("name", ""),
    })
    return {"access_token": token, "token_type": "bearer", "user": _public(user)}


@router.get("/auth/me")
async def me(user: dict = Depends(core.get_current_user)):
    return _public(user)


@router.post("/auth/change-password")
async def change_password(body: PasswordChange, user: dict = Depends(core.get_current_user)):
    full = await core.db.users.find_one({"id": user["id"]})
    if not full or not core.verify_password(body.current_password, full.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Password lama salah")
    await core.db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": core.hash_password(body.new_password)}})
    return {"success": True}


@router.get("/users")
async def list_users(_: dict = Depends(core.require_roles("owner", "admin"))):
    return await core.db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", 1).to_list(500)


@router.post("/users")
async def create_user(body: UserIn, _: dict = Depends(core.require_roles("owner", "admin"))):
    email = body.email.lower().strip()
    if body.role not in core.VALID_ROLES:
        raise HTTPException(status_code=400, detail="Role tidak valid")
    if body.role == "owner":
        raise HTTPException(status_code=400, detail="Tidak bisa membuat owner baru")
    if await core.db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    doc = {
        "id": str(uuid.uuid4()), "email": email, "name": body.name, "role": body.role,
        "password_hash": core.hash_password(body.password), "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    await core.db.users.insert_one(doc)
    return {**_public(doc), "active": True, "created_at": doc["created_at"]}


@router.put("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, _: dict = Depends(core.require_roles("owner", "admin"))):
    user = await core.db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.get("role") == "owner" and body.role and body.role != "owner":
        raise HTTPException(status_code=400, detail="Role owner tidak bisa diubah")
    update: dict = {}
    if body.name is not None:
        update["name"] = body.name
    if body.role is not None:
        if body.role not in core.VALID_ROLES or body.role == "owner":
            raise HTTPException(status_code=400, detail="Role tidak valid")
        update["role"] = body.role
    if body.active is not None:
        if user.get("role") == "owner" and not body.active:
            raise HTTPException(status_code=400, detail="Owner tidak bisa dinonaktifkan")
        update["active"] = body.active
    if body.password:
        update["password_hash"] = core.hash_password(body.password)
    if update:
        await core.db.users.update_one({"id": user_id}, {"$set": update})
    fresh = await core.db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return fresh


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(core.require_roles("owner", "admin"))):
    user = await core.db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Owner tidak bisa dihapus")
    await core.db.users.delete_one({"id": user_id})
    return {"success": True}
