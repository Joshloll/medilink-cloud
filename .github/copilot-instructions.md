# MediLink Cloud - Project Instructions

## Project Overview
MediLink Cloud is a cloud-based healthcare appointment and health record management system built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT with bcrypt
- **Cloud Platform**: AWS/Azure ready
- **Email**: Nodemailer for notifications

## Project Structure
- `/backend` - Node.js Express API server
- `/frontend` - Client-side web application
- `/database` - SQL schemas and migrations
- `/docs` - API and system documentation

## Development Guidelines
- Use ES6+ JavaScript features
- Follow RESTful API conventions
- Implement role-based access control (patient, doctor, admin)
- Ensure all patient data is encrypted
- Write modular, reusable code
- Use environment variables for sensitive data

## Security Requirements
- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting on API endpoints

## User Roles
1. **Patient** - Book appointments, view history, manage profile
2. **Doctor** - View schedules, access patient records, manage availability
3. **Admin** - Manage all users, appointments, and system settings
