"""
Backend API Tests for Mawana Digital Services
Tests: Health, Admin Login, Contacts, Affiliate Leads
"""
import pytest
import requests
import os
import uuid

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cashback-dash.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_PASSWORD = "mawana2025admin"
WRONG_PASSWORD = "wrongpassword"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "mawana-api"
        print("✓ Health check passed")


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_login_success(self):
        """Test successful admin login with correct password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        print("✓ Admin login success test passed")
    
    def test_login_wrong_password(self):
        """Test login failure with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": WRONG_PASSWORD}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Admin wrong password test passed")
    
    def test_login_empty_password(self):
        """Test login failure with empty password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ""}
        )
        assert response.status_code == 401
        print("✓ Admin empty password test passed")


class TestContactsAPI:
    """Contact form API tests"""
    
    def test_get_contacts(self):
        """Test GET /api/contacts returns list of contacts"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get contacts passed - {len(data)} contacts found")
        
        # Verify contact structure if we have data
        if len(data) > 0:
            contact = data[0]
            assert "id" in contact
            assert "name" in contact
            assert "email" in contact
            assert "phone" in contact
            assert "message" in contact
            assert "submittedAt" in contact
            print("✓ Contact structure validation passed")
    
    def test_create_contact(self):
        """Test POST /api/contact creates new contact"""
        unique_id = str(uuid.uuid4())[:8]
        contact_data = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "phone": "081234567890",
            "organization": "TEST_Org",
            "message": f"Test message {unique_id}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contact",
            json=contact_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert data["data"]["name"] == contact_data["name"]
        assert data["data"]["email"] == contact_data["email"]
        print("✓ Create contact test passed")
        
        # Verify contact was persisted by fetching all contacts
        get_response = requests.get(f"{BASE_URL}/api/contacts")
        contacts = get_response.json()
        found = any(c["email"] == contact_data["email"] for c in contacts)
        assert found, "Created contact not found in GET response"
        print("✓ Contact persistence verification passed")
    
    def test_create_contact_validation_empty_name(self):
        """Test contact creation fails with empty name"""
        contact_data = {
            "name": "",
            "email": "test@example.com",
            "phone": "081234567890",
            "message": "Test message"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contact",
            json=contact_data
        )
        assert response.status_code == 422  # Validation error
        print("✓ Contact validation (empty name) test passed")
    
    def test_create_contact_validation_invalid_email(self):
        """Test contact creation fails with invalid email"""
        contact_data = {
            "name": "Test User",
            "email": "invalid-email",
            "phone": "081234567890",
            "message": "Test message"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contact",
            json=contact_data
        )
        assert response.status_code == 422  # Validation error
        print("✓ Contact validation (invalid email) test passed")


class TestAffiliateLeadsAPI:
    """Affiliate leads API tests"""
    
    def test_get_affiliate_leads(self):
        """Test GET /api/affiliate-leads returns list of leads"""
        response = requests.get(f"{BASE_URL}/api/affiliate-leads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get affiliate leads passed - {len(data)} leads found")
        
        # Verify lead structure if we have data
        if len(data) > 0:
            lead = data[0]
            assert "id" in lead
            assert "name" in lead
            assert "email" in lead
            assert "phone" in lead
            assert "organization" in lead
            assert "monthly_ad_spend" in lead
            assert "message" in lead
            assert "affiliator" in lead
            assert "submittedAt" in lead
            print("✓ Affiliate lead structure validation passed")
    
    def test_create_affiliate_lead(self):
        """Test POST /api/affiliate-lead creates new lead"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Affiliate_{unique_id}",
            "email": f"test_affiliate_{unique_id}@example.com",
            "phone": "081234567890",
            "organization": "TEST_Company",
            "monthly_ad_spend": "Rp 10 juta - Rp 25 juta",
            "message": f"Test affiliate message {unique_id}",
            "affiliator": "test_affiliator"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/affiliate-lead",
            json=lead_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert data["data"]["name"] == lead_data["name"]
        assert data["data"]["affiliator"] == lead_data["affiliator"]
        print("✓ Create affiliate lead test passed")
        
        # Verify lead was persisted
        get_response = requests.get(f"{BASE_URL}/api/affiliate-leads")
        leads = get_response.json()
        found = any(l["email"] == lead_data["email"] for l in leads)
        assert found, "Created lead not found in GET response"
        print("✓ Affiliate lead persistence verification passed")
    
    def test_create_affiliate_lead_validation(self):
        """Test affiliate lead creation fails with missing required fields"""
        lead_data = {
            "name": "",  # Empty name
            "email": "test@example.com",
            "phone": "081234567890",
            "organization": "Company",
            "monthly_ad_spend": "Rp 10 juta",
            "message": "Message",
            "affiliator": "test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/affiliate-lead",
            json=lead_data
        )
        assert response.status_code == 422  # Validation error
        print("✓ Affiliate lead validation test passed")


class TestDataCounts:
    """Verify expected data counts as per requirements"""
    
    def test_contacts_count(self):
        """Verify we have contacts in the system"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        data = response.json()
        # According to requirements, there should be 5 contacts
        assert len(data) >= 5, f"Expected at least 5 contacts, got {len(data)}"
        print(f"✓ Contacts count verification passed - {len(data)} contacts")
    
    def test_affiliate_leads_count(self):
        """Verify we have affiliate leads in the system"""
        response = requests.get(f"{BASE_URL}/api/affiliate-leads")
        assert response.status_code == 200
        data = response.json()
        # According to requirements, there should be at least 1 affiliate lead
        assert len(data) >= 1, f"Expected at least 1 lead, got {len(data)}"
        print(f"✓ Affiliate leads count verification passed - {len(data)} leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
