"""
Test new payment status features for Whitelist Cashback Dashboard:
1. Payment status toggle endpoint (PUT /api/admin/whitelist/spends/{id}/payment-status)
2. PDF endpoints with month range filter (from_month/from_year/to_month/to_year)
3. Summary endpoint returns paid/unpaid amounts per user and referral
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaymentStatusToggle:
    """Test payment status toggle functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_user_id = None
        self.created_spend_id = None
        yield
        # Cleanup
        if self.created_spend_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/spends/{self.created_spend_id}")
            except:
                pass
        if self.created_user_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}")
            except:
                pass
    
    def test_toggle_payment_status_unpaid_to_paid(self):
        """Test toggling payment status from unpaid to paid"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_PaymentToggle_User",
            "email": "test_payment@example.com",
            "cashback_percentage": 10,
            "referral": "TEST_Referral"
        })
        assert user_resp.status_code == 200, f"Failed to create user: {user_resp.text}"
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spend with default unpaid status
        spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
            "month": 1,
            "year": 2026,
            "spend_amount": 1000000,
            "notes": "Test spend"
        })
        assert spend_resp.status_code == 200, f"Failed to create spend: {spend_resp.text}"
        spend_data = spend_resp.json()["data"]
        self.created_spend_id = spend_data["id"]
        
        # Verify initial status is unpaid
        assert spend_data.get("payment_status") == "unpaid", f"Expected unpaid, got {spend_data.get('payment_status')}"
        
        # Toggle to paid
        toggle_resp = self.session.put(f"{BASE_URL}/api/admin/whitelist/spends/{self.created_spend_id}/payment-status")
        assert toggle_resp.status_code == 200, f"Toggle failed: {toggle_resp.text}"
        toggle_data = toggle_resp.json()
        assert toggle_data["success"] == True
        assert toggle_data["payment_status"] == "paid", f"Expected paid, got {toggle_data['payment_status']}"
        
        # Verify by fetching spends
        spends_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends")
        assert spends_resp.status_code == 200
        spends = spends_resp.json()
        assert len(spends) > 0
        assert spends[0]["payment_status"] == "paid"
        print("✓ Payment status toggled from unpaid to paid successfully")
    
    def test_toggle_payment_status_paid_to_unpaid(self):
        """Test toggling payment status from paid back to unpaid"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_PaymentToggle_User2",
            "email": "test_payment2@example.com",
            "cashback_percentage": 15
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spend with paid status
        spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
            "month": 2,
            "year": 2026,
            "spend_amount": 2000000,
            "payment_status": "paid"
        })
        assert spend_resp.status_code == 200
        self.created_spend_id = spend_resp.json()["data"]["id"]
        
        # Toggle to unpaid
        toggle_resp = self.session.put(f"{BASE_URL}/api/admin/whitelist/spends/{self.created_spend_id}/payment-status")
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["payment_status"] == "unpaid"
        print("✓ Payment status toggled from paid to unpaid successfully")
    
    def test_toggle_nonexistent_spend_returns_404(self):
        """Test toggling payment status for non-existent spend"""
        resp = self.session.put(f"{BASE_URL}/api/admin/whitelist/spends/nonexistent-id-12345/payment-status")
        assert resp.status_code == 404
        print("✓ Toggle on non-existent spend returns 404")


class TestPdfWithMonthRangeFilter:
    """Test PDF generation with month range filter"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_user_id = None
        self.created_spend_ids = []
        yield
        # Cleanup
        for spend_id in self.created_spend_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/spends/{spend_id}")
            except:
                pass
        if self.created_user_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}")
            except:
                pass
    
    def test_user_pdf_with_all_periods(self):
        """Test user PDF without month range (all periods)"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_PDF_User",
            "email": "test_pdf@example.com",
            "cashback_percentage": 10,
            "referral": "TEST_PDF_Referral",
            "bank_name": "BCA",
            "account_name": "Test Account",
            "account_number": "1234567890"
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spends for multiple months
        for month in [1, 2, 3]:
            spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
                "month": month,
                "year": 2026,
                "spend_amount": 1000000 * month,
                "payment_status": "paid" if month == 1 else "unpaid"
            })
            assert spend_resp.status_code == 200
            self.created_spend_ids.append(spend_resp.json()["data"]["id"])
        
        # Get PDF without filter (all periods)
        pdf_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers.get("content-type") == "application/pdf"
        assert len(pdf_resp.content) > 0
        print("✓ User PDF generated successfully (all periods)")
    
    def test_user_pdf_with_month_range_filter(self):
        """Test user PDF with specific month range"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_PDF_Range_User",
            "email": "test_pdf_range@example.com",
            "cashback_percentage": 12,
            "referral": "TEST_PDF_Referral"
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spends for multiple months
        for month in [1, 2, 3, 4, 5]:
            spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
                "month": month,
                "year": 2026,
                "spend_amount": 500000 * month
            })
            assert spend_resp.status_code == 200
            self.created_spend_ids.append(spend_resp.json()["data"]["id"])
        
        # Get PDF with month range filter (Feb to Apr 2026)
        pdf_resp = self.session.get(
            f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/pdf",
            params={"from_month": 2, "from_year": 2026, "to_month": 4, "to_year": 2026}
        )
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers.get("content-type") == "application/pdf"
        assert len(pdf_resp.content) > 0
        print("✓ User PDF generated successfully with month range filter")
    
    def test_referral_pdf_with_all_periods(self):
        """Test referral PDF without month range (all periods)"""
        # Create user with referral
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_RefPDF_User",
            "email": "test_refpdf@example.com",
            "cashback_percentage": 10,
            "referral": "TEST_RefPDF_Referral"
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spend
        spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
            "month": 1,
            "year": 2026,
            "spend_amount": 1000000
        })
        assert spend_resp.status_code == 200
        self.created_spend_ids.append(spend_resp.json()["data"]["id"])
        
        # Get referral PDF
        pdf_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/referral/TEST_RefPDF_Referral/pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers.get("content-type") == "application/pdf"
        print("✓ Referral PDF generated successfully (all periods)")
    
    def test_referral_pdf_with_month_range_filter(self):
        """Test referral PDF with specific month range"""
        # Create user with referral
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_RefPDF_Range_User",
            "email": "test_refpdf_range@example.com",
            "cashback_percentage": 15,
            "referral": "TEST_RefPDF_Range_Referral"
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spends
        for month in [1, 2, 3]:
            spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
                "month": month,
                "year": 2026,
                "spend_amount": 1000000
            })
            assert spend_resp.status_code == 200
            self.created_spend_ids.append(spend_resp.json()["data"]["id"])
        
        # Get referral PDF with filter
        pdf_resp = self.session.get(
            f"{BASE_URL}/api/admin/whitelist/referral/TEST_RefPDF_Range_Referral/pdf",
            params={"from_month": 1, "from_year": 2026, "to_month": 2, "to_year": 2026}
        )
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers.get("content-type") == "application/pdf"
        print("✓ Referral PDF generated successfully with month range filter")


class TestSummaryWithPaidUnpaid:
    """Test summary endpoint returns paid/unpaid amounts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_user_ids = []
        self.created_spend_ids = []
        yield
        # Cleanup
        for spend_id in self.created_spend_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/spends/{spend_id}")
            except:
                pass
        for user_id in self.created_user_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/{user_id}")
            except:
                pass
    
    def test_summary_includes_paid_unpaid_per_user(self):
        """Test that summary includes paid/unpaid amounts per user"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_Summary_User",
            "email": "test_summary@example.com",
            "cashback_percentage": 10,
            "referral": "TEST_Summary_Referral"
        })
        assert user_resp.status_code == 200
        user_id = user_resp.json()["data"]["id"]
        self.created_user_ids.append(user_id)
        
        # Create paid spend (100,000 cashback)
        spend1_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{user_id}/spends", json={
            "month": 1,
            "year": 2026,
            "spend_amount": 1000000,
            "payment_status": "paid"
        })
        assert spend1_resp.status_code == 200
        self.created_spend_ids.append(spend1_resp.json()["data"]["id"])
        
        # Create unpaid spend (200,000 cashback)
        spend2_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{user_id}/spends", json={
            "month": 2,
            "year": 2026,
            "spend_amount": 2000000,
            "payment_status": "unpaid"
        })
        assert spend2_resp.status_code == 200
        self.created_spend_ids.append(spend2_resp.json()["data"]["id"])
        
        # Get summary
        summary_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/summary")
        assert summary_resp.status_code == 200
        summary = summary_resp.json()
        
        # Find our test user in summary
        test_user = next((u for u in summary["users"] if u["id"] == user_id), None)
        assert test_user is not None, "Test user not found in summary"
        
        # Verify paid/unpaid amounts
        assert "paid" in test_user, "paid field missing from user summary"
        assert "unpaid" in test_user, "unpaid field missing from user summary"
        assert test_user["paid"] == 100000, f"Expected paid=100000, got {test_user['paid']}"
        assert test_user["unpaid"] == 200000, f"Expected unpaid=200000, got {test_user['unpaid']}"
        print("✓ Summary includes paid/unpaid amounts per user")
    
    def test_summary_includes_paid_unpaid_per_referral(self):
        """Test that summary includes paid/unpaid amounts per referral"""
        # Create user with referral
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_RefSummary_User",
            "email": "test_refsummary@example.com",
            "cashback_percentage": 20,
            "referral": "TEST_RefSummary_Referral"
        })
        assert user_resp.status_code == 200
        user_id = user_resp.json()["data"]["id"]
        self.created_user_ids.append(user_id)
        
        # Create paid spend (200,000 cashback at 20%)
        spend1_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{user_id}/spends", json={
            "month": 3,
            "year": 2026,
            "spend_amount": 1000000,
            "payment_status": "paid"
        })
        assert spend1_resp.status_code == 200
        self.created_spend_ids.append(spend1_resp.json()["data"]["id"])
        
        # Create unpaid spend (400,000 cashback at 20%)
        spend2_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{user_id}/spends", json={
            "month": 4,
            "year": 2026,
            "spend_amount": 2000000,
            "payment_status": "unpaid"
        })
        assert spend2_resp.status_code == 200
        self.created_spend_ids.append(spend2_resp.json()["data"]["id"])
        
        # Get summary
        summary_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/summary")
        assert summary_resp.status_code == 200
        summary = summary_resp.json()
        
        # Find our test referral in summary
        test_referral = next((r for r in summary["referrals"] if r["referral"] == "TEST_RefSummary_Referral"), None)
        assert test_referral is not None, "Test referral not found in summary"
        
        # Verify paid/unpaid amounts
        assert "paid" in test_referral, "paid field missing from referral summary"
        assert "unpaid" in test_referral, "unpaid field missing from referral summary"
        assert test_referral["paid"] == 200000, f"Expected paid=200000, got {test_referral['paid']}"
        assert test_referral["unpaid"] == 400000, f"Expected unpaid=400000, got {test_referral['unpaid']}"
        print("✓ Summary includes paid/unpaid amounts per referral")


class TestMonthlySpendPaymentStatus:
    """Test monthly spend endpoint includes payment status"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_user_id = None
        self.created_spend_id = None
        yield
        # Cleanup
        if self.created_spend_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/spends/{self.created_spend_id}")
            except:
                pass
        if self.created_user_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}")
            except:
                pass
    
    def test_monthly_endpoint_includes_payment_status(self):
        """Test that monthly spends endpoint includes payment_status field"""
        # Create user
        user_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist", json={
            "name": "TEST_Monthly_User",
            "email": "test_monthly@example.com",
            "cashback_percentage": 10
        })
        assert user_resp.status_code == 200
        self.created_user_id = user_resp.json()["data"]["id"]
        
        # Create spend with paid status
        spend_resp = self.session.post(f"{BASE_URL}/api/admin/whitelist/{self.created_user_id}/spends", json={
            "month": 1,
            "year": 2026,
            "spend_amount": 1000000,
            "payment_status": "paid"
        })
        assert spend_resp.status_code == 200
        self.created_spend_id = spend_resp.json()["data"]["id"]
        
        # Get monthly spends
        monthly_resp = self.session.get(f"{BASE_URL}/api/admin/whitelist/spends/monthly", params={"month": 1, "year": 2026})
        assert monthly_resp.status_code == 200
        monthly_data = monthly_resp.json()
        
        # Find our test user
        test_user_data = next((d for d in monthly_data["data"] if d["user_id"] == self.created_user_id), None)
        assert test_user_data is not None, "Test user not found in monthly data"
        
        # Verify payment_status field
        assert "payment_status" in test_user_data, "payment_status field missing from monthly data"
        assert test_user_data["payment_status"] == "paid", f"Expected paid, got {test_user_data['payment_status']}"
        print("✓ Monthly endpoint includes payment_status field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
