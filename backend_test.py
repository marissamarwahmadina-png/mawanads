#!/usr/bin/env python3
"""
Backend API Testing for Mawana Digital Services Contact Form
Tests POST /api/contact and GET /api/contacts endpoints
"""

import requests
import json
import os
from datetime import datetime
import sys

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from /app/frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"Testing backend at: {API_BASE}")

class ContactFormTester:
    def __init__(self):
        self.test_results = []
        self.submitted_contacts = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        })
        
    def test_valid_contact_submission(self):
        """Test POST /api/contact with valid data"""
        test_name = "Valid Contact Submission"
        
        valid_data = {
            "name": "Budi Santoso",
            "email": "budi.santoso@example.com",
            "phone": "081234567890",
            "organization": "PT Maju Bersama",
            "message": "Saya tertarik dengan layanan digital marketing untuk meningkatkan penjualan online bisnis saya"
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=valid_data, timeout=10)
            
            if response.status_code == 200:
                response_json = response.json()
                if response_json.get('success') and 'data' in response_json:
                    # Store for later verification
                    self.submitted_contacts.append(response_json['data'])
                    self.log_result(test_name, True, f"Contact submitted successfully. ID: {response_json['data'].get('id')}", response_json)
                else:
                    self.log_result(test_name, False, f"Invalid response format: {response_json}")
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_empty_name_validation(self):
        """Test POST /api/contact with empty name"""
        test_name = "Empty Name Validation"
        
        invalid_data = {
            "name": "",
            "email": "test@example.com",
            "phone": "081234567890",
            "organization": "Test Org",
            "message": "Test message"
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=invalid_data, timeout=10)
            
            if response.status_code in [400, 422]:
                self.log_result(test_name, True, f"Correctly rejected empty name with {response.status_code} error")
            else:
                self.log_result(test_name, False, f"Expected 400/422 error, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_invalid_email_validation(self):
        """Test POST /api/contact with invalid email"""
        test_name = "Invalid Email Validation"
        
        invalid_data = {
            "name": "Test User",
            "email": "invalid-email-format",
            "phone": "081234567890",
            "organization": "Test Org",
            "message": "Test message"
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=invalid_data, timeout=10)
            
            if response.status_code == 422:  # Pydantic validation error
                self.log_result(test_name, True, "Correctly rejected invalid email with 422 error")
            elif response.status_code == 400:
                self.log_result(test_name, True, "Correctly rejected invalid email with 400 error")
            else:
                self.log_result(test_name, False, f"Expected 422/400 error, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_empty_message_validation(self):
        """Test POST /api/contact with empty message"""
        test_name = "Empty Message Validation"
        
        invalid_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "081234567890",
            "organization": "Test Org",
            "message": ""
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=invalid_data, timeout=10)
            
            if response.status_code in [400, 422]:
                self.log_result(test_name, True, f"Correctly rejected empty message with {response.status_code} error")
            else:
                self.log_result(test_name, False, f"Expected 400/422 error, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_empty_phone_validation(self):
        """Test POST /api/contact with empty phone"""
        test_name = "Empty Phone Validation"
        
        invalid_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "",
            "organization": "Test Org",
            "message": "Test message"
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=invalid_data, timeout=10)
            
            if response.status_code in [400, 422]:
                self.log_result(test_name, True, f"Correctly rejected empty phone with {response.status_code} error")
            else:
                self.log_result(test_name, False, f"Expected 400/422 error, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_get_contacts(self):
        """Test GET /api/contacts"""
        test_name = "Get All Contacts"
        
        try:
            response = requests.get(f"{API_BASE}/contacts", timeout=10)
            
            if response.status_code == 200:
                contacts = response.json()
                if isinstance(contacts, list):
                    # Check if our submitted contact is in the list
                    found_our_contact = False
                    if self.submitted_contacts:
                        submitted_id = self.submitted_contacts[0].get('id')
                        for contact in contacts:
                            if contact.get('id') == submitted_id:
                                found_our_contact = True
                                break
                    
                    # Check sorting (should be descending by submittedAt)
                    is_sorted = True
                    if len(contacts) > 1:
                        for i in range(len(contacts) - 1):
                            current_time = contacts[i].get('submittedAt', '')
                            next_time = contacts[i + 1].get('submittedAt', '')
                            if current_time < next_time:
                                is_sorted = False
                                break
                    
                    message = f"Retrieved {len(contacts)} contacts"
                    if found_our_contact:
                        message += ", found our submitted contact"
                    if is_sorted:
                        message += ", correctly sorted by submittedAt desc"
                    else:
                        message += ", WARNING: not sorted correctly"
                    
                    self.log_result(test_name, True, message, {'count': len(contacts), 'sorted': is_sorted})
                else:
                    self.log_result(test_name, False, f"Expected list, got: {type(contacts)}")
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def test_additional_valid_submission(self):
        """Submit another valid contact to test multiple entries"""
        test_name = "Additional Valid Submission"
        
        valid_data = {
            "name": "Sari Dewi",
            "email": "sari.dewi@gmail.com",
            "phone": "087654321098",
            "organization": "Toko Online Sari",
            "message": "Butuh bantuan untuk optimasi SEO website toko online saya"
        }
        
        try:
            response = requests.post(f"{API_BASE}/contact", json=valid_data, timeout=10)
            
            if response.status_code == 200:
                response_json = response.json()
                if response_json.get('success'):
                    self.submitted_contacts.append(response_json['data'])
                    self.log_result(test_name, True, f"Second contact submitted successfully. ID: {response_json['data'].get('id')}")
                else:
                    self.log_result(test_name, False, f"Invalid response format: {response_json}")
            else:
                self.log_result(test_name, False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTING - MAWANA DIGITAL SERVICES")
        print("=" * 60)
        
        # Test valid submissions first
        self.test_valid_contact_submission()
        self.test_additional_valid_submission()
        
        # Test validation errors
        self.test_empty_name_validation()
        self.test_invalid_email_validation()
        self.test_empty_message_validation()
        self.test_empty_phone_validation()
        
        # Test retrieval
        self.test_get_contacts()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        
        if total - passed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = ContactFormTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some backend tests failed!")
        sys.exit(1)