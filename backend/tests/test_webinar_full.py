"""
Complete Backend API tests for Webinar Psikologi Sedekah ticketing system
Tests: Public APIs + Admin APIs + Callback endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "mawana2025admin"

# ============ FIXTURES ============
@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")

@pytest.fixture(scope="module")
def event_id():
    """Get psikologi-sedekah event ID"""
    response = requests.get(f"{BASE_URL}/api/webinar/events/psikologi-sedekah")
    if response.status_code == 200:
        return response.json().get("id")
    pytest.skip("Event not found")

@pytest.fixture(scope="module")
def test_registrant_id(event_id):
    """Create a test registrant and return its ID"""
    payload = {
        "event_id": event_id,
        "full_name": "TEST_StatusUpdate User",
        "email": "test_status@example.com",
        "whatsapp": "081234567111",
        "role": "Copywriter",
        "ticket_type": "individu"
    }
    response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
    if response.status_code == 200:
        # Need to get the registrant ID from the database via admin endpoint
        return response.json()["data"]["invoice_id"]
    return None


# ============ PUBLIC API TESTS ============
class TestPublicWebinarAPIs:
    """Public API tests for webinar system"""
    
    def test_event_endpoint_returns_correct_structure(self):
        """GET /api/webinar/events/psikologi-sedekah returns event with ticket_prices and seats"""
        response = requests.get(f"{BASE_URL}/api/webinar/events/psikologi-sedekah")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields
        assert "id" in data, "Missing 'id' field"
        assert "slug" in data, "Missing 'slug' field"
        assert data["slug"] == "psikologi-sedekah"
        assert "ticket_prices" in data, "Missing 'ticket_prices' field"
        assert "seats_remaining" in data, "Missing 'seats_remaining' field"
        assert "seats_taken" in data, "Missing 'seats_taken' field"
        
        # Verify ticket prices structure
        prices = data["ticket_prices"]
        assert "individu" in prices, "Missing 'individu' ticket tier"
        assert "duo" in prices, "Missing 'duo' ticket tier"
        assert "lembaga" in prices, "Missing 'lembaga' ticket tier"
        
        assert prices["individu"]["price"] == 85000, f"Expected individu=85000, got {prices['individu']['price']}"
        assert prices["duo"]["price"] == 149000, f"Expected duo=149000, got {prices['duo']['price']}"
        assert prices["lembaga"]["price"] == 199000, f"Expected lembaga=199000, got {prices['lembaga']['price']}"
        
        print(f"✓ Event endpoint returns correct data structure")
    
    def test_event_endpoint_404_nonexistent(self):
        """GET /api/webinar/events/invalid returns 404"""
        response = requests.get(f"{BASE_URL}/api/webinar/events/nonexistent-webinar")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent event returns 404")
    
    def test_register_creates_registrant_returns_invoice(self, event_id):
        """POST /api/webinar/register creates registrant and returns invoice_id"""
        payload = {
            "event_id": event_id,
            "full_name": "TEST_Register User",
            "email": "test_register@example.com",
            "whatsapp": "081234567890",
            "role": "Fundraiser / Penggalang Dana",
            "ticket_type": "individu"
        }
        response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True, "Response should have success=True"
        assert "data" in data, "Missing 'data' field"
        assert "invoice_id" in data["data"], "Missing 'invoice_id' in data"
        assert data["data"]["invoice_id"].startswith("MWN-PS-"), f"Invoice should start with MWN-PS-, got {data['data']['invoice_id']}"
        assert data["data"]["amount"] == 85000, f"Expected amount=85000, got {data['data']['amount']}"
        
        print(f"✓ Registration successful, invoice: {data['data']['invoice_id']}")
    
    def test_get_registrant_by_invoice(self, event_id):
        """GET /api/webinar/registrant/{invoice_id} returns registrant data"""
        # First create a registrant
        payload = {
            "event_id": event_id,
            "full_name": "TEST_Lookup User",
            "email": "test_lookup2@example.com",
            "whatsapp": "081234567891",
            "role": "Marketing NGO / Yayasan",
            "ticket_type": "duo"
        }
        reg_response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        invoice_id = reg_response.json()["data"]["invoice_id"]
        
        # Now lookup
        response = requests.get(f"{BASE_URL}/api/webinar/registrant/{invoice_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["invoice_id"] == invoice_id
        assert data["full_name"] == "TEST_Lookup User"
        assert data["ticket_type"] == "duo"
        assert data["ticket_status"] == "PENDING_PAYMENT"
        assert data["amount"] == 149000
        
        print(f"✓ Registrant lookup successful: {data['invoice_id']}")
    
    def test_get_registrant_404_nonexistent(self):
        """GET /api/webinar/registrant/invalid returns 404"""
        response = requests.get(f"{BASE_URL}/api/webinar/registrant/MWN-PS-NONEXISTENT")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent invoice returns 404")
    
    def test_payment_channels_endpoint(self):
        """GET /api/webinar/payment-channels returns channels array (may be empty due to IP)"""
        response = requests.get(f"{BASE_URL}/api/webinar/payment-channels")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "channels" in data, "Missing 'channels' field"
        assert isinstance(data["channels"], list), "channels should be a list"
        
        # Note: TriPay may return empty due to IP whitelisting issue
        print(f"✓ Payment channels endpoint returns {len(data['channels'])} channels (may be empty due to IP whitelisting)")
    
    def test_create_payment_endpoint_accepts_json(self, event_id):
        """POST /api/webinar/create-payment accepts JSON body with invoice_id and method fields"""
        # First create a registrant
        payload = {
            "event_id": event_id,
            "full_name": "TEST_Payment User",
            "email": "test_payment@example.com",
            "whatsapp": "081234567892",
            "role": "Copywriter",
            "ticket_type": "individu"
        }
        reg_response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        invoice_id = reg_response.json()["data"]["invoice_id"]
        
        # Try to create payment (expected to fail due to IP whitelisting, but should accept the request)
        response = requests.post(f"{BASE_URL}/api/webinar/create-payment", json={
            "invoice_id": invoice_id,
            "method": "BRIVA"
        })
        
        # Should return 400 with TriPay error message (IP not whitelisted) - NOT 500
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        
        # If 400, check it's about TriPay not internal server error
        if response.status_code == 400:
            data = response.json()
            assert "detail" in data, "400 response should have 'detail' field"
            # The error should be from TriPay about IP whitelisting
            print(f"✓ Create payment endpoint works correctly, returned expected error: {data.get('detail', '')}")
        else:
            print("✓ Create payment endpoint successful")


# ============ ADMIN API TESTS ============
class TestAdminWebinarAPIs:
    """Admin API tests for webinar management"""
    
    def test_admin_login_success(self):
        """POST /api/admin/login with correct password returns token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Missing 'access_token' field"
        assert "token_type" in data, "Missing 'token_type' field"
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        
        print("✓ Admin login successful, token received")
    
    def test_admin_login_wrong_password(self):
        """POST /api/admin/login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "wrongpassword"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong password correctly returns 401")
    
    def test_admin_dashboard_returns_stats(self, admin_token):
        """GET /api/admin/webinar/dashboard returns stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/webinar/dashboard", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify all required stats fields
        assert "total_registrants" in data, "Missing 'total_registrants'"
        assert "total_paid" in data, "Missing 'total_paid'"
        assert "total_pending" in data, "Missing 'total_pending'"
        assert "total_revenue" in data, "Missing 'total_revenue'"
        assert "events" in data, "Missing 'events'"
        assert "recent_transactions" in data, "Missing 'recent_transactions'"
        
        # Verify data types
        assert isinstance(data["total_registrants"], int)
        assert isinstance(data["total_paid"], int)
        assert isinstance(data["total_pending"], int)
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["events"], list)
        assert isinstance(data["recent_transactions"], list)
        
        print(f"✓ Dashboard stats: registrants={data['total_registrants']}, paid={data['total_paid']}, pending={data['total_pending']}, revenue={data['total_revenue']}")
    
    def test_admin_registrants_list(self, admin_token):
        """GET /api/admin/webinar/registrants returns list of registrants with filtering"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test without filters
        response = requests.get(f"{BASE_URL}/api/admin/webinar/registrants", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Test with status filter
        response_filtered = requests.get(f"{BASE_URL}/api/admin/webinar/registrants?status=PENDING_PAYMENT", headers=headers)
        assert response_filtered.status_code == 200
        
        print(f"✓ Registrants list: {len(data)} total registrants")
    
    def test_admin_update_registrant_status(self, admin_token, event_id):
        """PUT /api/admin/webinar/registrants/{id}/status updates registrant status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a test registrant
        payload = {
            "event_id": event_id,
            "full_name": "TEST_AdminUpdate User",
            "email": "test_adminupdate@example.com",
            "whatsapp": "081234567999",
            "role": "Tim Digital Campaign",
            "ticket_type": "individu"
        }
        reg_response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        invoice_id = reg_response.json()["data"]["invoice_id"]
        
        # Get the registrant ID from admin endpoint
        list_response = requests.get(f"{BASE_URL}/api/admin/webinar/registrants", headers=headers)
        registrants = list_response.json()
        
        # Find our test registrant
        test_registrant = next((r for r in registrants if r["invoice_id"] == invoice_id), None)
        assert test_registrant is not None, "Test registrant not found"
        
        registrant_id = test_registrant["id"]
        
        # Update status to PAID
        update_response = requests.put(
            f"{BASE_URL}/api/admin/webinar/registrants/{registrant_id}/status",
            json={"status": "PAID"},
            headers=headers
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        # Verify the status was updated
        verify_response = requests.get(f"{BASE_URL}/api/webinar/registrant/{invoice_id}")
        assert verify_response.json()["ticket_status"] == "PAID"
        
        print(f"✓ Status update successful: {invoice_id} -> PAID")
    
    def test_admin_update_invalid_status(self, admin_token, event_id):
        """PUT /api/admin/webinar/registrants/{id}/status with invalid status returns 400"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a registrant
        payload = {
            "event_id": event_id,
            "full_name": "TEST_InvalidStatus User",
            "email": "test_invalid@example.com",
            "whatsapp": "081234567888",
            "role": "Lainnya",
            "ticket_type": "individu"
        }
        reg_response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        invoice_id = reg_response.json()["data"]["invoice_id"]
        
        # Get registrant ID
        list_response = requests.get(f"{BASE_URL}/api/admin/webinar/registrants", headers=headers)
        registrants = list_response.json()
        test_registrant = next((r for r in registrants if r["invoice_id"] == invoice_id), None)
        
        # Try to update with invalid status
        update_response = requests.put(
            f"{BASE_URL}/api/admin/webinar/registrants/{test_registrant['id']}/status",
            json={"status": "INVALID_STATUS"},
            headers=headers
        )
        assert update_response.status_code == 400, f"Expected 400, got {update_response.status_code}"
        
        print("✓ Invalid status correctly returns 400")
    
    def test_admin_callback_logs(self, admin_token):
        """GET /api/admin/webinar/callback-logs returns callback logs"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/webinar/callback-logs", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Callback logs returned: {len(data)} logs")


# ============ TRIPAY CALLBACK TESTS ============
class TestTripayCallback:
    """Tests for POST /api/tripay/callback endpoint"""
    
    def test_callback_endpoint_exists_and_handles_invalid_signature(self):
        """POST /api/tripay/callback handles callback with signature validation"""
        # Send a test callback with invalid signature
        headers = {
            "X-Callback-Signature": "invalid_signature",
            "X-Callback-Event": "payment_status"
        }
        payload = {
            "merchant_ref": "MWN-PS-TEST",
            "reference": "TEST123",
            "status": "PAID"
        }
        
        response = requests.post(f"{BASE_URL}/api/tripay/callback", json=payload, headers=headers)
        # Should return 200 but with success: false due to invalid signature
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Invalid signature should return success: false
        assert data.get("success") == False or "Invalid signature" in data.get("message", "")
        
        print("✓ Callback endpoint handles invalid signature correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
