# MediLink Cloud API Documentation

## Base URL
```
http://localhost:5000/api
```

Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "patient",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-15",
  "gender": "Male"
}
```

**Doctor-specific fields:**
```json
{
  "specialization": "General Practitioner",
  "licenseNumber": "MD12345",
  "department": "General Medicine"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "patient",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

Authenticate and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "patient",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:** Authorization required

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "patient",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "1234567890",
      "date_of_birth": "1990-01-15",
      "gender": "Male",
      "address": null,
      "city": null,
      "state": null,
      "zip_code": null,
      "profile_image": null,
      "is_verified": true,
      "created_at": "2026-01-27T10:00:00.000Z"
    }
  }
}
```

---

## Patient Endpoints

### Get All Patients

Get list of all patients (doctors and admins only).

**Endpoint:** `GET /api/patients`

**Headers:** Authorization required

**Query Parameters:**
- `search` (optional): Search by name or email
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "patients": [
      {
        "id": 1,
        "email": "patient@example.com",
        "first_name": "Jane",
        "last_name": "Doe",
        "phone": "5555555555",
        "date_of_birth": "1990-05-15",
        "gender": "Female",
        "is_active": true
      }
    ]
  }
}
```

### Get Patient by ID

**Endpoint:** `GET /api/patients/:id`

**Headers:** Authorization required

**Response:**
```json
{
  "status": "success",
  "data": {
    "patient": {
      "id": 1,
      "email": "patient@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone": "5555555555",
      "date_of_birth": "1990-05-15",
      "gender": "Female",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "emergency_contact_name": "John Doe",
      "emergency_contact_phone": "5555555556",
      "created_at": "2026-01-27T10:00:00.000Z"
    }
  }
}
```

### Update Patient Profile

**Endpoint:** `PATCH /api/patients/:id`

**Headers:** Authorization required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "5555555555",
  "address": "456 Oak Ave",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101",
  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "5555555557"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Patient profile updated successfully",
  "data": {
    "patient": { /* updated patient data */ }
  }
}
```

### Get Patient Appointments

**Endpoint:** `GET /api/patients/:id/appointments`

**Headers:** Authorization required

**Response:**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "appointments": [
      {
        "id": 1,
        "appointment_date": "2026-02-01",
        "appointment_time": "10:00:00",
        "status": "scheduled",
        "reason_for_visit": "Annual checkup",
        "doctor_first_name": "John",
        "doctor_last_name": "Smith",
        "specialization": "General Practitioner"
      }
    ]
  }
}
```

---

## Doctor Endpoints

### Get All Doctors

**Endpoint:** `GET /api/doctors`

**Headers:** Authorization required

**Query Parameters:**
- `specialization` (optional): Filter by specialization
- `department` (optional): Filter by department
- `search` (optional): Search by name or specialization

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "doctors": [
      {
        "id": 2,
        "email": "doctor@example.com",
        "first_name": "John",
        "last_name": "Smith",
        "phone": "9876543210",
        "specialization": "General Practitioner",
        "license_number": "MD12345",
        "department": "General Medicine",
        "is_active": true
      }
    ]
  }
}
```

### Get Doctor Schedule

**Endpoint:** `GET /api/doctors/:id/schedule`

**Headers:** Authorization required

**Query Parameters:**
- `date` (optional): Specific date (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "schedule": [
      {
        "id": 1,
        "appointment_date": "2026-02-01",
        "appointment_time": "10:00:00",
        "status": "scheduled",
        "patient_first_name": "Jane",
        "patient_last_name": "Doe",
        "patient_phone": "5555555555"
      }
    ]
  }
}
```

### Get/Set Doctor Availability

**Get Availability**
**Endpoint:** `GET /api/doctors/:id/availability`

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "availability": [
      {
        "id": 1,
        "day_of_week": 1,
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "is_available": true
      }
    ]
  }
}
```

**Set Availability**
**Endpoint:** `POST /api/doctors/:id/availability`

**Request Body:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true
}
```

---

## Appointment Endpoints

### Get Appointments

**Endpoint:** `GET /api/appointments`

**Headers:** Authorization required

**Query Parameters:**
- `status` (optional): Filter by status
- `date` (optional): Filter by date
- `doctorId` (optional): Filter by doctor (admin only)

**Response:**
```json
{
  "status": "success",
  "results": 10,
  "data": {
    "appointments": [
      {
        "id": 1,
        "patient_first_name": "Jane",
        "patient_last_name": "Doe",
        "doctor_first_name": "John",
        "doctor_last_name": "Smith",
        "appointment_date": "2026-02-01",
        "appointment_time": "10:00:00",
        "status": "scheduled",
        "reason_for_visit": "Annual checkup",
        "specialization": "General Practitioner"
      }
    ]
  }
}
```

### Create Appointment

**Endpoint:** `POST /api/appointments`

**Headers:** Authorization required

**Request Body:**
```json
{
  "doctorId": 2,
  "appointmentDate": "2026-02-01",
  "appointmentTime": "10:00",
  "reasonForVisit": "Annual checkup"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Appointment created successfully",
  "data": {
    "appointment": {
      "id": 1,
      "patient_id": 1,
      "doctor_id": 2,
      "appointment_date": "2026-02-01",
      "appointment_time": "10:00:00",
      "status": "scheduled"
    }
  }
}
```

### Update Appointment

**Endpoint:** `PATCH /api/appointments/:id`

**Headers:** Authorization required

**Request Body:**
```json
{
  "appointmentDate": "2026-02-02",
  "appointmentTime": "14:00",
  "status": "confirmed",
  "notes": "Patient confirmed"
}
```

### Cancel Appointment

**Endpoint:** `DELETE /api/appointments/:id`

**Headers:** Authorization required

**Request Body:**
```json
{
  "cancellationReason": "Patient request"
}
```

### Get Available Slots

**Endpoint:** `GET /api/appointments/available-slots/:doctorId`

**Query Parameters:**
- `date` (required): Date to check availability (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "data": {
    "availableSlots": [
      "09:00:00",
      "09:30:00",
      "10:00:00",
      "10:30:00",
      "14:00:00",
      "14:30:00"
    ]
  }
}
```

---

## Health Records Endpoints

### Create Health Record

**Endpoint:** `POST /api/health-records`

**Headers:** Authorization required (doctor/admin only)

**Request Body:**
```json
{
  "patientId": 1,
  "appointmentId": 5,
  "recordType": "Consultation",
  "recordDate": "2026-01-27",
  "title": "Annual Physical Examination",
  "description": "Routine checkup",
  "diagnosis": "Patient is healthy",
  "treatment": "No treatment required",
  "medications": "None",
  "allergies": "Penicillin",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 150
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Health record created successfully",
  "data": {
    "healthRecord": { /* created record */ }
  }
}
```

---

## Admin Endpoints

### Get System Statistics

**Endpoint:** `GET /api/admin/statistics`

**Headers:** Authorization required (admin only)

**Response:**
```json
{
  "status": "success",
  "data": {
    "statistics": {
      "total_patients": 150,
      "total_doctors": 20,
      "scheduled_appointments": 45,
      "completed_appointments": 320,
      "today_appointments": 8,
      "total_health_records": 450,
      "new_users_last_month": 25,
      "appointments_last_week": 52
    }
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Authentication Error
```json
{
  "status": "error",
  "message": "No token provided"
}
```

### Authorization Error
```json
{
  "status": "error",
  "message": "You do not have permission to access this resource"
}
```

### Not Found Error
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable
