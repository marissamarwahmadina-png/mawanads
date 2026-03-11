"""
Whitelist Cashback Dashboard - Backend API Tests
Tests for CRUD operations on whitelist users, monthly spends, proof upload, and PDF generation
"""
import pytest
import requests
import os
import time
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "mawana2025admin"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json().get("access_token")
    assert token, "No token in response"
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    """Return headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


def random_str(length=8):
    """Generate a random string for unique test data"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


class TestWhitelistUserCRUD:
    """Tests for Whitelist User CRUD operations"""
    
    created_user_id = None
    
    def test_create_whitelist_user(self, headers):
        """POST /api/admin/whitelist - Create a new whitelist user"""
        unique = random_str()
        payload = {
            "name": f"TEST_User_{unique}",
            "email": f"test_{unique}@example.com",
            "phone": f"0812{random.randint(10000000, 99999999)}",
            "cashback_percentage": 15.0,
            "referral": "TEST_Affiliate",
            "notes": "Test user for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/admin/whitelist", json=payload, headers=headers)
        
        assert response.status_code == 200, f"Create user failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Response success not True: {data}"
        assert "data" in data, "No data field in response"
        
        user_data = data["data"]
        assert user_data["name"] == payload["name"]
        assert user_data["email"] == payload["email"]
        assert user_data["phone"] == payload["phone"]
        assert user_data["cashback_percentage"] == payload["cashback_percentage"]
        assert user_data["referral"] == payload["referral"]
        assert "id" in user_data
        
        TestWhitelistUserCRUD.created_user_id = user_data["id"]
        print(f"✓ Created whitelist user: {user_data['id']}")
    
    def test_get_all_whitelist_users(self, headers):
        """GET /api/admin/whitelist - Get all whitelist users"""
        response = requests.get(f"{BASE_URL}/api/admin/whitelist", headers=headers)
        
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} whitelist users")
    
    def test_get_whitelist_summary(self, headers):
        """GET /api/admin/whitelist/summary - Get summary with aggregated data"""
        response = requests.get(f"{BASE_URL}/api/admin/whitelist/summary", headers=headers)
        
        assert response.status_code == 200, f"Get summary failed: {response.text}"
        data = response.json()
        
        assert "users" in data, "Missing 'users' field"
        assert "referrals" in data, "Missing 'referrals' field"
        assert "total_users" in data, "Missing 'total_users' field"
        assert "total_spend" in data, "Missing 'total_spend' field"
        assert "total_cashback" in data, "Missing 'total_cashback' field"
        
        print(f"✓ Summary: {data['total_users']} users, Spend: {data['total_spend']}, Cashback: {data['total_cashback']}")
    
    def test_update_whitelist_user(self, headers):
        """PUT /api/admin/whitelist/{user_id} - Update a whitelist user"""
        assert TestWhitelistUserCRUD.created_user_id, "No user created to update"
        
        update_payload = {
            "name": f"TEST_UpdatedUser_{random_str()}",
            "cashback_percentage": 20.0,
            "notes": "Updated by automated test"
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/whitelist/{TestWhitelistUserCRUD.created_user_id}",
            json=update_payload, headers=headers
        )
        
        assert response.status_code == 200, f"Update user failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Updated user {TestWhitelistUserCRUD.created_user_id}")
    
    def test_update_nonexistent_user_returns_404(self, headers):
        """PUT /api/admin/whitelist/{invalid_id} - Should return 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/whitelist/nonexistent-user-id",
            json={"name": "Test"}, headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Update nonexistent user correctly returns 404")


class TestMonthlySpendCRUD:
    """Tests for Monthly Spend CRUD operations"""
    
    test_user_id = None
    created_spend_id = None
    
    @pytest.fixture(autouse=True)
    def setup_user(self, headers):
        """Create a test user for spend tests"""
        if TestMonthlySpendCRUD.test_user_id is None:
            unique = random_str()
            payload = {
                "name": f"TEST_SpendUser_{unique}",
                "email": f"spend_{unique}@example.com",
                "cashback_percentage": 12.0,
                "referral": "TEST_SpendAffiliate"
            }
            response = requests.post(f"{BASE_URL}/api/admin/whitelist", json=payload, headers=headers)
            if response.status_code == 200:
                TestMonthlySpendCRUD.test_user_id = response.json()["data"]["id"]
        yield
    
    def test_create_monthly_spend(self, headers):
        """POST /api/admin/whitelist/{user_id}/spends - Create monthly spend"""
        assert TestMonthlySpendCRUD.test_user_id, "No test user for spend creation"
        
        # Use random month/year to avoid duplicate error
        month = random.randint(1, 12)
        year = 2025 + random.randint(0, 5)
        
        payload = {
            "month": month,
            "year": year,
            "spend_amount": 5000000.0,
            "notes": "Test spend entry"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/whitelist/{TestMonthlySpendCRUD.test_user_id}/spends",
            json=payload, headers=headers
        )
        
        assert response.status_code == 200, f"Create spend failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        spend_data = data["data"]
        assert spend_data["spend_amount"] == payload["spend_amount"]
        assert spend_data["month"] == payload["month"]
        assert spend_data["year"] == payload["year"]
        # Verify auto-calculated cashback (12% of 5,000,000 = 600,000)
        expected_cashback = 5000000.0 * 0.12
        assert spend_data["cashback_amount"] == expected_cashback, f"Cashback should be {expected_cashback}, got {spend_data['cashback_amount']}"
        assert "id" in spend_data
        
        TestMonthlySpendCRUD.created_spend_id = spend_data["id"]
        print(f"✓ Created spend: {spend_data['id']}, Cashback: {spend_data['cashback_amount']}")
    
    def test_get_user_spends(self, headers):
        """GET /api/admin/whitelist/{user_id}/spends - Get all spends for user"""
        assert TestMonthlySpendCRUD.test_user_id, "No test user"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/{TestMonthlySpendCRUD.test_user_id}/spends",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get spends failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} spends for user")
    
    def test_duplicate_month_year_rejected(self, headers):
        """POST duplicate month/year should be rejected"""
        assert TestMonthlySpendCRUD.test_user_id, "No test user"
        
        # Create first spend for Jan 2026
        payload = {"month": 1, "year": 2026, "spend_amount": 1000000.0}
        response1 = requests.post(
            f"{BASE_URL}/api/admin/whitelist/{TestMonthlySpendCRUD.test_user_id}/spends",
            json=payload, headers=headers
        )
        
        if response1.status_code == 200:
            # Try to create duplicate
            response2 = requests.post(
                f"{BASE_URL}/api/admin/whitelist/{TestMonthlySpendCRUD.test_user_id}/spends",
                json=payload, headers=headers
            )
            assert response2.status_code == 400, f"Duplicate should be rejected, got {response2.status_code}"
            print("✓ Duplicate month/year correctly rejected")
        else:
            # Already exists, so test passed
            assert response1.status_code == 400
            print("✓ Duplicate month/year correctly rejected (already exists)")
    
    def test_update_monthly_spend(self, headers):
        """PUT /api/admin/whitelist/spends/{spend_id} - Update spend"""
        assert TestMonthlySpendCRUD.created_spend_id, "No spend created to update"
        
        update_payload = {
            "spend_amount": 7500000.0,
            "notes": "Updated spend amount"
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/whitelist/spends/{TestMonthlySpendCRUD.created_spend_id}",
            json=update_payload, headers=headers
        )
        
        assert response.status_code == 200, f"Update spend failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Updated spend {TestMonthlySpendCRUD.created_spend_id}")


class TestProofUpload:
    """Tests for proof of payment upload"""
    
    test_spend_id = None
    
    @pytest.fixture(autouse=True)
    def setup_spend(self, headers):
        """Create test user and spend for upload tests"""
        if TestProofUpload.test_spend_id is None:
            # Create user
            unique = random_str()
            user_res = requests.post(
                f"{BASE_URL}/api/admin/whitelist",
                json={"name": f"TEST_ProofUser_{unique}", "cashback_percentage": 10},
                headers=headers
            )
            if user_res.status_code == 200:
                user_id = user_res.json()["data"]["id"]
                # Create spend
                spend_res = requests.post(
                    f"{BASE_URL}/api/admin/whitelist/{user_id}/spends",
                    json={"month": random.randint(1, 12), "year": 2030, "spend_amount": 2000000},
                    headers=headers
                )
                if spend_res.status_code == 200:
                    TestProofUpload.test_spend_id = spend_res.json()["data"]["id"]
        yield
    
    def test_upload_proof_of_payment(self, headers):
        """POST /api/admin/whitelist/spends/{spend_id}/proof - Upload proof"""
        assert TestProofUpload.test_spend_id, "No spend for upload test"
        
        # Create a small test file in memory
        files = {
            'file': ('test_proof.txt', b'Test proof content', 'text/plain')
        }
        upload_headers = {"Authorization": headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/whitelist/spends/{TestProofUpload.test_spend_id}/proof",
            files=files, headers=upload_headers
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "proof_url" in data
        assert data["proof_url"].startswith("/api/admin/whitelist/uploads/")
        print(f"✓ Uploaded proof: {data['proof_url']}")
    
    def test_upload_to_nonexistent_spend_returns_404(self, headers):
        """POST to nonexistent spend should return 404"""
        files = {'file': ('test.txt', b'Test', 'text/plain')}
        upload_headers = {"Authorization": headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/whitelist/spends/nonexistent-spend-id/proof",
            files=files, headers=upload_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Upload to nonexistent spend returns 404")


class TestPDFGeneration:
    """Tests for PDF report generation"""
    
    test_user_id = None
    
    @pytest.fixture(autouse=True)
    def setup_user_with_spends(self, headers):
        """Create test user with spending data for PDF tests"""
        if TestPDFGeneration.test_user_id is None:
            unique = random_str()
            user_res = requests.post(
                f"{BASE_URL}/api/admin/whitelist",
                json={
                    "name": f"TEST_PDFUser_{unique}",
                    "email": f"pdf_{unique}@test.com",
                    "cashback_percentage": 15,
                    "referral": "TEST_PDFReferral"
                },
                headers=headers
            )
            if user_res.status_code == 200:
                TestPDFGeneration.test_user_id = user_res.json()["data"]["id"]
                # Add some spending data
                for m in [1, 2, 3]:
                    requests.post(
                        f"{BASE_URL}/api/admin/whitelist/{TestPDFGeneration.test_user_id}/spends",
                        json={"month": m, "year": 2028 + random.randint(0, 3), "spend_amount": 3000000 * m},
                        headers=headers
                    )
        yield
    
    def test_generate_user_pdf(self, headers):
        """GET /api/admin/whitelist/{user_id}/pdf - Generate user PDF"""
        assert TestPDFGeneration.test_user_id, "No user for PDF test"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/{TestPDFGeneration.test_user_id}/pdf",
            headers=headers
        )
        
        assert response.status_code == 200, f"PDF generation failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0, "PDF content is empty"
        print(f"✓ Generated user PDF ({len(response.content)} bytes)")
    
    def test_generate_pdf_nonexistent_user_returns_404(self, headers):
        """PDF for nonexistent user should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/nonexistent-user-id/pdf",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PDF for nonexistent user returns 404")
    
    def test_generate_referral_pdf(self, headers):
        """GET /api/admin/whitelist/referral/{name}/pdf - Generate referral PDF"""
        # Use the referral name from test user
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/referral/TEST_PDFReferral/pdf",
            headers=headers
        )
        
        assert response.status_code == 200, f"Referral PDF failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✓ Generated referral PDF ({len(response.content)} bytes)")
    
    def test_referral_pdf_nonexistent_returns_404(self, headers):
        """PDF for nonexistent referral should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/referral/NonexistentReferral123xyz/pdf",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PDF for nonexistent referral returns 404")


class TestDeleteOperations:
    """Tests for delete operations - run last"""
    
    def test_delete_monthly_spend(self, headers):
        """DELETE /api/admin/whitelist/spends/{spend_id}"""
        # Create user and spend to delete
        unique = random_str()
        user_res = requests.post(
            f"{BASE_URL}/api/admin/whitelist",
            json={"name": f"TEST_DeleteSpendUser_{unique}", "cashback_percentage": 10},
            headers=headers
        )
        assert user_res.status_code == 200
        user_id = user_res.json()["data"]["id"]
        
        spend_res = requests.post(
            f"{BASE_URL}/api/admin/whitelist/{user_id}/spends",
            json={"month": 6, "year": 2029, "spend_amount": 1000000},
            headers=headers
        )
        assert spend_res.status_code == 200
        spend_id = spend_res.json()["data"]["id"]
        
        # Delete the spend
        delete_res = requests.delete(
            f"{BASE_URL}/api/admin/whitelist/spends/{spend_id}",
            headers=headers
        )
        assert delete_res.status_code == 200, f"Delete spend failed: {delete_res.text}"
        
        # Verify spend is gone
        get_res = requests.get(
            f"{BASE_URL}/api/admin/whitelist/{user_id}/spends",
            headers=headers
        )
        spends = get_res.json()
        assert not any(s["id"] == spend_id for s in spends), "Spend should be deleted"
        print(f"✓ Deleted spend {spend_id}")
        
        # Cleanup user
        requests.delete(f"{BASE_URL}/api/admin/whitelist/{user_id}", headers=headers)
    
    def test_delete_nonexistent_spend_returns_404(self, headers):
        """DELETE nonexistent spend should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/whitelist/spends/nonexistent-spend-id",
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Delete nonexistent spend returns 404")
    
    def test_delete_whitelist_user(self, headers):
        """DELETE /api/admin/whitelist/{user_id} - Delete user and associated spends"""
        unique = random_str()
        user_res = requests.post(
            f"{BASE_URL}/api/admin/whitelist",
            json={"name": f"TEST_DeleteUser_{unique}", "cashback_percentage": 10},
            headers=headers
        )
        assert user_res.status_code == 200
        user_id = user_res.json()["data"]["id"]
        
        # Add some spends
        for m in [1, 2]:
            requests.post(
                f"{BASE_URL}/api/admin/whitelist/{user_id}/spends",
                json={"month": m, "year": 2035, "spend_amount": 500000},
                headers=headers
            )
        
        # Delete user
        delete_res = requests.delete(
            f"{BASE_URL}/api/admin/whitelist/{user_id}",
            headers=headers
        )
        assert delete_res.status_code == 200, f"Delete user failed: {delete_res.text}"
        
        # Verify user is gone from list
        list_res = requests.get(f"{BASE_URL}/api/admin/whitelist", headers=headers)
        users = list_res.json()
        assert not any(u["id"] == user_id for u in users), "User should be deleted"
        print(f"✓ Deleted user {user_id} and associated spends")
    
    def test_delete_nonexistent_user_returns_404(self, headers):
        """DELETE nonexistent user should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/whitelist/nonexistent-user-id",
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Delete nonexistent user returns 404")


class TestCleanup:
    """Cleanup test data - run last"""
    
    def test_cleanup_test_users(self, headers):
        """Clean up TEST_ prefixed users"""
        response = requests.get(f"{BASE_URL}/api/admin/whitelist", headers=headers)
        if response.status_code == 200:
            users = response.json()
            deleted_count = 0
            for user in users:
                if user.get("name", "").startswith("TEST_"):
                    del_res = requests.delete(
                        f"{BASE_URL}/api/admin/whitelist/{user['id']}",
                        headers=headers
                    )
                    if del_res.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleaned up {deleted_count} TEST_ users")
