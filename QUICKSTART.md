# Quick Start Guide - MediLink Cloud

## 🚀 Quick Setup (5 Minutes)

### Step 1: Prerequisites Check

Make sure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL 12+ installed (`psql --version`)
- ✅ Git installed (`git --version`)

### Step 2: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/medilink-cloud.git
cd medilink-cloud

# Install backend dependencies
cd backend
npm install
```

### Step 3: Setup Database

```bash
# Create database
createdb medilink_cloud

# Or using psql
psql -U postgres -c "CREATE DATABASE medilink_cloud;"
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# At minimum, update:
# - DB_PASSWORD (your PostgreSQL password)
# - JWT_SECRET (generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Step 5: Run Database Migration

```bash
npm run migrate
```

You should see:
```
✅ Database migration completed successfully!
📊 Tables created:
   - users
   - doctor_availability
   - appointments
   - health_records
```

### Step 6: Start the Backend

```bash
# Development mode (auto-restart on changes)
npm run dev

# Or production mode
npm start
```

You should see:
```
🚀 MediLink Cloud Server running on port 5000
📊 Environment: development
🌐 Frontend URL: http://localhost:3000
✅ Database connected successfully
```

### Step 7: Open the Frontend

Open `frontend/index.html` in your browser, or use a local server:

```bash
# Option 1: Using Python
cd ../frontend
python -m http.server 3000

# Option 2: Using npx
npx http-server ../frontend -p 3000
```

Visit: `http://localhost:3000`

---

## 🧪 Test the Application

### 1. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "database": "connected"
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "role": "patient",
    "firstName": "Test",
    "lastName": "User",
    "phone": "1234567890"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

Save the token from the response for authenticated requests.

### 4. Test Protected Endpoint

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📱 Using the Web Interface

### Register a New Account

1. Go to `http://localhost:3000`
2. Click "Register"
3. Fill in the form:
   - Choose role (Patient/Doctor)
   - Enter your details
   - Create a strong password
4. Click "Create Account"

### Login

1. Go to `http://localhost:3000/login.html`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to your dashboard

### Default Test Accounts

After running migrations, you can use these test accounts:

**Admin:**
- Email: `admin@medilink.com`
- Password: Set in database (check schema.sql)

**Doctor:**
- Email: `doctor@medilink.com`
- Password: Set in database

**Patient:**
- Email: `patient@medilink.com`
- Password: Set in database

---

## 🔧 Common Issues & Solutions

### Issue: "Database connection failed"

**Solution:**
- Check PostgreSQL is running: `pg_ctl status`
- Verify database exists: `psql -U postgres -l | grep medilink`
- Check .env DB credentials

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

### Issue: "Migration fails"

**Solution:**
```bash
# Drop and recreate database
dropdb medilink_cloud
createdb medilink_cloud

# Run migration again
npm run migrate
```

### Issue: "JWT token errors"

**Solution:**
- Ensure JWT_SECRET is set in .env
- Generate a secure secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## 📚 Next Steps

1. **Explore the API:** Check [docs/API.md](docs/API.md) for all endpoints
2. **Customize:** Modify frontend styles in `frontend/css/style.css`
3. **Add Features:** Extend backend routes in `backend/routes/`
4. **Deploy:** Follow [deployment/aws-deployment.md](deployment/aws-deployment.md) for cloud deployment

---

## 💡 Development Tips

### Hot Reload Backend

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### View Database

```bash
psql -U postgres -d medilink_cloud

# Useful commands:
\dt              # List all tables
\d users         # Describe users table
SELECT * FROM users;
```

### Test Email Service

Update EMAIL_* variables in .env with your SMTP settings.

For Gmail:
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in EMAIL_PASSWORD

---

## 🎯 Project Structure Overview

```
medilink-cloud/
├── backend/           # Node.js API server
│   ├── config/        # Database config
│   ├── middleware/    # Auth, validation
│   ├── routes/        # API endpoints
│   ├── services/      # Email, storage
│   └── server.js      # Entry point
├── frontend/          # Web UI
│   ├── css/           # Styles
│   ├── js/            # JavaScript
│   └── *.html         # Pages
├── database/          # SQL schemas
├── deployment/        # Deployment guides
└── docs/              # Documentation
```

---

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Database created
- [ ] .env file configured
- [ ] Migration completed
- [ ] Backend server running
- [ ] Frontend accessible
- [ ] Test account created
- [ ] Login working

---

**Need help?** Check the full [README.md](README.md) or open an issue!

**Ready to deploy?** See [deployment/aws-deployment.md](deployment/aws-deployment.md)
