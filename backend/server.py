from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import resend
import shutil

import hashlib
import hmac
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# New team/workflow feature modules (import after load_dotenv so env is available)
import core  # noqa: E402
import auth_users  # noqa: E402
import notifications as notif  # noqa: E402
import workflow  # noqa: E402
import design  # noqa: E402
import invoicing  # noqa: E402
import crowdfunding  # noqa: E402

# Upload directory for proof of payment files
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'mawana-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def verify_admin(request: Request):
    """Allow only owner/admin (email login) or the legacy single-password admin token."""
    user = await core.get_current_user(request)
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return True

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_NOTIFICATION_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', '')

# TriPay configuration
TRIPAY_API_KEY = os.environ.get('TRIPAY_API_KEY', '')
TRIPAY_PRIVATE_KEY = os.environ.get('TRIPAY_PRIVATE_KEY', '')
TRIPAY_MERCHANT_CODE = os.environ.get('TRIPAY_MERCHANT_CODE', '')
TRIPAY_MODE = os.environ.get('TRIPAY_MODE', 'sandbox')

def get_tripay_base_url():
    if TRIPAY_MODE == 'sandbox':
        return "https://tripay.co.id/api-sandbox"
    return "https://tripay.co.id/api"

async def send_admin_notification(subject: str, html_content: str):
    """Send email notification to admin (non-blocking)"""
    if not ADMIN_NOTIFICATION_EMAIL or not resend.api_key:
        logger.warning("Email notification skipped: missing config")
        return
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_NOTIFICATION_EMAIL],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Notification email sent to {ADMIN_NOTIFICATION_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send notification email: {str(e)}")

# Create the main app without a prefix
app = FastAPI(redirect_slashes=False)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Contact Form Models
class ContactCreate(BaseModel):
    name: str
    email: str = ""
    phone: str
    organization: Optional[str] = ""
    message: str
    
    @validator('name', 'phone', 'message')
    def check_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field tidak boleh kosong')
        return v.strip()

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    organization: Optional[str] = ""
    message: str
    submittedAt: datetime = Field(default_factory=datetime.utcnow)

# Affiliate Lead Models
class AffiliateLeadCreate(BaseModel):
    name: str
    email: str = ""
    phone: str
    organization: str = ""
    monthly_ad_spend: str = ""
    message: str = ""
    affiliator: str
    
    @validator('name', 'phone')
    def check_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field tidak boleh kosong')
        return v.strip()

class AffiliateLead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    organization: str
    monthly_ad_spend: str
    message: str
    affiliator: str
    submittedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admin Auth Models
class AdminLogin(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Whitelist Cashback Models
class WhitelistUserCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    cashback_percentage: float = 10.0
    referral: str = ""
    notes: str = ""
    bank_name: str = ""
    account_name: str = ""
    account_number: str = ""

class WhitelistUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cashback_percentage: Optional[float] = None
    referral: Optional[str] = None
    notes: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None

class MonthlySpendCreate(BaseModel):
    month: int
    year: int
    spend_amount: float = 0
    notes: str = ""
    payment_status: str = "unpaid"

class MonthlySpendUpdate(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    spend_amount: Optional[float] = None
    notes: Optional[str] = None
    payment_status: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def root_health_check():
    """Health check endpoint for Kubernetes probes (without /api prefix)"""
    return {"status": "healthy", "service": "mawana-api"}

@api_router.get("/server-info")
async def server_info():
    """Show server IP for TriPay whitelist configuration"""
    try:
        async with httpx.AsyncClient(timeout=5) as hc:
            resp = await hc.get("https://api.ipify.org?format=json")
            ip = resp.json().get("ip", "unknown")
    except Exception:
        ip = "gagal deteksi"
    return {"server_ip": ip, "note": "Tambahkan IP ini ke whitelist TriPay di https://tripay.co.id/member"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes"""
    return {"status": "healthy", "service": "mawana-api"}

# Admin Authentication Routes
@api_router.post("/admin/login", response_model=Token)
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint"""
    # Get admin password from environment variable
    admin_password = os.environ.get('ADMIN_PASSWORD', 'mawana2025admin')
    
    if credentials.password != admin_password:
        raise HTTPException(
            status_code=401,
            detail="Password salah"
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + access_token_expires
    
    to_encode = {
        "sub": "admin",
        "exp": expire
    }
    
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Contact Form Routes
@api_router.post("/contact")
async def create_contact(contact_data: ContactCreate):
    """Submit contact form"""
    try:
        contact_dict = contact_data.model_dump()
        contact_obj = Contact(**contact_dict)
        contact_dict_with_id = contact_obj.model_dump()
        
        # Convert datetime to ISO string for MongoDB
        contact_dict_with_id['submittedAt'] = contact_dict_with_id['submittedAt'].isoformat()
        
        # Insert to MongoDB
        result = await db.contacts.insert_one(contact_dict_with_id)
        
        if result.inserted_id:
            logger.info(f"New contact submission from {contact_obj.email}")
            
            # Send admin notification email
            asyncio.create_task(send_admin_notification(
                subject=f"Lead Baru dari Contact Form: {contact_obj.name}",
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #06b6d4, #2563eb); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Lead Baru - Contact Form</h1>
                    </div>
                    <div style="padding: 24px; background: #f9fafb;">
                        <h2 style="color: #111827;">Detail Lead:</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Nama</td><td style="padding: 8px;">{contact_obj.name}</td></tr>
                            <tr style="background: #f3f4f6;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Email</td><td style="padding: 8px;">{contact_obj.email}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Telepon</td><td style="padding: 8px;">{contact_obj.phone}</td></tr>
                            <tr style="background: #f3f4f6;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Organisasi</td><td style="padding: 8px;">{contact_obj.organization or '-'}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Pesan</td><td style="padding: 8px;">{contact_obj.message}</td></tr>
                        </table>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="https://wa.me/{contact_obj.phone.replace(' ', '').replace('-', '')}" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; margin-right: 8px;">WhatsApp</a>
                            <a href="mailto:{contact_obj.email}" style="display: inline-block; padding: 12px 24px; background: #06b6d4; color: white; text-decoration: none; border-radius: 8px;">Email</a>
                        </div>
                    </div>
                </div>
                """
            ))
            
            return {
                "success": True,
                "data": contact_obj.model_dump()
            }
        else:
            raise HTTPException(status_code=500, detail="Gagal menyimpan data")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan server")

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts():
    """Get all contact submissions (for admin)"""
    try:
        contacts = await db.contacts.find({}, {"_id": 0}).sort("submittedAt", -1).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for contact in contacts:
            if isinstance(contact['submittedAt'], str):
                contact['submittedAt'] = datetime.fromisoformat(contact['submittedAt'])
        
        return contacts
    except Exception as e:
        logger.error(f"Error fetching contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan server")

# Affiliate Lead Routes
@api_router.post("/affiliate-lead")
async def create_affiliate_lead(lead_data: AffiliateLeadCreate):
    """Submit affiliate lead form"""
    try:
        lead_dict = lead_data.model_dump()
        lead_obj = AffiliateLead(**lead_dict)
        lead_dict_with_id = lead_obj.model_dump()
        
        # Convert datetime to ISO string for MongoDB
        lead_dict_with_id['submittedAt'] = lead_dict_with_id['submittedAt'].isoformat()
        
        # Insert to MongoDB
        result = await db.affiliate_leads.insert_one(lead_dict_with_id)
        
        if result.inserted_id:
            logger.info(f"New affiliate lead from {lead_obj.affiliator}: {lead_obj.name}")
            
            # Send admin notification email
            asyncio.create_task(send_admin_notification(
                subject=f"Affiliate Lead Baru dari {lead_obj.affiliator}: {lead_obj.name}",
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Affiliate Lead Baru</h1>
                    </div>
                    <div style="padding: 24px; background: #f9fafb;">
                        <div style="background: #eff6ff; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
                            <strong>Affiliator:</strong> {lead_obj.affiliator}
                        </div>
                        <h2 style="color: #111827;">Detail Lead:</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Nama</td><td style="padding: 8px;">{lead_obj.name}</td></tr>
                            <tr style="background: #f3f4f6;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Email</td><td style="padding: 8px;">{lead_obj.email}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">WhatsApp</td><td style="padding: 8px;">{lead_obj.phone}</td></tr>
                            <tr style="background: #f3f4f6;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Organisasi</td><td style="padding: 8px;">{lead_obj.organization}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Ad Spend/Bulan</td><td style="padding: 8px;">{lead_obj.monthly_ad_spend}</td></tr>
                            <tr style="background: #f3f4f6;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Pesan</td><td style="padding: 8px;">{lead_obj.message}</td></tr>
                        </table>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="https://wa.me/{lead_obj.phone.replace(' ', '').replace('-', '')}" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; margin-right: 8px;">WhatsApp</a>
                            <a href="mailto:{lead_obj.email}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px;">Email</a>
                        </div>
                    </div>
                </div>
                """
            ))
            
            return {
                "success": True,
                "data": {**lead_obj.model_dump(), "submittedAt": lead_obj.submittedAt.isoformat()}
            }
        else:
            raise HTTPException(status_code=500, detail="Gagal menyimpan data")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating affiliate lead: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan server")

@api_router.get("/affiliate-leads", response_model=List[AffiliateLead])
async def get_affiliate_leads():
    """Get all affiliate lead submissions (for admin)"""
    try:
        leads = await db.affiliate_leads.find({}, {"_id": 0}).sort("submittedAt", -1).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for lead in leads:
            if isinstance(lead['submittedAt'], str):
                lead['submittedAt'] = datetime.fromisoformat(lead['submittedAt'])
        
        return leads
    except Exception as e:
        logger.error(f"Error fetching affiliate leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan server")

# Webinar Models
class WebinarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    start_datetime: str
    duration_minutes: int = 120
    capacity_total: int = 100
    ticket_prices: dict = Field(default_factory=dict)
    countdown_enabled: bool = True
    bonus_deadline_datetime: Optional[str] = None
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WebinarRegistrantCreate(BaseModel):
    event_id: str
    full_name: str
    email: EmailStr
    whatsapp: str
    role: str
    ticket_type: str
    payment_method: Optional[str] = None

class WebinarRegistrant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    full_name: str
    email: str
    whatsapp: str
    role: str
    ticket_type: str
    ticket_status: str = "PENDING_PAYMENT"
    invoice_id: str = ""
    payment_method_code: str = ""
    tripay_reference: Optional[str] = None
    tripay_checkout_url: Optional[str] = None
    pay_code: Optional[str] = None
    amount: int = 0
    fee: int = 0
    total_amount: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    paid_at: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None

## ============== WEBINAR API ROUTES ==============

@api_router.get("/webinar/events")
async def get_webinar_events():
    events = await db.webinar_events.find({}, {"_id": 0}).to_list(100)
    return events

@api_router.get("/webinar/events/{slug}")
async def get_webinar_event_by_slug(slug: str):
    event = await db.webinar_events.find_one({"slug": slug}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")
    paid_count = await db.webinar_registrants.count_documents({"event_id": event["id"], "ticket_status": "PAID"})
    event["seats_taken"] = paid_count
    event["seats_remaining"] = event.get("capacity_total", 100) - paid_count
    return event

@api_router.post("/webinar/register")
async def register_webinar(data: WebinarRegistrantCreate):
    event = await db.webinar_events.find_one({"id": data.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")
    prices = event.get("ticket_prices", {})
    price = prices.get(data.ticket_type, {}).get("price", 0)
    now = datetime.now(timezone.utc)
    # Use timestamp-based unique invoice to avoid collision after deletes
    import random
    seq = f"{now.strftime('%Y%m%d%H%M%S')}{random.randint(100,999)}"
    invoice_id = f"MWN-PS-{seq}"
    registrant = WebinarRegistrant(
        event_id=data.event_id, full_name=data.full_name, email=data.email,
        whatsapp=data.whatsapp, role=data.role, ticket_type=data.ticket_type,
        invoice_id=invoice_id, amount=price, total_amount=price,
        payment_method_code=data.payment_method or ""
    )
    doc = registrant.model_dump()
    await db.webinar_registrants.insert_one(doc)
    asyncio.create_task(send_admin_notification(
        subject=f"Registrasi Webinar: {data.full_name}",
        html_content=f"<h2>Registrasi Baru</h2><p>Nama: {data.full_name}<br>Email: {data.email}<br>WA: {data.whatsapp}<br>Tiket: {data.ticket_type}<br>Harga: Rp {price:,}<br>Invoice: {invoice_id}</p>"
    ))
    return {"success": True, "data": {"id": registrant.id, "invoice_id": invoice_id, "amount": price}}

@api_router.get("/webinar/registrant/{invoice_id}")
async def get_registrant_by_invoice(invoice_id: str):
    reg = await db.webinar_registrants.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    return reg

FALLBACK_CHANNELS = [
    {"group": "Virtual Account", "code": "BRIVA", "name": "BRI Virtual Account", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
    {"group": "Virtual Account", "code": "BNIVA", "name": "BNI Virtual Account", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
    {"group": "Virtual Account", "code": "MANDIRIVA", "name": "Mandiri Virtual Account", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
    {"group": "Virtual Account", "code": "BCAVA", "name": "BCA Virtual Account", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
    {"group": "Virtual Account", "code": "PERMATAVA", "name": "Permata Virtual Account", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
    {"group": "E-Wallet", "code": "QRIS", "name": "QRIS (OVO, GoPay, Dana)", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0.7}},
    {"group": "E-Wallet", "code": "QRISC", "name": "QRIS (Customizable)", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0.7}},
    {"group": "E-Wallet", "code": "OVO", "name": "OVO", "active": True, "icon_url": "", "total_fee": {"flat": 0, "percent": 0}},
]

@api_router.get("/webinar/payment-channels")
async def get_payment_channels():
    if not TRIPAY_API_KEY:
        return {"channels": FALLBACK_CHANNELS, "fallback": True}
    try:
        base_url = get_tripay_base_url()
        async with httpx.AsyncClient(timeout=10) as hc:
            resp = await hc.get(f"{base_url}/merchant/payment-channel", headers={"Authorization": f"Bearer {TRIPAY_API_KEY}"})
            data = resp.json()
            if data.get("success"):
                return {"channels": data["data"], "fallback": False}
            logger.warning(f"TriPay channel response: {data.get('message', 'unknown error')}")
            return {"channels": FALLBACK_CHANNELS, "fallback": True}
    except Exception as e:
        logger.error(f"TriPay channel error: {e}")
        return {"channels": FALLBACK_CHANNELS, "fallback": True}

class CreatePaymentRequest(BaseModel):
    invoice_id: str
    method: str

@api_router.post("/webinar/create-payment")
async def create_tripay_payment(req: CreatePaymentRequest):
    reg = await db.webinar_registrants.find_one({"invoice_id": req.invoice_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    if not TRIPAY_API_KEY or not TRIPAY_PRIVATE_KEY or not TRIPAY_MERCHANT_CODE:
        raise HTTPException(status_code=500, detail="TriPay belum dikonfigurasi")
    base_url = get_tripay_base_url()
    amount = reg["amount"]
    merchant_ref = reg["invoice_id"]
    signature = hmac.new(
        TRIPAY_PRIVATE_KEY.encode('utf-8'),
        (TRIPAY_MERCHANT_CODE + merchant_ref + str(amount)).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    expired_time = int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp())
    base_domain = os.environ.get('REACT_APP_FRONTEND_URL', '')
    callback_url = os.environ.get('TRIPAY_CALLBACK_URL', '')
    payload = {
        "method": req.method,
        "merchant_ref": merchant_ref,
        "amount": amount,
        "customer_name": reg["full_name"],
        "customer_email": reg["email"],
        "customer_phone": reg["whatsapp"],
        "order_items": [{"sku": "WEBINAR-PS", "name": "Webinar Psikologi Sedekah", "price": amount, "quantity": 1}],
        "return_url": f"{base_domain}/webinar/psikologi-sedekah/konfirmasi?invoice={merchant_ref}",
        "expired_time": expired_time,
        "signature": signature
    }
    if callback_url:
        payload["callback_url"] = callback_url
    try:
        async with httpx.AsyncClient(timeout=30) as hc:
            resp = await hc.post(
                f"{base_url}/transaction/create",
                json=payload,
                headers={"Authorization": f"Bearer {TRIPAY_API_KEY}"}
            )
            data = resp.json()
            logger.info(f"TriPay create-payment response: {resp.status_code} - {data.get('success')} - {data.get('message', '')}")
            if data.get("success"):
                tx = data["data"]
                await db.webinar_registrants.update_one({"invoice_id": req.invoice_id}, {"$set": {
                    "payment_method_code": req.method,
                    "tripay_reference": tx.get("reference"),
                    "tripay_checkout_url": tx.get("checkout_url"),
                    "pay_code": tx.get("pay_code"),
                    "fee": tx.get("total_fee", 0),
                    "total_amount": tx.get("amount", amount),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }})
                return {"success": True, "data": tx}
            error_msg = data.get("message", "Gagal membuat pembayaran")
            if "Unauthorized IP" in str(error_msg):
                logger.error(f"TriPay IP not whitelisted: {error_msg}")
                raise HTTPException(status_code=400, detail=f"IP server belum di-whitelist di TriPay. {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TriPay create-payment error: {e}")
        raise HTTPException(status_code=500, detail="Gagal menghubungi TriPay")

from fastapi import Request

async def send_payment_confirmation_email(registrant: dict, event: dict):
    """Send payment confirmation email to registrant"""
    email = registrant.get("email", "")
    if not email or not resend.api_key:
        return
    name = registrant.get("full_name", "")
    invoice = registrant.get("invoice_id", "")
    ticket = registrant.get("ticket_type", "").capitalize()
    amount = registrant.get("total_amount") or registrant.get("amount", 0)
    event_title = event.get("title", "Webinar") if event else "Webinar"
    event_date = "11 Maret 2026, 10:00 WIB"
    if event and event.get("start_datetime"):
        try:
            dt = datetime.fromisoformat(event["start_datetime"].replace("Z", "+00:00"))
            event_date = dt.strftime("%d %B %Y, %H:%M") + " WIB"
        except Exception:
            pass
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": f"Konfirmasi Pembayaran - {event_title}",
            "html": f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;">
                <div style="background:linear-gradient(135deg,#0D234A,#00A2C1);padding:32px 24px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">Pembayaran Berhasil!</h1>
                    <p style="color:#E8F8FA;margin:8px 0 0;font-size:14px;">Terima kasih, {name}</p>
                </div>
                <div style="padding:24px;">
                    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
                        <h3 style="color:#0D234A;margin:0 0 16px;font-size:16px;">Detail Invoice</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:14px;">
                            <tr><td style="padding:8px 0;color:#6b7280;">Invoice</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:600;">{invoice}</td></tr>
                            <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Nama</td><td style="padding:8px 0;text-align:right;">{name}</td></tr>
                            <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Tipe Tiket</td><td style="padding:8px 0;text-align:right;">{ticket}</td></tr>
                            <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Total Bayar</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#00A2C1;font-size:16px;">Rp {amount:,.0f}</td></tr>
                            <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;text-align:right;"><span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">LUNAS</span></td></tr>
                        </table>
                    </div>
                    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:20px;">
                        <h3 style="color:#1e40af;margin:0 0 8px;font-size:16px;">Jadwal Webinar</h3>
                        <p style="margin:4px 0;color:#1e3a5f;font-size:14px;"><strong>{event_title}</strong></p>
                        <p style="margin:4px 0;color:#1e3a5f;font-size:14px;">{event_date}</p>
                        <p style="margin:4px 0;color:#1e3a5f;font-size:14px;">Online via Google Meet</p>
                        <p style="margin:12px 0 0;color:#6b7280;font-size:12px;">Link Google Meet akan dikirimkan via email & WhatsApp H-1 sebelum acara.</p>
                    </div>
                    <div style="text-align:center;margin-top:24px;">
                        <a href="https://wa.me/6289655128024?text=Halo,%20saya%20sudah%20bayar%20webinar%20dengan%20invoice%20{invoice}" style="display:inline-block;padding:12px 32px;background:#22c55e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Gabung Grup WhatsApp</a>
                    </div>
                </div>
                <div style="padding:16px 24px;text-align:center;color:#9ca3af;font-size:12px;">
                    <p>&copy; 2026 Mawana Digital Services. All rights reserved.</p>
                </div>
            </div>
            """
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Payment confirmation email sent to {email} for invoice {invoice}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {email}: {e}")

@api_router.post("/tripay/callback")
async def tripay_callback(request: Request):
    body = await request.body()
    body_str = body.decode('utf-8')
    callback_signature = request.headers.get('X-Callback-Signature', '')
    callback_event = request.headers.get('X-Callback-Event', '')
    expected_signature = hmac.new(TRIPAY_PRIVATE_KEY.encode(), body_str.encode(), hashlib.sha256).hexdigest()
    signature_valid = hmac.compare_digest(callback_signature, expected_signature)
    try:
        payload = json.loads(body_str)
    except Exception:
        payload = {}
    await db.tripay_callback_logs.insert_one({
        "id": str(uuid.uuid4()), "invoice_id": payload.get("merchant_ref", ""),
        "tripay_reference": payload.get("reference", ""), "headers_json": dict(request.headers),
        "payload_json": payload, "signature_valid": signature_valid,
        "received_at": datetime.now(timezone.utc).isoformat()
    })
    if not signature_valid:
        return {"success": False, "message": "Invalid signature"}
    if callback_event != "payment_status":
        return {"success": True}
    merchant_ref = payload.get("merchant_ref", "")
    status = payload.get("status", "").upper()
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if status == "PAID":
        update_data["ticket_status"] = "PAID"
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
        update_data["tripay_reference"] = payload.get("reference", "")
    elif status == "EXPIRED":
        update_data["ticket_status"] = "EXPIRED"
    elif status == "FAILED":
        update_data["ticket_status"] = "FAILED"
    if merchant_ref:
        result = await db.webinar_registrants.update_one({"invoice_id": merchant_ref}, {"$set": update_data})
        if status == "PAID" and result.modified_count > 0:
            reg = await db.webinar_registrants.find_one({"invoice_id": merchant_ref}, {"_id": 0})
            if reg:
                event = await db.webinar_events.find_one({"id": reg.get("event_id")}, {"_id": 0})
                asyncio.create_task(send_payment_confirmation_email(reg, event))
    return {"success": True}

## ============== ADMIN WEBINAR ROUTES ==============

@api_router.get("/admin/webinar/dashboard", dependencies=[Depends(verify_admin)])
async def admin_webinar_dashboard():
    events = await db.webinar_events.find({}, {"_id": 0}).to_list(100)
    total_registrants = await db.webinar_registrants.count_documents({})
    total_paid = await db.webinar_registrants.count_documents({"ticket_status": "PAID"})
    total_pending = await db.webinar_registrants.count_documents({"ticket_status": "PENDING_PAYMENT"})
    paid_regs = await db.webinar_registrants.find({"ticket_status": "PAID"}, {"_id": 0, "amount": 1}).to_list(10000)
    total_revenue = sum(r.get("amount", 0) for r in paid_regs)
    recent = await db.webinar_registrants.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {
        "events": events, "total_registrants": total_registrants,
        "total_paid": total_paid, "total_pending": total_pending,
        "total_revenue": total_revenue, "recent_transactions": recent
    }

@api_router.get("/admin/webinar/registrants", dependencies=[Depends(verify_admin)])
async def admin_get_registrants(event_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if event_id: query["event_id"] = event_id
    if status: query["ticket_status"] = status
    return await db.webinar_registrants.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)

@api_router.post("/admin/webinar/events", dependencies=[Depends(verify_admin)])
async def admin_create_event(event: dict):
    event_obj = WebinarEvent(**event)
    doc = event_obj.model_dump()
    await db.webinar_events.insert_one(doc)
    return {"success": True, "data": {k: v for k, v in doc.items() if k != '_id'}}

@api_router.put("/admin/webinar/events/{event_id}", dependencies=[Depends(verify_admin)])
async def admin_update_event(event_id: str, update: dict):
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.webinar_events.update_one({"id": event_id}, {"$set": update})
    return {"success": True}

class UpdateRegistrantStatus(BaseModel):
    status: str

@api_router.put("/admin/webinar/registrants/{registrant_id}/status", dependencies=[Depends(verify_admin)])
async def admin_update_registrant_status(registrant_id: str, body: UpdateRegistrantStatus):
    new_status = body.status.upper()
    if new_status not in ["PAID", "PENDING_PAYMENT", "EXPIRED", "FAILED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    update_data = {"ticket_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if new_status == "PAID":
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.webinar_registrants.update_one({"id": registrant_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registrant tidak ditemukan")
    return {"success": True}

@api_router.get("/admin/webinar/callback-logs", dependencies=[Depends(verify_admin)])
async def admin_get_callback_logs():
    logs = await db.tripay_callback_logs.find({}, {"_id": 0}).sort("received_at", -1).to_list(100)
    return logs

@api_router.delete("/admin/webinar/registrants/{registrant_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_registrant(registrant_id: str):
    result = await db.webinar_registrants.delete_one({"id": registrant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registrant tidak ditemukan")
    return {"success": True}

@api_router.delete("/admin/contacts/{contact_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_contact(contact_id: str):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact tidak ditemukan")
    return {"success": True}

@api_router.delete("/admin/affiliate-leads/{lead_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_affiliate_lead(lead_id: str):
    result = await db.affiliate_leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead tidak ditemukan")
    return {"success": True}

## ============== WHITELIST CASHBACK ROUTES ==============

@api_router.get("/admin/whitelist", dependencies=[Depends(verify_admin)])
async def get_whitelist_users():
    users = await db.whitelist_users.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    return users

@api_router.post("/admin/whitelist", dependencies=[Depends(verify_admin)])
async def create_whitelist_user(data: WhitelistUserCreate):
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "cashback_percentage": data.cashback_percentage,
        "referral": data.referral,
        "notes": data.notes,
        "bank_name": data.bank_name,
        "account_name": data.account_name,
        "account_number": data.account_number,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.whitelist_users.insert_one(user_doc)
    return {"success": True, "data": {k: v for k, v in user_doc.items() if k != "_id"}}

@api_router.put("/admin/whitelist/{user_id}", dependencies=[Depends(verify_admin)])
async def update_whitelist_user(user_id: str, data: WhitelistUserUpdate):
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="Tidak ada data untuk diupdate")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.whitelist_users.update_one({"id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return {"success": True}

@api_router.delete("/admin/whitelist/{user_id}", dependencies=[Depends(verify_admin)])
async def delete_whitelist_user(user_id: str):
    result = await db.whitelist_users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    await db.monthly_spends.delete_many({"user_id": user_id})
    return {"success": True}

@api_router.get("/admin/whitelist/{user_id}/spends", dependencies=[Depends(verify_admin)])
async def get_user_spends(user_id: str):
    spends = await db.monthly_spends.find({"user_id": user_id}, {"_id": 0}).sort([("year", -1), ("month", -1)]).to_list(10000)
    return spends

@api_router.post("/admin/whitelist/{user_id}/spends", dependencies=[Depends(verify_admin)])
async def create_monthly_spend(user_id: str, data: MonthlySpendCreate):
    user = await db.whitelist_users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    existing = await db.monthly_spends.find_one({"user_id": user_id, "month": data.month, "year": data.year})
    if existing:
        raise HTTPException(status_code=400, detail=f"Data spending bulan {data.month}/{data.year} sudah ada")
    cashback_pct = user.get("cashback_percentage", 10)
    cashback_amount = data.spend_amount * (cashback_pct / 100)
    spend_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "month": data.month,
        "year": data.year,
        "spend_amount": data.spend_amount,
        "cashback_percentage": cashback_pct,
        "cashback_amount": cashback_amount,
        "proof_url": "",
        "notes": data.notes,
        "payment_status": data.payment_status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.monthly_spends.insert_one(spend_doc)
    return {"success": True, "data": {k: v for k, v in spend_doc.items() if k != "_id"}}

@api_router.put("/admin/whitelist/spends/{spend_id}", dependencies=[Depends(verify_admin)])
async def update_monthly_spend(spend_id: str, data: MonthlySpendUpdate):
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="Tidak ada data untuk diupdate")
    spend = await db.monthly_spends.find_one({"id": spend_id}, {"_id": 0})
    if not spend:
        raise HTTPException(status_code=404, detail="Spend tidak ditemukan")
    if "spend_amount" in update:
        user = await db.whitelist_users.find_one({"id": spend["user_id"]}, {"_id": 0})
        pct = user.get("cashback_percentage", 10) if user else 10
        update["cashback_amount"] = update["spend_amount"] * (pct / 100)
        update["cashback_percentage"] = pct
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.monthly_spends.update_one({"id": spend_id}, {"$set": update})
    return {"success": True}

@api_router.delete("/admin/whitelist/spends/{spend_id}", dependencies=[Depends(verify_admin)])
async def delete_monthly_spend(spend_id: str):
    result = await db.monthly_spends.delete_one({"id": spend_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spend tidak ditemukan")
    return {"success": True}

@api_router.post("/admin/whitelist/spends/{spend_id}/proof", dependencies=[Depends(verify_admin)])
async def upload_proof_of_payment(spend_id: str, file: UploadFile = File(...)):
    spend = await db.monthly_spends.find_one({"id": spend_id}, {"_id": 0})
    if not spend:
        raise HTTPException(status_code=404, detail="Spend tidak ditemukan")
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"proof_{spend_id}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    proof_url = f"/api/admin/whitelist/uploads/{filename}"
    await db.monthly_spends.update_one({"id": spend_id}, {"$set": {"proof_url": proof_url, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "proof_url": proof_url}

@api_router.put("/admin/whitelist/spends/{spend_id}/payment-status", dependencies=[Depends(verify_admin)])
async def toggle_payment_status(spend_id: str):
    spend = await db.monthly_spends.find_one({"id": spend_id}, {"_id": 0})
    if not spend:
        raise HTTPException(status_code=404, detail="Spend tidak ditemukan")
    current = spend.get("payment_status", "unpaid")
    new_status = "paid" if current != "paid" else "unpaid"
    await db.monthly_spends.update_one({"id": spend_id}, {"$set": {"payment_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "payment_status": new_status}

@api_router.get("/admin/whitelist/uploads/{filename}", dependencies=[Depends(verify_admin)])
async def serve_upload(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    return FileResponse(filepath)

@api_router.get("/admin/whitelist/{user_id}/pdf", dependencies=[Depends(verify_admin)])
async def generate_user_pdf(user_id: str, from_month: int = 0, from_year: int = 0, to_month: int = 0, to_year: int = 0):
    from fpdf import FPDF
    user = await db.whitelist_users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    query = {"user_id": user_id}
    if from_month and from_year and to_month and to_year:
        conditions = []
        for y in range(from_year, to_year + 1):
            sm = from_month if y == from_year else 1
            em = to_month if y == to_year else 12
            conditions.append({"year": y, "month": {"$gte": sm, "$lte": em}})
        if conditions:
            query["$or"] = conditions
    spends = await db.monthly_spends.find(query, {"_id": 0}).sort([("year", 1), ("month", 1)]).to_list(10000)
    period_label = _get_period_label(from_month, from_year, to_month, to_year)
    pdf = _build_cashback_pdf(user.get("referral", "-"), [user], {user["id"]: spends}, period_label)
    safe_name = user.get("name", "user").replace(" ", "_")
    pdf_filename = f"cashback_{safe_name}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    pdf_path = UPLOAD_DIR / pdf_filename
    pdf.output(str(pdf_path))
    return FileResponse(pdf_path, filename=pdf_filename, media_type="application/pdf")

@api_router.get("/admin/whitelist/referral/{referral_name}/pdf", dependencies=[Depends(verify_admin)])
async def generate_referral_pdf(referral_name: str, from_month: int = 0, from_year: int = 0, to_month: int = 0, to_year: int = 0):
    from fpdf import FPDF
    users = await db.whitelist_users.find({"referral": referral_name}, {"_id": 0}).to_list(10000)
    if not users:
        raise HTTPException(status_code=404, detail="Tidak ada user dengan referral tersebut")
    user_ids = [u["id"] for u in users]
    query = {"user_id": {"$in": user_ids}}
    if from_month and from_year and to_month and to_year:
        conditions = []
        for y in range(from_year, to_year + 1):
            sm = from_month if y == from_year else 1
            em = to_month if y == to_year else 12
            conditions.append({"year": y, "month": {"$gte": sm, "$lte": em}})
        if conditions:
            query["$or"] = conditions
    all_spends = await db.monthly_spends.find(query, {"_id": 0}).sort([("year", 1), ("month", 1)]).to_list(100000)
    spend_map = {}
    for s in all_spends:
        uid = s["user_id"]
        if uid not in spend_map:
            spend_map[uid] = []
        spend_map[uid].append(s)
    period_label = _get_period_label(from_month, from_year, to_month, to_year)
    pdf = _build_cashback_pdf(referral_name, users, spend_map, period_label)
    safe_ref = referral_name.replace(" ", "_")
    pdf_filename = f"cashback_referral_{safe_ref}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    pdf_path = UPLOAD_DIR / pdf_filename
    pdf.output(str(pdf_path))
    return FileResponse(pdf_path, filename=pdf_filename, media_type="application/pdf")

def _get_period_label(fm, fy, tm, ty):
    mn = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    if fm and fy and tm and ty:
        if fm == tm and fy == ty:
            return f"{mn[fm]} {fy}"
        return f"{mn[fm]} {fy} - {mn[tm]} {ty}"
    return "Semua Periode"

def _build_cashback_pdf(referral_name, users, spend_map, period_label):
    from fpdf import FPDF
    mn = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pw = pdf.w - 20  # page width minus margins

    # ── Header ──
    pdf.set_fill_color(13, 35, 74)
    pdf.rect(10, 10, pw, 28, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_xy(16, 14)
    pdf.cell(pw / 2, 8, "MAWANA", 0, 0, "L")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(16, 23)
    pdf.cell(pw / 2, 6, "Cashback Report", 0, 0, "L")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(pw / 2, 14)
    pdf.cell(pw / 2 + 4, 6, f"Referral: {referral_name}", 0, 0, "R")
    pdf.set_xy(pw / 2, 20)
    pdf.cell(pw / 2 + 4, 6, f"Period: {period_label}", 0, 0, "R")
    pdf.set_xy(pw / 2, 26)
    pdf.cell(pw / 2 + 4, 6, f"Generated: {datetime.now(timezone.utc).strftime('%d %B %Y')}", 0, 0, "R")

    # ── Summary Cards ──
    grand_spend = sum(sum(s.get("spend_amount", 0) for s in spend_map.get(u["id"], [])) for u in users)
    grand_cb = sum(sum(s.get("cashback_amount", 0) for s in spend_map.get(u["id"], [])) for u in users)
    paid_cb = sum(sum(s.get("cashback_amount", 0) for s in spend_map.get(u["id"], []) if s.get("payment_status") == "paid") for u in users)
    unpaid_cb = grand_cb - paid_cb

    pdf.set_text_color(50, 50, 50)
    card_w = (pw - 6) / 3
    card_y = 44
    for i, (title, value, color) in enumerate([
        ("Total Cashback", f"Rp {grand_cb:,.0f}", (0, 162, 193)),
        ("Sudah Dibayar", f"Rp {paid_cb:,.0f}", (34, 197, 94)),
        ("Belum Dibayar", f"Rp {unpaid_cb:,.0f}", (239, 68, 68)),
    ]):
        cx = 10 + i * (card_w + 3)
        pdf.set_fill_color(245, 247, 250)
        pdf.rect(cx, card_y, card_w, 20, "F")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(120, 120, 120)
        pdf.set_xy(cx + 4, card_y + 2)
        pdf.cell(card_w - 8, 5, title, 0, 0, "L")
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*color)
        pdf.set_xy(cx + 4, card_y + 8)
        pdf.cell(card_w - 8, 8, value, 0, 0, "L")

    # Transaction volume row
    pdf.set_text_color(50, 50, 50)
    pdf.set_xy(10, 68)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(pw / 2, 5, f"Total Ad Spend: ", 0, 0, "L")
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 5, f"Rp {grand_spend:,.0f}", 0, 1, "L")

    # ── Commission Details Table ──
    pdf.ln(4)
    pdf.set_text_color(13, 35, 74)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(pw * 0.6, 8, "Cashback Details", 0, 0, "L")
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 162, 193)
    pdf.cell(pw * 0.4, 8, f"Rp {grand_cb:,.0f}", 0, 1, "R")

    # Table header
    pdf.set_fill_color(245, 247, 250)
    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Helvetica", "B", 8)
    col = [pw * 0.32, pw * 0.18, pw * 0.08, pw * 0.20, pw * 0.14, pw * 0.08]
    headers = ["MEMBER", "PERIOD", "RATE", "AD SPEND", "CASHBACK", "STATUS"]
    for i, h in enumerate(headers):
        pdf.cell(col[i], 7, h, 0, 0, "L" if i < 2 else "R" if i in [3, 4] else "C", True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(50, 50, 50)
    for user in users:
        user_spends = spend_map.get(user["id"], [])
        if not user_spends:
            pdf.set_text_color(150, 150, 150)
            pdf.cell(col[0], 6, f"MAWANA - {user['name']}", 0, 0, "L")
            pdf.cell(col[1], 6, "-", 0, 0, "L")
            pdf.cell(col[2], 6, f"{user.get('cashback_percentage', 0):.1f}%", 0, 0, "C")
            pdf.cell(col[3], 6, "0", 0, 0, "R")
            pdf.cell(col[4], 6, "0", 0, 0, "R")
            pdf.cell(col[5], 6, "-", 0, 1, "C")
            pdf.set_text_color(50, 50, 50)
            continue
        for s in user_spends:
            m = s.get("month", 0)
            y = s.get("year", 0)
            period = f"{mn[m] if 1 <= m <= 12 else m} {y}"
            spend_a = s.get("spend_amount", 0)
            cb_a = s.get("cashback_amount", 0)
            paid = s.get("payment_status", "unpaid") == "paid"
            pdf.cell(col[0], 6, f"MAWANA - {user['name']}", 0, 0, "L")
            pdf.cell(col[1], 6, period, 0, 0, "L")
            pdf.cell(col[2], 6, f"{s.get('cashback_percentage', 0):.1f}%", 0, 0, "C")
            pdf.cell(col[3], 6, f"{spend_a:,.0f}", 0, 0, "R")
            pdf.cell(col[4], 6, f"{cb_a:,.0f}", 0, 0, "R")
            if paid:
                pdf.set_text_color(34, 197, 94)
                pdf.cell(col[5], 6, "PAID", 0, 1, "C")
            else:
                pdf.set_text_color(239, 68, 68)
                pdf.cell(col[5], 6, "UNPAID", 0, 1, "C")
            pdf.set_text_color(50, 50, 50)
        # Separator line
        pdf.set_draw_color(230, 230, 230)
        pdf.line(10, pdf.get_y(), 10 + pw, pdf.get_y())
        pdf.ln(1)

    # ── Bank Details ──
    pdf.ln(4)
    pdf.set_text_color(13, 35, 74)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Transfer Details", 0, 1, "L")
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(245, 247, 250)
    pdf.set_text_color(100, 100, 100)
    bcol = [pw * 0.25, pw * 0.25, pw * 0.25, pw * 0.25]
    for i, h in enumerate(["REFERRAL / MEMBER", "BANK", "ACCOUNT NAME", "ACCOUNT NO"]):
        pdf.cell(bcol[i], 7, h, 0, 0, "L", True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(50, 50, 50)
    for user in users:
        pdf.cell(bcol[0], 6, user.get("name", "-"), 0, 0, "L")
        pdf.cell(bcol[1], 6, user.get("bank_name", "-") or "-", 0, 0, "L")
        pdf.cell(bcol[2], 6, user.get("account_name", "-") or "-", 0, 0, "L")
        pdf.cell(bcol[3], 6, user.get("account_number", "-") or "-", 0, 1, "L")

    # ── Footer ──
    pdf.ln(8)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 10 + pw, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 4, "This report is auto-generated by Mawana Digital Services", 0, 1, "C")

    return pdf

@api_router.get("/admin/whitelist/summary", dependencies=[Depends(verify_admin)])
async def get_whitelist_summary():
    users = await db.whitelist_users.find({}, {"_id": 0}).to_list(10000)
    all_spends = await db.monthly_spends.find({}, {"_id": 0}).to_list(100000)
    spend_map = {}
    for s in all_spends:
        uid = s["user_id"]
        if uid not in spend_map:
            spend_map[uid] = {"total_spend": 0, "total_cashback": 0, "months": 0, "paid": 0, "unpaid": 0}
        spend_map[uid]["total_spend"] += s.get("spend_amount", 0)
        spend_map[uid]["total_cashback"] += s.get("cashback_amount", 0)
        spend_map[uid]["months"] += 1
        if s.get("payment_status") == "paid":
            spend_map[uid]["paid"] += s.get("cashback_amount", 0)
        else:
            spend_map[uid]["unpaid"] += s.get("cashback_amount", 0)
    result = []
    for u in users:
        uid = u["id"]
        stats = spend_map.get(uid, {"total_spend": 0, "total_cashback": 0, "months": 0, "paid": 0, "unpaid": 0})
        result.append({**u, **stats})
    referrals = {}
    for u in result:
        ref = u.get("referral", "") or "Tidak ada"
        if ref not in referrals:
            referrals[ref] = {"referral": ref, "users": 0, "total_spend": 0, "total_cashback": 0, "paid": 0, "unpaid": 0}
        referrals[ref]["users"] += 1
        referrals[ref]["total_spend"] += u.get("total_spend", 0)
        referrals[ref]["total_cashback"] += u.get("total_cashback", 0)
        referrals[ref]["paid"] += u.get("paid", 0)
        referrals[ref]["unpaid"] += u.get("unpaid", 0)
    return {"users": result, "referrals": list(referrals.values()), "total_users": len(users), "total_spend": sum(s.get("total_spend", 0) for s in result), "total_cashback": sum(s.get("total_cashback", 0) for s in result)}

@api_router.get("/admin/whitelist/spends/monthly", dependencies=[Depends(verify_admin)])
async def get_monthly_spends_all(month: int, year: int):
    """Get all spends for a given month/year, merged with all whitelist users"""
    users = await db.whitelist_users.find({}, {"_id": 0}).sort("name", 1).to_list(10000)
    spends = await db.monthly_spends.find({"month": month, "year": year}, {"_id": 0}).to_list(10000)
    spend_map = {s["user_id"]: s for s in spends}
    result = []
    for u in users:
        s = spend_map.get(u["id"])
        result.append({
            "user_id": u["id"],
            "user_name": u["name"],
            "email": u.get("email", ""),
            "phone": u.get("phone", ""),
            "referral": u.get("referral", ""),
            "cashback_percentage": u.get("cashback_percentage", 0),
            "bank_name": u.get("bank_name", ""),
            "account_name": u.get("account_name", ""),
            "account_number": u.get("account_number", ""),
            "spend_id": s["id"] if s else None,
            "spend_amount": s.get("spend_amount", 0) if s else 0,
            "cashback_amount": s.get("cashback_amount", 0) if s else 0,
            "proof_url": s.get("proof_url", "") if s else "",
            "notes": s.get("notes", "") if s else "",
            "has_data": s is not None,
            "payment_status": s.get("payment_status", "unpaid") if s else "unpaid",
        })
    total_spend = sum(r["spend_amount"] for r in result)
    total_cashback = sum(r["cashback_amount"] for r in result)
    return {"month": month, "year": year, "data": result, "total_spend": total_spend, "total_cashback": total_cashback}

# Include the router in the main app
app.include_router(api_router)
app.include_router(auth_users.router)
app.include_router(workflow.router)
app.include_router(notif.router)
app.include_router(design.router)
app.include_router(invoicing.router)
app.include_router(crowdfunding.router)

# Get CORS origins from environment
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB startup and shutdown handlers
@app.on_event("startup")
async def startup_db_client():
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")

        # Seed the owner account + indexes for the team/workflow features
        try:
            await core.db.users.create_index("email", unique=True)
            await core.db.users.create_index("id", unique=True)
            await core.db.tasks.create_index("status")
            await core.db.tasks.create_index("assignee_id")
            await core.db.tasks.create_index("client_id")
            await core.db.clients.create_index("id", unique=True)
            await core.db.notifications.create_index([("user_id", 1), ("read", 1)])
            await core.db.design_requests.create_index("status")
            await core.db.design_requests.create_index("designer_id")
            await core.db.invoices.create_index("number")
            await core.db.invoices.create_index("status")
            await core.db.campaigns.create_index("platform")
            await core.seed_owner()
            logger.info("Owner account ensured")
        except Exception as e:
            logger.warning(f"Owner seeding skipped: {str(e)}")

        try:
            await db.contacts.create_index([("submittedAt", -1)])
            await db.affiliate_leads.create_index([("submittedAt", -1)])
            await db.affiliate_leads.create_index([("affiliator", 1)])
            await db.webinar_registrants.create_index([("invoice_id", 1)])
            await db.webinar_registrants.create_index([("event_id", 1)])
            await db.whitelist_users.create_index([("referral", 1)])
            await db.monthly_spends.create_index([("user_id", 1)])
            logger.info("MongoDB indexes created successfully")
        except Exception as e:
            logger.warning(f"Failed to create indexes: {str(e)}")
        
        # Seed webinar event if not exists
        try:
            existing = await db.webinar_events.find_one({"slug": "psikologi-sedekah"})
            if not existing:
                seed_event = {
                    "id": str(uuid.uuid4()),
                    "title": "Psikologi Sedekah: Rahasia CTA Donasi yang Bikin Donor Auto-Transfer",
                    "slug": "psikologi-sedekah",
                    "start_datetime": "2026-03-11T03:00:00Z",
                    "duration_minutes": 120,
                    "capacity_total": 100,
                    "ticket_prices": {
                        "individu": {"label": "Daftar Individu", "original_price": 300000, "price": 85000, "persons": 1},
                        "duo": {"label": "Daftar 2 Orang", "original_price": 600000, "price": 149000, "persons": 2},
                        "lembaga": {"label": "Daftar 1 Lembaga (3 Orang)", "original_price": 900000, "price": 199000, "persons": 3}
                    },
                    "countdown_enabled": True,
                    "bonus_deadline_datetime": "2026-03-09T16:59:00Z",
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.webinar_events.insert_one(seed_event)
                logger.info("Webinar event 'psikologi-sedekah' seeded successfully")
            else:
                logger.info("Webinar event 'psikologi-sedekah' already exists")
        except Exception as e:
            logger.warning(f"Failed to seed webinar event: {str(e)}")
            
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("MongoDB connection closed")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)