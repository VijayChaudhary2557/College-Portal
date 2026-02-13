const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured in .env file');
      console.log('📧 Email would be sent to:', to);
      console.log('📋 Subject:', subject);
      console.log('\n📝 To configure email:');
      console.log('1. Create .env file in project root');
      console.log('2. Add these lines:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
      console.log('\n💡 For Gmail, use App Password (not regular password)');
      return { success: false, error: 'Email not configured. Please set EMAIL_USER and EMAIL_PASS in .env file' };
    }

    // Development mode: Redirect all emails to developer's email
    const DEV_EMAIL = 'vijaychaudhary2557@zohomail.in';
    const originalRecipient = to;
    
    // Modify subject to include original recipient info
    const devSubject = `[DEV - Original: ${originalRecipient}] ${subject}`;
    
    // Modify HTML to show original recipient notice at the top
    const devNotice = `
      <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ DEVELOPMENT MODE - Email Redirected</p>
        <p style="color: #856404; margin: 5px 0 0 0;">Original Recipient: <strong>${originalRecipient}</strong></p>
        <p style="color: #856404; margin: 5px 0 0 0;">This email was redirected to developer's inbox during development phase.</p>
      </div>
    `;
    const devHtml = devNotice + html;

    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');

    // Log email redirection
    console.log('🔀 [DEV MODE] Redirecting email:');
    console.log('   Original Recipient:', originalRecipient);
    console.log('   Redirected To:', DEV_EMAIL);
    console.log('   Subject:', subject);

    const info = await transporter.sendMail({
      from: `"College Portal" <${process.env.EMAIL_USER}>`,
      to: DEV_EMAIL, // Redirect to developer's email
      subject: devSubject, // Modified subject with original recipient info
      html: devHtml // Modified HTML with dev notice
    });

    console.log('✅ Email sent successfully to:', DEV_EMAIL, '(Original:', originalRecipient + ')');
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Check your email credentials in .env file');
      console.error('💡 For Gmail: Make sure you\'re using App Password, not regular password');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed. Check your EMAIL_HOST and EMAIL_PORT');
    }
    return { success: false, error: error.message };
  }
};

exports.sendAdmissionApprovalEmail = async (email, password, studentName) => {
  console.log('📧 [Email] Sending admission approval email to:', email);
  console.log('🔑 [Email] Password in email:', password);
  const subject = 'Admission Approved - College Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Congratulations! Your Admission is Approved</h2>
      <p>Dear ${studentName},</p>
      <p>We are pleased to inform you that your admission has been approved in our college.</p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p>Please login using these credentials and change your password after first login.</p>
      <p>Best regards,<br>College Administration</p>
    </div>
  `;
  return await exports.sendEmail(email, subject, html);
};

exports.sendUserCreationEmail = async (email, password, name, role) => {
  console.log('📧 [Email] Sending user creation email to:', email);
  console.log('🔑 [Email] Password in email:', password);
  const subject = 'Account Created - College Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Your Account Has Been Created</h2>
      <p>Dear ${name},</p>
      <p>Your account has been created with the role: <strong>${role}</strong></p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Your Login Credentials:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p>Please login using these credentials and change your password after first login.</p>
      <p>Best regards,<br>College Administration</p>
    </div>
  `;
  return await exports.sendEmail(email, subject, html);
};

exports.sendPlacementNotification = async (email, course, placementName, driveDate, lastDate, placementCourse) => {
  const subject = 'New Placement Opportunity';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF9800;">New Placement Drive Available</h2>
      <p>Your Course: ${course}</p>
      <p>A new placement opportunity is available for you!</p>
      <p>Please Apply from College Portal for this Opportunity.</p>
      <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Company:</strong> ${placementName}</p>
        <p><strong>Drive Date:</strong> ${new Date(driveDate).toLocaleDateString()}</p>
        <p><strong>Last Date to Apply:</strong> ${new Date(lastDate).toLocaleDateString()}</p>
      </div>
      <p>Please login to your portal to view details and apply.</p>
      <p>Best regards,<br>Placement Cell</p>
    </div>
  `;
  return await exports.sendEmail(email, subject, html);
};

exports.sendPlacementReminder = async (email, placementName, driveDate) => {
  const subject = 'Placement Drive Reminder';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F44336;">Placement Drive Tomorrow!</h2>
      <p>This is a reminder that your placement drive is scheduled for tomorrow.</p>
      <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Company:</strong> ${placementName}</p>
        <p><strong>Date:</strong> ${new Date(driveDate).toLocaleDateString()}</p>
      </div>
      <p>Please make sure you have accepted the placement consent.</p>
      <p>Best regards,<br>Placement Cell</p>
    </div>
  `;
  return await exports.sendEmail(email, subject, html);
};

exports.sendReminderNotificationEmail = async (email, placementName, jobTitle, timeframe, date) => {
  // Determine if this is deadline or drive notification
  const isDeadline = timeframe.includes('TODAY') || timeframe.includes('TOMORROW');
  const isDeadlineNotif = timeframe === 'TODAY' || timeframe === 'TOMORROW';
  
  let subject, html;
  
  if (isDeadlineNotif && timeframe) {
    // This is a deadline approaching notification
    subject = `⏰ Last Date To Apply Is ${timeframe}!`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">⏰ Deadline Alert - ${timeframe}!</h2>
        <p>Dear Student,</p>
        <p><strong>Don't miss this great opportunity!</strong></p>
        <div style="background-color: #ffebee; border-left: 4px solid #F44336; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p style="margin-top: 0;"><strong>Company:</strong> ${placementName}</p>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin-bottom: 0;"><strong>Last Date to Apply:</strong> <span style="color: #F44336; font-weight: bold;">${timeframe}</span></p>
        </div>
        <p style="color: #d32f2f; font-weight: bold;">⚠️ Apply immediately before the deadline expires!</p>
        <p>Log in to the College Portal now to submit your application.</p>
        <p>Best regards,<br>Placement Cell</p>
      </div>
    `;
  } else {
    // This is a drive scheduled notification
    subject = `🎯 Placement Drive Scheduled For ${timeframe}!`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">🎯 Placement Drive ${timeframe}!</h2>
        <p>Dear Student,</p>
        <p><strong>Get ready! Your placement drive is coming up!</strong></p>
        <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p style="margin-top: 0;"><strong>Company:</strong> ${placementName}</p>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin-bottom: 0;"><strong>Drive Date:</strong> <span style="color: #4CAF50; font-weight: bold;">${timeframe}</span></p>
        </div>
        <p>Make sure you:</p>
        <ul>
          <li>Review your resume</li>
          <li>Prepare your introduction and projects</li>
          <li>Check the drive details on the portal</li>
          <li>Arrive on time for the drive</li>
        </ul>
        <p>Best of luck with your interview!</p>
        <p>Best regards,<br>Placement Cell</p>
      </div>
    `;
  }
  
  return await exports.sendEmail(email, subject, html);
};

