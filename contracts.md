# API Contracts - Mawana Digital Services Website

## Overview
Website landing page untuk Mawana Digital Services dengan fitur contact form yang menyimpan submission ke MongoDB.

## Frontend Components Status
✅ All 11 sections implemented:
1. Header (with navigation)
2. Hero Section
3. Problem Section
4. Solution Section
5. Services Overview
6. About Section
7. Why We Exist
8. Detail Services (with tabs)
9. Whitelist Education
10. Pricing Section
11. Trust CTA
12. Contact Section (with form)
13. Footer

## Mock Data Location
- File: `/app/frontend/src/mock.js`
- Function: `mockContactSubmit(data)` - currently saves to localStorage
- Function: `getMockContacts()` - retrieves from localStorage

## Backend Integration Needed

### 1. Contact Form API

**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "phone": "string (required)",
  "organization": "string (optional)",
  "message": "string (required)"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "organization": "string",
    "message": "string",
    "submittedAt": "ISO datetime string"
  }
}
```

**Response Error (400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 2. Get Contacts API (Optional - for admin)

**Endpoint:** `GET /api/contacts`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "organization": "string",
      "message": "string",
      "submittedAt": "ISO datetime"
    }
  ]
}
```

## MongoDB Schema

### Collection: `contacts`

```python
{
  "id": str (UUID),
  "name": str,
  "email": str,
  "phone": str,
  "organization": str (optional),
  "message": str,
  "submittedAt": datetime
}
```

## Frontend Changes Required

### File: `/app/frontend/src/components/ContactSection.jsx`

**Current:** Uses `mockContactSubmit` from `../mock`

**Change to:**
```javascript
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await axios.post(`${BACKEND_URL}/api/contact`, formData);
    
    if (response.data.success) {
      toast({
        title: "Pesan Terkirim!",
        description: "Terima kasih, kami akan segera menghubungi Anda.",
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        message: ''
      });
    }
  } catch (error) {
    toast({
      title: "Gagal mengirim",
      description: "Silakan coba lagi atau hubungi via WhatsApp.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

**Remove import:** `import { mockContactSubmit } from '../mock';`

## Backend Files to Create/Modify

1. **Model:** `/app/backend/models.py` (if not exists) or add to server.py
2. **Route:** Add contact endpoints to `/app/backend/server.py`
3. **Validation:** Use Pydantic models for request validation

## Testing Checklist

- [ ] Backend: POST /api/contact saves to MongoDB
- [ ] Backend: GET /api/contacts retrieves all submissions
- [ ] Frontend: Form submission works with real API
- [ ] Frontend: Success toast appears on successful submission
- [ ] Frontend: Error toast appears on failed submission
- [ ] Frontend: Form clears after successful submission
- [ ] Frontend: Loading state shows during submission
- [ ] Integration: Data persists across page refreshes
- [ ] Validation: Email format is validated
- [ ] Validation: Required fields are enforced

## Notes
- Mock data will be removed after backend integration
- WhatsApp link remains as alternative contact method
- No authentication needed for contact form submission
- Consider adding email notification for new submissions (future enhancement)
