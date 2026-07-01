"""Shared core for the team/workflow features: database handle, JWT auth, roles.

Connects to the SAME MongoDB as server.py (same MONGO_URL / DB_NAME) and uses the
same JWT secret, so tokens are interchangeable between the legacy admin login and
the new email+password login.
"""
import os
import uuid
import jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mawana-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

# Team roles
VALID_ROLES = ("owner", "admin", "designer", "advertiser", "business_dev")
ROLE_LABELS = {
    "owner": "Owner",
    "admin": "Admin",
    "designer": "Desainer",
    "advertiser": "Advertiser",
    "business_dev": "Business Development",
}


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed or "")
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    payload = dict(data)
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _token_from_request(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[len("Bearer "):].strip()
    return request.query_params.get("token")


async def get_current_user(request: Request) -> dict:
    """Resolve the authenticated user from a Bearer header or ?token= query.

    Supports two token shapes:
      - new login:    {"user_id": ..., "role": ...}
      - legacy admin: {"sub": "admin"}  (single shared-password login)
    """
    token = _token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")

    user_id = payload.get("user_id")
    if user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user or not user.get("active", True):
            raise HTTPException(status_code=401, detail="Akun tidak ditemukan atau nonaktif")
        return user

    if payload.get("sub") == "admin":
        # Legacy owner session — map onto the seeded owner account if present.
        owner = await db.users.find_one({"role": "owner"}, {"_id": 0, "password_hash": 0})
        if owner:
            return owner
        return {"id": "owner", "email": os.environ.get("OWNER_EMAIL", ""), "name": "Owner", "role": "owner", "active": True}

    raise HTTPException(status_code=401, detail="Token tidak valid")


def require_roles(*roles):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Akses ditolak untuk peran kamu")
        return user
    return _dep


async def seed_owner():
    """Ensure an owner account exists so the system is usable on first run.

    The owner can log in with OWNER_EMAIL and the existing ADMIN_PASSWORD.
    """
    if await db.users.find_one({"role": "owner"}):
        return
    email = os.environ.get("OWNER_EMAIL", "marissamarwahmadina@gmail.com").lower().strip()
    password = os.environ.get("ADMIN_PASSWORD") or os.environ.get("OWNER_PASSWORD") or "mawana2025admin"
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "name": os.environ.get("OWNER_NAME", "Marissa"),
        "role": "owner",
        "password_hash": hash_password(password),
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    })
