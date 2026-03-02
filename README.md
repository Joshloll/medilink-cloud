# 🏥 MediLink Cloud

**Cloud-Based Appointment and Health Record Management System**

A comprehensive healthcare management platform designed for clinics and small healthcare providers to manage patient appointments, electronic health records (EHR), and doctor availability in a centralized cloud system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

MediLink Cloud is a modern, cloud-based healthcare application that streamlines clinic operations by providing:

- Online appointment booking and management
- Secure electronic health records (EHR) storage
- Doctor schedule management
- Automated email notifications
- Role-based access control for patients, doctors, and administrators
- Real-time availability checking
- Comprehensive admin dashboard

**Target Users:**
- 👤 **Patients** - Book appointments, view history, access health records
- 👨‍⚕️ **Doctors** - Manage schedules, update patient records, view appointments
- ⚙️ **Admins** - Oversee system operations, manage users, view analytics

---

## ✨ Features

### For Patients
- ✅ Create and manage user accounts
- ✅ Book, reschedule, and cancel appointments online
- ✅ View available time slots in real-time
- ✅ Access appointment history and health records
- ✅ Receive email notifications for appointments
- ✅ Manage personal profile information

### For Doctors
- ✅ View daily and weekly schedules
- ✅ Access patient information and medical history
- ✅ Update availability and working hours
- ✅ Add and update health records
- ✅ Track appointment statistics
- ✅ Receive notifications for new appointments

### For Administrators
- ✅ Manage all users (patients, doctors, admins)
- ✅ Monitor system-wide appointments
- ✅ View analytics and statistics
- ✅ Configure system settings
- ✅ Access activity logs
- ✅ Manage user permissions

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Email**: Nodemailer
- **File Upload**: Multer
- **Cloud Storage**: AWS S3 / Azure Blob Storage

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)** - Vanilla JavaScript
- **Fetch API** - HTTP requests

### DevOps & Cloud
- **Cloud Platform**: AWS / Azure
- **Database**: AWS RDS (PostgreSQL) / Azure Database
- **Storage**: AWS S3 / Azure Blob Storage
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)

---

## 📁 Project Structure

```
medilink-cloud/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   ├── auth.js               # Authentication middleware
│   │   └── validation.js         # Validation middleware
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── patientRoutes.js      # Patient management routes
│   │   ├── doctorRoutes.js       # Doctor management routes
│   │   ├── appointmentRoutes.js  # Appointment routes
│   │   ├── healthRecordRoutes.js # Health records routes
│   │   └── adminRoutes.js        # Admin routes
│   ├── services/
│   │   ├── emailService.js       # Email notification service
│   │   └── storageService.js     # Cloud storage service
│   ├── server.js                 # Express app entry point
│   ├── package.json              # Backend dependencies
│   └── .env.example              # Environment variables template
├── frontend/
│   ├── css/
│   │   └── style.css             # Global styles
│   ├── js/
│   │   ├── config.js             # Frontend configuration
│   │   ├── auth.js               # Authentication helpers
│   │   ├── main.js               # Main JavaScript
│   │   ├── login.js              # Login page script
│   │   └── register.js           # Registration page script
│   ├── dashboard/                # Dashboard pages (to be created)
│   ├── index.html                # Landing page
│   ├── login.html                # Login page
│   └── register.html             # Registration page
├── database/
│   ├── schema.sql                # Database schema
│   └── migrate.js                # Migration script
├── deployment/
│   └── aws-deployment.md         # AWS deployment guide
├── docs/
│   └── API.md                    # API documentation
├── .github/
│   └── copilot-instructions.md   # Project instructions
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+
- **Git**

### Clone Repository

```bash
git clone https://github.com/yourusername/medilink-cloud.git
cd medilink-cloud
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

No installation needed - uses vanilla JavaScript with CDN resources.

---

## ⚙️ Configuration

### 1. Create Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medilink_cloud
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=MediLink Cloud <noreply@medilink.com>

# Cloud Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=medilink-cloud-storage

# Application Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 💾 Database Setup

### 1. Create PostgreSQL Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE medilink_cloud;

# Exit
\q
```

### 2. Run Migrations

```bash
cd backend
npm run migrate
```

This will create all necessary tables and insert sample data.

### 3. Verify Database

```bash
psql -U postgres -d medilink_cloud

# List tables
\dt

# Check users table
SELECT * FROM users;
```

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:5000`

#### Start Frontend

Open `frontend/index.html` in a web browser or use a local server:

```bash
# Using Python
cd frontend
python -m http.server 3000

# Using Node.js http-server
npx http-server frontend -p 3000
```

Frontend runs on `http://localhost:3000`

### Production Mode

```bash
cd backend
npm start
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

#### Patients
- `GET /api/patients` - Get all patients (doctors/admins only)
- `GET /api/patients/:id` - Get patient details
- `PATCH /api/patients/:id` - Update patient profile
- `GET /api/patients/:id/appointments` - Get patient appointments
- `GET /api/patients/:id/health-records` - Get patient health records

#### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `PATCH /api/doctors/:id` - Update doctor profile
- `GET /api/doctors/:id/schedule` - Get doctor schedule
- `GET /api/doctors/:id/availability` - Get doctor availability
- `POST /api/doctors/:id/availability` - Set doctor availability
- `GET /api/doctors/:id/statistics` - Get doctor statistics

#### Appointments
- `GET /api/appointments` - Get appointments (filtered by role)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/available-slots/:doctorId` - Get available time slots

#### Health Records
- `GET /api/health-records` - Get health records
- `GET /api/health-records/:id` - Get specific health record
- `POST /api/health-records` - Create health record
- `PATCH /api/health-records/:id` - Update health record
- `DELETE /api/health-records/:id` - Delete health record (admin only)

#### Admin
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/activity` - Get recent activity

For detailed API documentation with request/response examples, see [API.md](docs/API.md)

---

## 👥 User Roles

### Patient
- Book and manage appointments
- View appointment history
- Access personal health records
- Update profile information

### Doctor
- View and manage schedule
- Access patient information
- Update health records
- Set availability

### Admin
- Full system access
- User management
- System monitoring
- Analytics and reporting

---

## 🌐 Deployment

### AWS Deployment

See detailed AWS deployment guide: [aws-deployment.md](deployment/aws-deployment.md)

**Quick steps:**
1. Create RDS PostgreSQL instance
2. Create S3 bucket for file storage
3. Launch EC2 instance
4. Configure Nginx reverse proxy
5. Install SSL certificate
6. Deploy application with PM2

### Azure Deployment

Similar process using:
- Azure Database for PostgreSQL
- Azure Blob Storage
- Azure App Service or VM
- Azure Application Gateway

---

## 🔒 Security

### Implemented Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ Helmet.js security headers
- ✅ Environment variable protection
- ✅ HTTPS enforcement (production)
- ✅ Secure file upload validation

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 📈 Performance

- Page load time: < 3 seconds
- API response time: < 500ms
- Database query optimization with indexes
- Connection pooling for database
- Caching strategies ready

---

## 🧪 Testing

### Run Tests

```bash
cd backend
npm test
```

### Health Check

```bash
curl http://localhost:5000/health
```

---

## 📝 Default Credentials

**Admin Account:**
- Email: `admin@medilink.com`
- Password: Set during database setup

**Test Doctor:**
- Email: `doctor@medilink.com`
- Password: Set during database setup

**Test Patient:**
- Email: `patient@medilink.com`
- Password: Set during database setup

**Note:** Change default passwords immediately in production!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Development Team

Developed as part of a cloud computing course project.

---

## 📞 Support

For support and questions:
- Email: support@medilink.com
- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/medilink-cloud/issues)

---

## 🗺️ Roadmap

- [ ] Mobile responsive design improvements
- [ ] Real-time notifications with WebSockets
- [ ] Video consultation feature
- [ ] Prescription management
- [ ] Insurance integration
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard enhancements
- [ ] Automated appointment reminders
- [ ] Payment gateway integration

---

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- PostgreSQL community
- AWS for cloud infrastructure
- All open-source contributors

---

**Built with ❤️ for better healthcare management**
