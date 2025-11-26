import apper from 'https://cdn.apper.io/actions/apper-actions.js';
import nodemailer from 'npm:nodemailer';

apper.serve(async (req) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    let emailData;
    try {
      emailData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    const requiredFields = ['to', 'subject'];
    const missingFields = requiredFields.filter(field => !emailData[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get email configuration from secrets
    const emailHost = await apper.getSecret('EMAIL_HOST') || 'smtp.gmail.com';
    const emailPort = await apper.getSecret('EMAIL_PORT') || '587';
    const emailUser = await apper.getSecret('EMAIL_USER');
    const emailPass = await apper.getSecret('EMAIL_PASS');
    const emailFrom = await apper.getSecret('EMAIL_FROM') || emailUser;

    // Validate email credentials
    if (!emailUser || !emailPass) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS secrets.' 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransporter({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === '465', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service configuration error. Please check email credentials.' 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email message
    const mailOptions = {
      from: `"TaskFlow Automation" <${emailFrom}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.subject,
      html: emailData.html || emailData.text || emailData.subject
    };

    // Add CC and BCC if provided
    if (emailData.cc) {
      mailOptions.cc = emailData.cc;
    }
    if (emailData.bcc) {
      mailOptions.bcc = emailData.bcc;
    }

    // Add reply-to if provided
    if (emailData.replyTo) {
      mailOptions.replyTo = emailData.replyTo;
    }

    // Add custom headers for task tracking
    mailOptions.headers = {
      'X-TaskFlow-Type': emailData.type || 'notification',
      'X-TaskFlow-Task-ID': emailData.taskId || 'unknown',
      'X-TaskFlow-Sent': new Date().toISOString()
    };

    // Handle attachments if provided
    if (emailData.attachments && Array.isArray(emailData.attachments)) {
      mailOptions.attachments = emailData.attachments.map(attachment => ({
        filename: attachment.filename || 'attachment',
        content: attachment.content,
        contentType: attachment.contentType || 'application/octet-stream',
        encoding: attachment.encoding || 'base64'
      }));
    }

    // Send email with timeout
    let emailResult;
    try {
      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 30000)
      );
      
      emailResult = await Promise.race([sendPromise, timeoutPromise]);
    } catch (error) {
      console.error('Email sending failed:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${error.message}` 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Close transporter
    transporter.close();

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.messageId,
        response: emailResult.response,
        sentAt: new Date().toISOString(),
        recipient: emailData.to,
        subject: emailData.subject
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in email service:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while sending email',
        details: error.message
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});