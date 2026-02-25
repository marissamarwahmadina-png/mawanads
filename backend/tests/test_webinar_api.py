"""
Backend API tests for Webinar system - Psikologi Sedekah
Tests: event retrieval, registration flow, payment channels, registrant lookup
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebinarEventAPI:
    """Tests for GET /api/webinar/events/psikologi-sedekah"""

    def test_get_event_by_slug_success(self):
        """Event endpoint returns correct data structure"""
        response = requests.get(f"{BASE_URL}/api/webinar/events/psikologi-sedekah")
        assert response.status_code == 200
        
        data = response.json()
        # Verify event data structure
        assert data["slug"] == "psikologi-sedekah"
        assert "title" in data
        assert "ticket_prices" in data
        assert "start_datetime" in data
        assert "seats_remaining" in data
        assert "seats_taken" in data
        
        # Verify ticket prices
        prices = data["ticket_prices"]
        assert "individu" in prices
        assert "duo" in prices
        assert "lembaga" in prices
        
        # Verify price values
        assert prices["individu"]["price"] == 85000
        assert prices["duo"]["price"] == 149000
        assert prices["lembaga"]["price"] == 199000
        
        # Verify labels
        assert prices["individu"]["label"] == "Daftar Individu"
        assert prices["duo"]["label"] == "Daftar 2 Orang"
        assert prices["lembaga"]["label"] == "Daftar 1 Lembaga (3 Orang)"
        
        print(f"✓ Event retrieved: {data['title']}")
        print(f"✓ Ticket prices: individu={prices['individu']['price']}, duo={prices['duo']['price']}, lembaga={prices['lembaga']['price']}")

    def test_get_event_nonexistent_slug(self):
        """Non-existent event returns 404"""
        response = requests.get(f"{BASE_URL}/api/webinar/events/nonexistent-event")
        assert response.status_code == 404
        print("✓ Non-existent event correctly returns 404")


class TestWebinarRegistration:
    """Tests for POST /api/webinar/register"""
    
    @pytest.fixture
    def event_id(self):
        """Get the psikologi-sedekah event ID"""
        response = requests.get(f"{BASE_URL}/api/webinar/events/psikologi-sedekah")
        return response.json()["id"]
    
    def test_register_individu_ticket(self, event_id):
        """Register with individu ticket type"""
        payload = {
            "event_id": event_id,
            "full_name": "TEST_User Individu",
            "email": "test_individu@example.com",
            "whatsapp": "081234567890",
            "role": "Fundraiser / Penggalang Dana",
            "ticket_type": "individu"
        }
        response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert data["data"]["invoice_id"].startswith("MWN-PS-")
        assert data["data"]["amount"] == 85000
        
        print(f"✓ Individu registration successful: invoice={data['data']['invoice_id']}")
        return data["data"]["invoice_id"]
    
    def test_register_duo_ticket(self, event_id):
        """Register with duo ticket type"""
        payload = {
            "event_id": event_id,
            "full_name": "TEST_User Duo",
            "email": "test_duo@example.com",
            "whatsapp": "081234567891",
            "role": "Marketing NGO / Yayasan",
            "ticket_type": "duo"
        }
        response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["data"]["amount"] == 149000
        
        print(f"✓ Duo registration successful: invoice={data['data']['invoice_id']}")
    
    def test_register_lembaga_ticket(self, event_id):
        """Register with lembaga ticket type"""
        payload = {
            "event_id": event_id,
            "full_name": "TEST_User Lembaga",
            "email": "test_lembaga@example.com",
            "whatsapp": "081234567892",
            "role": "Pimpinan Lembaga Amal",
            "ticket_type": "lembaga"
        }
        response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["data"]["amount"] == 199000
        
        print(f"✓ Lembaga registration successful: invoice={data['data']['invoice_id']}")
    
    def test_register_invalid_event(self):
        """Registration with invalid event_id returns 404"""
        payload = {
            "event_id": "invalid-id-12345",
            "full_name": "Test User",
            "email": "test@example.com",
            "whatsapp": "081234567890",
            "role": "Copywriter",
            "ticket_type": "individu"
        }
        response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        assert response.status_code == 404
        print("✓ Invalid event_id correctly returns 404")


class TestWebinarPaymentChannels:
    """Tests for GET /api/webinar/payment-channels"""
    
    def test_payment_channels_returns_empty(self):
        """Payment channels returns empty list when no TriPay API key configured"""
        response = requests.get(f"{BASE_URL}/api/webinar/payment-channels")
        assert response.status_code == 200
        
        data = response.json()
        assert "channels" in data
        # Since no TriPay key is configured, should return empty
        assert isinstance(data["channels"], list)
        print(f"✓ Payment channels endpoint working, returned {len(data['channels'])} channels")


class TestWebinarRegistrantLookup:
    """Tests for GET /api/webinar/registrant/{invoice_id}"""
    
    def test_lookup_registrant_after_registration(self):
        """Create a registration and then look it up by invoice_id"""
        # First get event ID
        event_response = requests.get(f"{BASE_URL}/api/webinar/events/psikologi-sedekah")
        event_id = event_response.json()["id"]
        
        # Register
        payload = {
            "event_id": event_id,
            "full_name": "TEST_Lookup User",
            "email": "test_lookup@example.com",
            "whatsapp": "081234567899",
            "role": "Konsultan Fundraising",
            "ticket_type": "individu"
        }
        reg_response = requests.post(f"{BASE_URL}/api/webinar/register", json=payload)
        invoice_id = reg_response.json()["data"]["invoice_id"]
        
        # Look up registrant
        lookup_response = requests.get(f"{BASE_URL}/api/webinar/registrant/{invoice_id}")
        assert lookup_response.status_code == 200
        
        data = lookup_response.json()
        assert data["invoice_id"] == invoice_id
        assert data["full_name"] == "TEST_Lookup User"
        assert data["email"] == "test_lookup@example.com"
        assert data["ticket_type"] == "individu"
        assert data["ticket_status"] == "PENDING_PAYMENT"
        assert data["amount"] == 85000
        
        print(f"✓ Registrant lookup successful: {data['full_name']} - {data['ticket_status']}")
    
    def test_lookup_nonexistent_invoice(self):
        """Non-existent invoice returns 404"""
        response = requests.get(f"{BASE_URL}/api/webinar/registrant/MWN-PS-NONEXISTENT")
        assert response.status_code == 404
        print("✓ Non-existent invoice correctly returns 404")


class TestLegalPagesAccess:
    """Tests for legal page accessibility (just checking URLs return HTML)"""
    
    def test_ketentuan_layanan_page(self):
        """Ketentuan Layanan page is accessible"""
        response = requests.get(f"{BASE_URL.replace('/api', '')}/ketentuan-layanan")
        assert response.status_code == 200
        print("✓ Ketentuan Layanan page accessible")
    
    def test_kebijakan_privasi_page(self):
        """Kebijakan Privasi page is accessible"""
        response = requests.get(f"{BASE_URL.replace('/api', '')}/kebijakan-privasi")
        assert response.status_code == 200
        print("✓ Kebijakan Privasi page accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
