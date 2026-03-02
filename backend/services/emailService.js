const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email Templates
const emailTemplates = {
  appointmentConfirmation: (data) => ({
    subject: 'Appointment Confirmation - MediLink Cloud',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Confirmed</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Specialization:</strong> ${data.specialization}</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
          <p><strong>Location:</strong> ${data.location || 'Main Clinic'}</p>
        </div>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p>If you need to reschedule or cancel, please log in to your account or contact us.</p>
        <p>Best regards,<br>MediLink Cloud Team</p>
      </div>
    `
  }),

  appointmentReminder: (data) => ({
    subject: 'Appointment Reminder - MediLink Cloud',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Reminder</h2>
        <p>Dear ${data.patientName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
        </div>
        <p>Please arrive 15 minutes early.</p>
        <p>Best regards,<br>MediLink Cloud Team</p>
      </div>
    `
  }),

  appointmentCancellation: (data) => ({
    subject: 'Appointment Cancelled - MediLink Cloud',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Appointment Cancelled</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your appointment has been cancelled:</p>
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
        <p>You can book a new appointment by logging in to your account.</p>
        <p>Best regards,<br>MediLink Cloud Team</p>
      </div>
    `
  }),

  newAppointmentAlert: (data) => ({
    subject: 'New Appointment Scheduled - MediLink Cloud',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Appointment</h2>
        <p>Dear Dr. ${data.doctorName},</p>
        <p>A new appointment has been scheduled:</p>
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${data.patientName}</p>
          <p><strong>Date:</strong> ${data.appointmentDate}</p>
          <p><strong>Time:</strong> ${data.appointmentTime}</p>
          <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
        </div>
        <p>Please log in to view more details.</p>
        <p>Best regards,<br>MediLink Cloud System</p>
      </div>
    `
  }),

  welcomeEmail: (data) => ({
    subject: 'Welcome to MediLink Cloud',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to MediLink Cloud!</h1>
        <p>Dear ${data.firstName} ${data.lastName},</p>
        <p>Thank you for registering with MediLink Cloud. Your account has been successfully created.</p>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Role:</strong> ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</p>
          <p><strong>Email:</strong> ${data.email}</p>
        </div>
        <p>You can now log in and start using our services:</p>
        <ul>
          <li>${data.role === 'patient' ? 'Book appointments with doctors' : ''}</li>
          <li>${data.role === 'doctor' ? 'Manage your schedule and patients' : ''}</li>
          <li>Access health records securely</li>
          <li>Receive appointment notifications</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>MediLink Cloud Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MediLink Cloud <noreply@medilink.com>',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send appointment confirmation
const sendAppointmentConfirmation = async (appointmentData) => {
  return await sendEmail(
    appointmentData.patientEmail,
    'appointmentConfirmation',
    appointmentData
  );
};

// Send appointment reminder
const sendAppointmentReminder = async (appointmentData) => {
  return await sendEmail(
    appointmentData.patientEmail,
    'appointmentReminder',
    appointmentData
  );
};

// Send cancellation notification
const sendCancellationNotification = async (appointmentData) => {
  return await sendEmail(
    appointmentData.patientEmail,
    'appointmentCancellation',
    appointmentData
  );
};

// Send new appointment alert to doctor
const sendDoctorAppointmentAlert = async (appointmentData) => {
  return await sendEmail(
    appointmentData.doctorEmail,
    'newAppointmentAlert',
    appointmentData
  );
};

// Send welcome email
const sendWelcomeEmail = async (userData) => {
  return await sendEmail(
    userData.email,
    'welcomeEmail',
    userData
  );
};

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendCancellationNotification,
  sendDoctorAppointmentAlert,
  sendWelcomeEmail
};
