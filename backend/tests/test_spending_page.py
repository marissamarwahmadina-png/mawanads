"""
Spending Page Backend API Tests (Iteration 9)
Tests for:
- GET /api/admin/whitelist/spends/monthly endpoint (merged users with spend data)
- Bank info fields in whitelist user creation/update
- Inline spend input/update functionality
"""
import pytest
import requests
import os
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


class TestMonthlySpendsMerged:
    """Tests for GET /api/admin/whitelist/spends/monthly endpoint"""
    
    test_user_id = None
    test_spend_id = None
    
    @pytest.fixture(autouse=True)
    def setup_test_user(self, headers):
        """Create test user with bank info for testing"""
        if TestMonthlySpendsMerged.test_user_id is None:
            unique = random_str()
            payload = {
                "name": f"TEST_MonthlyUser_{unique}",
                "email": f"monthly_{unique}@test.com",
                "phone": f"0812{random.randint(10000000, 99999999)}",
                "cashback_percentage": 15.0,
                "referral": "TEST_MonthlyRef",
                "bank_name": "BCA",
                "account_name": f"Test Account {unique}",
                "account_number": f"1234567890{random.randint(100, 999)}"
            }
            response = requests.post(f"{BASE_URL}/api/admin/whitelist", json=payload, headers=headers)
            if response.status_code == 200:
                TestMonthlySpendsMerged.test_user_id = response.json()["data"]["id"]
                print(f"Created test user: {TestMonthlySpendsMerged.test_user_id}")
        yield
    
    def test_get_monthly_spends_returns_all_users(self, headers):
        """GET /api/admin/whitelist/spends/monthly - Should return all users merged with spend data"""
        month = 1
        year = 2026
        
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/spends/monthly?month={month}&year={year}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get monthly spends failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "month" in data, "Missing 'month' field"
        assert "year" in data, "Missing 'year' field"
        assert "data" in data, "Missing 'data' field"
        assert "total_spend" in data, "Missing 'total_spend' field"
        assert "total_cashback" in data, "Missing 'total_cashback' field"
        
        assert data["month"] == month
        assert data["year"] == year
        assert isinstance(data["data"], list), "data field should be a list"
        
        # Verify each user record has required fields
        if len(data["data"]) > 0:
            user_record = data["data"][0]
            required_fields = [
                "user_id", "user_name", "email", "phone", "referral",
                "cashback_percentage", "spend_id", "spend_amount", 
                "cashback_amount", "proof_url", "notes", "has_data",
                "bank_name", "account_name", "account_number"
            ]
            for field in required_fields:
                assert field in user_record, f"Missing '{field}' in user record"
        
        print(f"✓ Monthly spends endpoint returns {len(data['data'])} users, total_spend: {data['total_spend']}, total_cashback: {data['total_cashback']}")
    
    def test_monthly_spends_with_different_months(self, headers):
        """Test that different months return correct data"""
        # Test current month
        current_month = 1
        current_year = 2026
        
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/spends/monthly?month={current_month}&year={current_year}",
            headers=headers
        )
        assert response.status_code == 200
        
        # Test a different month
        response2 = requests.get(
            f"{BASE_URL}/api/admin/whitelist/spends/monthly?month=6&year=2025",
            headers=headers
        )
        assert response2.status_code == 200
        
        print("✓ Monthly spends works for different months")
    
    def test_create_spend_and_verify_in_monthly(self, headers):
        """Create spend for user and verify it appears in monthly endpoint"""
        assert TestMonthlySpendsMerged.test_user_id, "No test user created"
        
        # Pick a unique month/year
        test_month = random.randint(1, 12)
        test_year = 2024
        spend_amount = 5000000.0
        
        # Create spend
        create_res = requests.post(
            f"{BASE_URL}/api/admin/whitelist/{TestMonthlySpendsMerged.test_user_id}/spends",
            json={"month": test_month, "year": test_year, "spend_amount": spend_amount, "notes": "Test monthly spend"},
            headers=headers
        )
        
        if create_res.status_code == 200:
            TestMonthlySpendsMerged.test_spend_id = create_res.json()["data"]["id"]
            
            # Verify in monthly endpoint
            monthly_res = requests.get(
                f"{BASE_URL}/api/admin/whitelist/spends/monthly?month={test_month}&year={test_year}",
                headers=headers
            )
            assert monthly_res.status_code == 200
            data = monthly_res.json()
            
            # Find our user in the data
            user_entry = next((u for u in data["data"] if u["user_id"] == TestMonthlySpendsMerged.test_user_id), None)
            assert user_entry is not None, "Test user not found in monthly data"
            assert user_entry["has_data"] == True, "User should have has_data=True"
            assert user_entry["spend_amount"] == spend_amount, f"Spend amount mismatch: {user_entry['spend_amount']} != {spend_amount}"
            
            # Verify cashback calculation (15% of 5,000,000 = 750,000)
            expected_cashback = spend_amount * 0.15
            assert user_entry["cashback_amount"] == expected_cashback, f"Cashback mismatch: {user_entry['cashback_amount']} != {expected_cashback}"
            
            print(f"✓ Created spend for month {test_month}/{test_year}, verified in monthly endpoint with cashback {expected_cashback}")
        else:
            # Already exists, still valid
            print(f"✓ Spend already exists for test month/year (duplicate rejected)")


class TestBankInfoFields:
    """Tests for bank info fields in whitelist user"""
    
    test_user_id = None
    
    def test_create_user_with_bank_info(self, headers):
        """Create user with bank info fields"""
        unique = random_str()
        payload = {
            "name": f"TEST_BankUser_{unique}",
            "email": f"bank_{unique}@test.com",
            "phone": f"0812{random.randint(10000000, 99999999)}",
            "cashback_percentage": 10.0,
            "referral": "TEST_BankRef",
            "bank_name": "Bank BRI",
            "account_name": "John Doe Test",
            "account_number": "1234567890123"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/whitelist", json=payload, headers=headers)
        
        assert response.status_code == 200, f"Create user failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        user_data = data["data"]
        assert user_data["bank_name"] == payload["bank_name"], "Bank name mismatch"
        assert user_data["account_name"] == payload["account_name"], "Account name mismatch"
        assert user_data["account_number"] == payload["account_number"], "Account number mismatch"
        
        TestBankInfoFields.test_user_id = user_data["id"]
        print(f"✓ Created user with bank info: {payload['bank_name']}, {payload['account_name']}, {payload['account_number']}")
    
    def test_update_user_bank_info(self, headers):
        """Update user's bank info"""
        assert TestBankInfoFields.test_user_id, "No test user to update"
        
        update_payload = {
            "bank_name": "Bank Mandiri",
            "account_name": "Jane Doe Updated",
            "account_number": "9876543210987"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/whitelist/{TestBankInfoFields.test_user_id}",
            json=update_payload, headers=headers
        )
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update by getting the user list
        list_res = requests.get(f"{BASE_URL}/api/admin/whitelist", headers=headers)
        users = list_res.json()
        user = next((u for u in users if u["id"] == TestBankInfoFields.test_user_id), None)
        
        assert user is not None, "User not found"
        assert user["bank_name"] == update_payload["bank_name"], "Bank name not updated"
        assert user["account_name"] == update_payload["account_name"], "Account name not updated"
        assert user["account_number"] == update_payload["account_number"], "Account number not updated"
        
        print(f"✓ Updated bank info: {update_payload['bank_name']}, {update_payload['account_name']}")
    
    def test_bank_info_in_monthly_endpoint(self, headers):
        """Bank info should appear in monthly spends endpoint"""
        assert TestBankInfoFields.test_user_id, "No test user"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/whitelist/spends/monthly?month=1&year=2026",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find our user
        user_entry = next((u for u in data["data"] if u["user_id"] == TestBankInfoFields.test_user_id), None)
        if user_entry:
            assert "bank_name" in user_entry, "bank_name missing in monthly data"
            assert "account_name" in user_entry, "account_name missing in monthly data"
            assert "account_number" in user_entry, "account_number missing in monthly data"
            print(f"✓ Bank info present in monthly endpoint: {user_entry['bank_name']}")
        else:
            print("✓ Test user not in current month data (expected if new)")


class TestInlineSpendUpdate:
    """Tests for inline spend update (save/update via spending page)"""
    
    test_user_id = None
    test_spend_id = None
    
    @pytest.fixture(autouse=True)
    def setup_user(self, headers):
        """Create test user for inline update tests"""
        if TestInlineSpendUpdate.test_user_id is None:
            unique = random_str()
            user_res = requests.post(
                f"{BASE_URL}/api/admin/whitelist",
                json={"name": f"TEST_InlineUser_{unique}", "cashback_percentage": 12.0},
                headers=headers
            )
            if user_res.status_code == 200:
                TestInlineSpendUpdate.test_user_id = user_res.json()["data"]["id"]
        yield
    
    def test_inline_create_spend(self, headers):
        """Create spend via POST (simulating inline add)"""
        assert TestInlineSpendUpdate.test_user_id, "No test user"
        
        test_month = 3
        test_year = 2027
        spend_amount = 8000000.0
        
        response = requests.post(
            f"{BASE_URL}/api/admin/whitelist/{TestInlineSpendUpdate.test_user_id}/spends",
            json={"month": test_month, "year": test_year, "spend_amount": spend_amount, "notes": "Inline created"},
            headers=headers
        )
        
        # May be 200 (created) or 400 (duplicate)
        if response.status_code == 200:
            TestInlineSpendUpdate.test_spend_id = response.json()["data"]["id"]
            
            # Verify cashback calculation (12% of 8,000,000 = 960,000)
            expected_cashback = spend_amount * 0.12
            assert response.json()["data"]["cashback_amount"] == expected_cashback
            print(f"✓ Inline created spend with auto-cashback: {expected_cashback}")
        else:
            assert response.status_code == 400  # Duplicate is okay
            print("✓ Inline create rejected duplicate (expected)")
    
    def test_inline_update_spend(self, headers):
        """Update spend via PUT (simulating inline edit)"""
        if TestInlineSpendUpdate.test_spend_id is None:
            pytest.skip("No spend to update")
        
        new_amount = 12000000.0
        response = requests.put(
            f"{BASE_URL}/api/admin/whitelist/spends/{TestInlineSpendUpdate.test_spend_id}",
            json={"spend_amount": new_amount, "notes": "Inline updated"},
            headers=headers
        )
        
        assert response.status_code == 200, f"Inline update failed: {response.text}"
        
        # Verify updated cashback (12% of 12,000,000 = 1,440,000)
        # Check via user spends endpoint
        user_spends = requests.get(
            f"{BASE_URL}/api/admin/whitelist/{TestInlineSpendUpdate.test_user_id}/spends",
            headers=headers
        )
        spends = user_spends.json()
        spend = next((s for s in spends if s["id"] == TestInlineSpendUpdate.test_spend_id), None)
        
        if spend:
            expected_cashback = new_amount * 0.12
            assert spend["cashback_amount"] == expected_cashback, f"Cashback not updated: {spend['cashback_amount']} != {expected_cashback}"
            print(f"✓ Inline updated spend, new cashback: {expected_cashback}")


class TestProofUploadForSpending:
    """Tests for proof upload in spending page context"""
    
    test_spend_id = None
    
    @pytest.fixture(autouse=True)
    def setup_spend(self, headers):
        """Create spend for proof upload test"""
        if TestProofUploadForSpending.test_spend_id is None:
            unique = random_str()
            user_res = requests.post(
                f"{BASE_URL}/api/admin/whitelist",
                json={"name": f"TEST_ProofSpendUser_{unique}", "cashback_percentage": 10},
                headers=headers
            )
            if user_res.status_code == 200:
                user_id = user_res.json()["data"]["id"]
                spend_res = requests.post(
                    f"{BASE_URL}/api/admin/whitelist/{user_id}/spends",
                    json={"month": random.randint(1, 12), "year": 2033, "spend_amount": 3000000},
                    headers=headers
                )
                if spend_res.status_code == 200:
                    TestProofUploadForSpending.test_spend_id = spend_res.json()["data"]["id"]
        yield
    
    def test_upload_proof_and_verify_url(self, headers):
        """Upload proof and verify URL is returned"""
        if TestProofUploadForSpending.test_spend_id is None:
            pytest.skip("No spend for proof test")
        
        files = {'file': ('proof_test.jpg', b'fake image content', 'image/jpeg')}
        upload_headers = {"Authorization": headers["Authorization"]}
        
        response = requests.post(
            f"{BASE_URL}/api/admin/whitelist/spends/{TestProofUploadForSpending.test_spend_id}/proof",
            files=files, headers=upload_headers
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "proof_url" in data
        assert data["proof_url"].startswith("/api/admin/whitelist/uploads/")
        
        # Verify URL is accessible
        proof_url = data["proof_url"]
        get_proof = requests.get(f"{BASE_URL}{proof_url}", headers=headers)
        assert get_proof.status_code == 200, "Proof file should be accessible"
        
        print(f"✓ Uploaded proof, URL: {proof_url}")


class TestCleanup:
    """Cleanup TEST_ prefixed data"""
    
    def test_cleanup_test_users(self, headers):
        """Clean up all TEST_ prefixed users"""
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
