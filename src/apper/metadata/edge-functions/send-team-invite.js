import apper from 'https://cdn.apper.io/actions/apper-actions.js';

apper.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    const { teamName, teamId, memberEmail, memberName, memberRole, inviterName } = body;
    
    if (!teamName || !teamId || !memberEmail || !memberName || !memberRole || !inviterName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: teamName, teamId, memberEmail, memberName, memberRole, inviterName'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate role
    const validRoles = ['Owner', 'Admin', 'Member', 'Viewer'];
    if (!validRoles.includes(memberRole)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid role. Must be one of: Owner, Admin, Member, Viewer'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get email configuration from secrets
    const emailApiKey = await apper.getSecret('EMAIL_API_KEY');
    const emailService = await apper.getSecret('EMAIL_SERVICE_PROVIDER');
    const fromEmail = await apper.getSecret('FROM_EMAIL');

    if (!emailApiKey || !emailService || !fromEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email service not properly configured'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate invitation link (in production, this would include a secure token)
    const invitationUrl = `${req.headers.get('origin') || 'https://app.example.com'}/teams/${teamId}/invite?email=${encodeURIComponent(memberEmail)}`;

    // Prepare email content
    const emailSubject = `You've been invited to join ${teamName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .role-badge { background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 You're Invited!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Join your team on TaskFlow</p>
          </div>
          <div class="content">
            <p>Hi ${memberName},</p>
            
            <p><strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> team with the role of <span class="role-badge">${memberRole}</span>.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">What you can do as a ${memberRole}:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                ${memberRole === 'Owner' ? `
                  <li>Full access to team settings and content</li>
                  <li>Manage team members and their roles</li>
                  <li>Create, edit, and delete tasks</li>
                  <li>Delete the team</li>
                ` : memberRole === 'Admin' ? `
                  <li>Manage team members and their roles</li>
                  <li>Create, edit, and delete tasks</li>
                  <li>Modify team settings</li>
                ` : memberRole === 'Member' ? `
                  <li>Create and edit tasks</li>
                  <li>View team content and activity</li>
                  <li>Collaborate with team members</li>
                ` : `
                  <li>View team content and activity</li>
                  <li>Comment on tasks and discussions</li>
                  <li>Read-only access to team information</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you don't want to join this team, you can safely ignore this email. 
              The invitation will expire in 7 days.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              This invitation was sent to <strong>${memberEmail}</strong>. 
              If you believe this was sent to you by mistake, please contact the team administrator.
            </p>
          </div>
          <div class="footer">
            <p>TaskFlow Team Collaboration Platform</p>
            <p>Organize your team's work and get things done together.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      Hi ${memberName},

      ${inviterName} has invited you to join the ${teamName} team as a ${memberRole}.

      To accept this invitation, click the link below:
      ${invitationUrl}

      If you don't want to join this team, you can safely ignore this email.

      Best regards,
      TaskFlow Team
    `;

    // Send email based on configured service
    let emailResponse;
    
    if (emailService.toLowerCase() === 'sendgrid') {
      // SendGrid implementation
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: memberEmail, name: memberName }],
            subject: emailSubject
          }],
          from: { email: fromEmail, name: 'TaskFlow' },
          content: [
            { type: 'text/plain', value: emailText },
            { type: 'text/html', value: emailHtml }
          ]
        })
      });

      if (!sendGridResponse.ok) {
        const error = await sendGridResponse.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      emailResponse = { success: true, provider: 'SendGrid' };

    } else if (emailService.toLowerCase() === 'resend') {
      // Resend implementation
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `TaskFlow <${fromEmail}>`,
          to: [memberEmail],
          subject: emailSubject,
          html: emailHtml,
          text: emailText
        })
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.json();
        throw new Error(`Resend error: ${error.message || 'Unknown error'}`);
      }

      const resendData = await resendResponse.json();
      emailResponse = { success: true, provider: 'Resend', id: resendData.id };

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unsupported email service provider'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Team invitation sent successfully',
      data: {
        teamId,
        teamName,
        memberEmail,
        memberName,
        memberRole,
        inviterName,
        emailProvider: emailResponse.provider,
        sentAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending team invitation:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});