# System Architecture - MediLink Cloud

## Architecture Overview

MediLink Cloud follows a **3-tier architecture** pattern:

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (Frontend - HTML/CSS/JS)                   │
│  ┌───────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │  Landing  │  │  Login/  │  │     Dashboards      │  │
│  │   Page    │  │ Register │  │ Patient/Doctor/Admin│  │
│  └───────────┘  └──────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                    REST API (HTTPS)
                          │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│              (Backend - Node.js/Express)                │
│  ┌───────────────────────────────────────────────────┐  │
│  │            API Routes & Controllers                │  │
│  ├───────────┬─────────┬──────────┬──────────────────┤  │
│  │   Auth    │ Patient │  Doctor  │   Appointments   │  │
│  │  Routes   │ Routes  │  Routes  │     Routes       │  │
│  └───────────┴─────────┴──────────┴──────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │               Middleware Layer                     │  │
│  │  • Authentication (JWT)                            │  │
│  │  • Authorization (RBAC)                            │  │
│  │  • Validation                                      │  │
│  │  • Error Handling                                  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Business Services                     │  │
│  │  • Email Service (Nodemailer)                      │  │
│  │  • Storage Service (AWS S3)                        │  │
│  │  • Notification Service                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                   PostgreSQL Driver
                          │
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│               (PostgreSQL Database)                      │
│  ┌───────────┬─────────────┬──────────┬──────────────┐  │
│  │   users   │ appointments│  health  │   doctor     │  │
│  │   table   │    table    │ records  │ availability │  │
│  └───────────┴─────────────┴──────────┴──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Presentation Layer (Frontend)

**Technologies:**
- HTML5 for structure
- CSS3 for styling
- Vanilla JavaScript for interactivity

**Key Features:**
- Responsive design
- Role-based UI components
- Client-side validation
- JWT token management
- RESTful API consumption

**Pages:**
- Landing page (index.html)
- Authentication (login.html, register.html)
- Patient dashboard
- Doctor dashboard
- Admin dashboard

### 2. Application Layer (Backend)

**Technologies:**
- Node.js runtime
- Express.js framework
- JWT for authentication
- bcrypt for password hashing

**Key Components:**

#### API Routes
- `/api/auth` - Authentication & registration
- `/api/patients` - Patient management
- `/api/doctors` - Doctor management
- `/api/appointments` - Appointment operations
- `/api/health-records` - EHR operations
- `/api/admin` - Administrative functions

#### Middleware
- **auth.js** - JWT verification, user extraction
- **validation.js** - Input validation using express-validator
- **Rate limiting** - Request throttling
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers

#### Services
- **emailService.js** - Appointment notifications
- **storageService.js** - Cloud file storage (AWS S3)

### 3. Data Layer

**Database:** PostgreSQL

**Schema:**

```sql
users
├── id (PK)
├── email (UNIQUE)
├── password (HASHED)
├── role (ENUM: patient, doctor, admin)
├── first_name
├── last_name
├── phone
├── date_of_birth
├── specialization (for doctors)
├── license_number (for doctors)
└── timestamps

appointments
├── id (PK)
├── patient_id (FK -> users)
├── doctor_id (FK -> users)
├── appointment_date
├── appointment_time
├── status (ENUM)
├── reason_for_visit
├── diagnosis
├── prescription
└── timestamps

health_records
├── id (PK)
├── patient_id (FK -> users)
├── doctor_id (FK -> users)
├── appointment_id (FK -> appointments)
├── record_type
├── title
├── description
├── vital_signs (JSONB)
├── lab_results (JSONB)
└── timestamps

doctor_availability
├── id (PK)
├── doctor_id (FK -> users)
├── day_of_week (0-6)
├── start_time
├── end_time
└── is_available
```

## Data Flow

### Example: Creating an Appointment

```
1. Patient → Frontend
   - User fills appointment form
   - Client-side validation

2. Frontend → Backend API
   POST /api/appointments
   Headers: { Authorization: Bearer <token> }
   Body: { doctorId, date, time, reason }

3. Backend Processing
   a. Middleware:
      - Verify JWT token
      - Extract user info
      - Validate request body
   
   b. Route Handler:
      - Check doctor availability
      - Check for conflicts
      - Create appointment record
      
   c. Services:
      - Send confirmation email to patient
      - Send notification to doctor
   
4. Database
   - INSERT INTO appointments
   - COMMIT transaction

5. Response → Frontend
   {
     "status": "success",
     "data": { appointment }
   }

6. Frontend
   - Display success message
   - Redirect to appointments page
   - Update UI
```

## Security Architecture

### Authentication Flow

```
1. User Login
   └→ POST /api/auth/login { email, password }
      └→ Verify credentials (bcrypt)
         └→ Generate JWT token
            └→ Return token to client

2. Authenticated Request
   └→ Include token in header
      └→ Auth middleware verifies token
         └→ Extract user from token
            └→ Check user permissions
               └→ Execute request
```

### Authorization (RBAC)

```
Role Permissions:

Patient:
  ✓ View own profile
  ✓ Update own profile
  ✓ Book appointments
  ✓ View own appointments
  ✓ View own health records
  ✗ Cannot access other patients' data

Doctor:
  ✓ View own profile
  ✓ View assigned patients
  ✓ Update health records
  ✓ View own schedule
  ✓ Set availability
  ✗ Cannot modify other doctors' data

Admin:
  ✓ Full system access
  ✓ Manage all users
  ✓ View all appointments
  ✓ System statistics
  ✓ Configuration
```

## Cloud Infrastructure

### AWS Architecture

```
┌─────────────────────────────────────────┐
│         Route 53 (DNS)                  │
│    medilink.com → CloudFront            │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│     CloudFront CDN (Optional)           │
│     Static Assets Distribution          │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  Application Load Balancer (ALB)        │
│      HTTPS Termination (SSL)            │
└─────────────────────────────────────────┘
         │                │
    ┌────────┐      ┌────────┐
    │  EC2   │      │  EC2   │
    │ Server │      │ Server │
    │   #1   │      │   #2   │
    └────────┘      └────────┘
         │                │
         └────────┬───────┘
                  │
    ┌─────────────────────────┐
    │   Amazon RDS            │
    │   PostgreSQL            │
    │   Multi-AZ Deployment   │
    └─────────────────────────┘
                  │
    ┌─────────────────────────┐
    │   Amazon S3             │
    │   File Storage          │
    │   (Health Records)      │
    └─────────────────────────┘
```

### Scalability

**Horizontal Scaling:**
- Multiple EC2 instances behind load balancer
- Stateless application design
- Session management in database or Redis

**Vertical Scaling:**
- Upgrade EC2 instance types
- Increase RDS instance size

**Database Scaling:**
- Read replicas for read-heavy operations
- Connection pooling
- Query optimization with indexes

## Performance Optimization

### Backend
- Connection pooling (max 20 connections)
- Database query optimization
- Indexed columns for fast lookups
- API rate limiting
- Caching strategies (future)

### Frontend
- Minified CSS/JS (production)
- Lazy loading
- Async API calls
- Local storage for tokens

### Database
- Indexes on foreign keys
- Indexes on frequently queried columns
- JSONB for flexible data storage
- Automatic updated_at triggers

## Monitoring & Logging

### Application Monitoring
- PM2 process monitoring
- CloudWatch metrics
- Error logging
- Performance tracking

### Database Monitoring
- RDS CloudWatch metrics
- Query performance insights
- Connection monitoring

### Security Monitoring
- Failed login attempts
- Rate limit violations
- Suspicious activity patterns

## Backup & Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- 7-day retention
- S3 backup storage

### Application Backups
- Code in Git repository
- Environment configs
- SSL certificates

## High Availability

- Multi-AZ RDS deployment
- Multiple EC2 instances
- Load balancer health checks
- Automatic failover
- 99%+ uptime target

## Future Enhancements

- Microservices architecture
- Redis caching layer
- WebSocket for real-time notifications
- Container orchestration (Docker/Kubernetes)
- API gateway (AWS API Gateway)
- Serverless functions (AWS Lambda)
