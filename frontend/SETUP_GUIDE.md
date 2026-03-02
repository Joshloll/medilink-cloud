# MediLink Cloud - Supabase Integration Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project name: `medilink-cloud`
6. Set database password (save it securely)
7. Choose a region closest to your users
8. Click "Create new project"

### 2. Get Your Supabase Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the **Project URL** and **anon public key**
3. Update these values in your files:

#### In `js/supabase-config.js`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

#### In `login.html` and `register.html`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

### 3. Set Up Database Schema
1. In your Supabase project, go to **SQL Editor**
2. Copy the entire content from `database/supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create all necessary tables:
- `user_profiles` - Basic user information
- `doctors` - Doctor-specific information
- `patients` - Patient-specific information
- `appointments` - Appointment scheduling
- `medical_records` - Medical records and documents
- `prescriptions` - Prescription management
- `lab_results` - Laboratory test results
- `notifications` - User notifications
- `audit_log` - Activity tracking

### 4. Configure Authentication
1. In Supabase, go to **Authentication** → **Settings**
2. Enable **Email** authentication (should be enabled by default)
3. Set site URL to your domain (e.g., `http://localhost:3000` for development)
4. Add redirect URLs:
   - `http://localhost:3000/login.html`
   - `http://localhost:3000/register.html`
   - `http://localhost:3000/dashboard.html`
   - `http://localhost:3000/Doctor_Schedule/doctor_dashboard.html`

### 5. Enable OAuth Providers (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider if you want Google sign-in
3. Add your Google OAuth credentials
4. Enable **Microsoft** provider if you want Microsoft sign-in

### 6. Set Up Row Level Security (RLS)
The schema already includes RLS policies, but verify they're active:
1. Go to **Authentication** → **Policies**
2. Ensure all tables have policies enabled
3. Test with different user roles to ensure proper access control

## 🗄️ Database Structure Overview

### Core Tables

#### `user_profiles`
- Stores basic user information
- Links to Supabase auth users
- Contains role (patient/doctor/admin)

#### `doctors`
- Extended profile for doctors
- License information, specialization
- Availability and pricing

#### `patients`
- Extended profile for patients
- Medical history, allergies, medications
- Emergency contacts

#### `appointments`
- Appointment scheduling
- Links patients and doctors
- Status tracking

#### `medical_records`
- Patient medical records
- Created by doctors
- Attachments and documents

#### `prescriptions`
- Prescription management
- Refill tracking
- Medication details

#### `lab_results`
- Laboratory test results
- Status tracking
- Doctor and patient access

## 🔧 Development Setup

### Local Development
1. Start a local server (e.g., `python -m http.server 3000`)
2. Open `http://localhost:3000/login.html`
3. Test registration and login functionality

### Testing Accounts
Create test accounts to verify functionality:

#### Test Patient Account
- Email: `patient@test.com`
- Password: `Test123456`
- Role: Patient

#### Test Doctor Account
- Email: `doctor@test.com`
- Password: `Test123456`
- Role: Doctor
- License: `MD-TEST001`
- Specialization: General Practice

## 🚨 Important Security Notes

1. **Never expose your service role key** in frontend code
2. **Use Row Level Security** for all sensitive data
3. **Validate all inputs** before database operations
4. **Implement proper error handling** for production
5. **Use HTTPS** in production environments
6. **Regularly update Supabase** and dependencies

## 🔄 Data Flow

### Registration Flow
1. User fills registration form
2. Supabase Auth creates user account
3. User profile created in `user_profiles`
4. Role-specific profile created (`doctors` or `patients`)
5. Email verification sent
6. User can login after verification

### Login Flow
1. User enters credentials
2. Supabase Auth validates credentials
3. User role verified from `user_profiles`
4. Redirected to appropriate dashboard
5. Session maintained via Supabase auth

### Appointment Booking
1. Patient selects doctor and time
2. Appointment created in `appointments` table
3. Doctor notified
4. Status tracking throughout process

## 🛠️ Customization

### Adding New Fields
1. Update database schema in Supabase SQL Editor
2. Update corresponding JavaScript functions
3. Modify UI forms to include new fields

### Custom Authentication
1. Extend `auth` functions in `supabase-config.js`
2. Add custom validation logic
3. Update error handling

### Additional Features
- File upload for medical documents
- Real-time notifications
- Video consultation integration
- Payment processing
- Advanced reporting

## 📱 Deployment

### Production Checklist
- [ ] Update Supabase URLs to production
- [ ] Enable HTTPS
- [ ] Set up custom domain
- [ ] Configure email templates
- [ ] Set up monitoring
- [ ] Test all user flows
- [ ] Backup strategy

### Environment Variables
For production, consider using environment variables:
```javascript
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
```

## 🐛 Troubleshooting

### Common Issues

#### "User profile not found"
- Check if user completed registration
- Verify RLS policies are correct
- Check user_id in profiles table

#### "Invalid login credentials"
- Verify email is confirmed
- Check password requirements
- Reset password if needed

#### "Permission denied"
- Check RLS policies
- Verify user role
- Check table permissions

#### CORS Issues
- Add your domain to Supabase CORS settings
- Check redirect URLs in auth settings

### Debug Mode
Enable console logging for debugging:
```javascript
// In supabase-config.js
console.log('Supabase operation:', operation, data);
```

## 📞 Support

- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.gg/supabase](https://supabase.com/docs)
- GitHub Issues: Create issue for bugs/features

## 🔄 Updates

Regularly update:
- Supabase client library
- Database schema
- Security policies
- Dependencies

---

**Ready to go!** Your MediLink Cloud application is now integrated with Supabase for secure authentication and database management.
