from fastapi import FastAPI, APIRouter, HTTPException
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


import hashlib
import hmac
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'mawana-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_NOTIFICATION_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', '')

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
    email: EmailStr
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
    email: EmailStr
    phone: str
    organization: str
    monthly_ad_spend: str
    message: str
    affiliator: str
    
    @validator('name', 'phone', 'organization', 'monthly_ad_spend', 'message')
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

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

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
                "data": lead_obj.model_dump()
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

# Include the router in the main app
app.include_router(api_router)

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
        # Test the connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes for better performance
        try:
            await db.contacts.create_index([("submittedAt", -1)])
            await db.affiliate_leads.create_index([("submittedAt", -1)])
            await db.affiliate_leads.create_index([("affiliator", 1)])
            logger.info("MongoDB indexes created successfully")
        except Exception as e:
            logger.warning(f"Failed to create indexes: {str(e)}")
            
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        # Don't raise - let app start but log the error

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