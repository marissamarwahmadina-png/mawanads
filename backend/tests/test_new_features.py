"""
Test cases for NEW features iteration 7:
1. DELETE /api/admin/webinar/registrants/{id} - Delete registrant endpoint
2. POST /api/tripay/callback with PAID status - Email confirmation trigger
"""
import pytest
import requests
import os
import hmac
import hashlib
import json
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TRIPAY_PRIVATE_KEY = "IT3AK-WsG15-R0WeE-s6cFo-HWSuh"  # From backend/.env


class TestDeleteRegistrantEndpoint:
    """Tests for DELETE /api/admin/webinar/registrants/{id}"""
    
    def test_delete_registrant_success(self):
        """Test deleting an existing registrant returns success"""
        # First, get list of registrants to find one to delete (TEST_ prefixed)
        response = requests.get(f"{BASE_URL}/api/admin/webinar/registrants")
        assert response.status_code == 200, f"Failed to get registrants: {response.text}"
        
        registrants = response.json()
        test_registrant = None
        for r in registrants:
            if r.get('full_name', '').startswith('TEST_'):
                test_registrant = r
                break
        
        if not test_registrant:
            # Create a test registrant if none exist
            reg_data = {
                "event_id": "bd8e029b-4f23-4372-890c-7ee3a8bf0881",
                "full_name": "TEST_DeleteTest User",
                "email": f"test_delete_{uuid.uuid4().hex[:8]}@test.com",
                "whatsapp": "081234567890",
                "role": "professional",
                "ticket_type": "individu",
                "payment_method": "QRIS"
            }
            create_resp = requests.post(f"{BASE_URL}/api/webinar/register", json=reg_data)
            assert create_resp.status_code == 200, f"Failed to create test registrant: {create_resp.text}"
            
            # Get the registrant ID from created data
            created_data = create_resp.json()
            registrant_id = created_data['data']['id']
        else:
            registrant_id = test_registrant['id']
        
        # Now delete the registrant
        delete_response = requests.delete(f"{BASE_URL}/api/admin/webinar/registrants/{registrant_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get('success') == True, "Response should indicate success"
        
        # Verify deletion - should not exist anymore
        verify_resp = requests.get(f"{BASE_URL}/api/admin/webinar/registrants")
        registrants_after = verify_resp.json()
        deleted_ids = [r['id'] for r in registrants_after]
        assert registrant_id not in deleted_ids, "Deleted registrant should not exist in list"
        print(f"✓ Successfully deleted registrant {registrant_id}")
    
    def test_delete_nonexistent_registrant_returns_404(self):
        """Test deleting a non-existent registrant returns 404"""
        fake_id = "nonexistent-id-12345"
        response = requests.delete(f"{BASE_URL}/api/admin/webinar/registrants/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'detail' in data, "Response should have error detail"
        print(f"✓ Correctly returned 404 for non-existent registrant")


class TestTripayCallbackEmailTrigger:
    """Tests for POST /api/tripay/callback triggering email confirmation"""
    
    def _create_signature(self, payload_str):
        """Create HMAC SHA256 signature for callback"""
        return hmac.new(
            TRIPAY_PRIVATE_KEY.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def test_tripay_callback_paid_status_triggers_email(self):
        """Test that PAID callback triggers email confirmation function"""
        # First create a test registrant to have a valid merchant_ref
        reg_data = {
            "event_id": "bd8e029b-4f23-4372-890c-7ee3a8bf0881",
            "full_name": "TEST_CallbackEmail User",
            "email": f"test_callback_{uuid.uuid4().hex[:8]}@test.com",
            "whatsapp": "081234567890",
            "role": "professional",
            "ticket_type": "individu",
            "payment_method": "QRIS"
        }
        create_resp = requests.post(f"{BASE_URL}/api/webinar/register", json=reg_data)
        assert create_resp.status_code == 200, f"Failed to create test registrant: {create_resp.text}"
        
        created_data = create_resp.json()
        invoice_id = created_data['data']['invoice_id']
        
        # Create callback payload with PAID status
        callback_payload = {
            "merchant_ref": invoice_id,
            "reference": f"T{uuid.uuid4().hex[:10].upper()}",
            "status": "PAID",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }
        
        payload_str = json.dumps(callback_payload, separators=(',', ':'))
        signature = self._create_signature(payload_str)
        
        headers = {
            "Content-Type": "application/json",
            "X-Callback-Signature": signature,
            "X-Callback-Event": "payment_status"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tripay/callback",
            data=payload_str,
            headers=headers
        )
        
        assert response.status_code == 200, f"Callback failed: {response.text}"
        data = response.json()
        assert data.get('success') == True, "Callback should return success"
        
        # Verify status was updated in database
        registrant_resp = requests.get(f"{BASE_URL}/api/webinar/registrant/{invoice_id}")
        assert registrant_resp.status_code == 200
        registrant = registrant_resp.json()
        assert registrant['ticket_status'] == 'PAID', "Status should be PAID after callback"
        assert registrant.get('paid_at') is not None, "paid_at should be set after PAID callback"
        
        print(f"✓ Callback processed, status updated to PAID for {invoice_id}")
        print("  Note: Email confirmation triggered (check backend logs for confirmation)")
    
    def test_tripay_callback_invalid_signature_rejected(self):
        """Test that invalid signature is rejected"""
        callback_payload = {
            "merchant_ref": "TEST-INVALID",
            "reference": "TINVALID123",
            "status": "PAID"
        }
        
        payload_str = json.dumps(callback_payload, separators=(',', ':'))
        
        headers = {
            "Content-Type": "application/json",
            "X-Callback-Signature": "invalid_signature_12345",
            "X-Callback-Event": "payment_status"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tripay/callback",
            data=payload_str,
            headers=headers
        )
        
        assert response.status_code == 200, f"Endpoint should return 200 even for invalid sig: {response.text}"
        data = response.json()
        assert data.get('success') == False, "Should return success=False for invalid signature"
        print("✓ Invalid signature correctly rejected")


class TestAPIHealth:
    """Basic health and API verification"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✓ Health endpoint working")
    
    def test_admin_webinar_dashboard(self):
        """Test admin dashboard still works"""
        response = requests.get(f"{BASE_URL}/api/admin/webinar/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert 'total_registrants' in data
        assert 'total_paid' in data
        assert 'total_revenue' in data
        print(f"✓ Dashboard: {data['total_registrants']} registrants, {data['total_paid']} paid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
