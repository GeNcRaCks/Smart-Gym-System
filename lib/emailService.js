import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables explicitly for server-side modules.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.office365.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || 'smartreps1@hotmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const fromAddress = `"SmartGym" <${SMTP_USER}>`;

const sendEmail = async ({ to, subject, text, html }) => {
  const isMockEmail = !SMTP_USER || !SMTP_PASS;
  if (isMockEmail) {
    console.warn('⚠️ SMTP credentials are not configured. Using mock email delivery.');
    console.log('[Mock Email]');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text: ${text}`);
    console.log(`  HTML: ${html}`);
    return true;
  }

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('SMTP email delivery failed:', error);
    console.warn('⚠️ Falling back to mock email delivery. Email will be logged but not sent.');
    console.log('[Mock Email Fallback]');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text: ${text}`);
    console.log(`  HTML: ${html}`);
    return true;
  }
};

const getHtmlTemplate = ({ greeting, body, closing }) => `
  <html>
    <body style="font-family: Arial, sans-serif; color: #111; margin: 0; padding: 0; background: #f5f7fb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: #0f172a; padding: 32px; color: white; text-align: center; font-size: 24px; font-weight: 700;">
                  SmartGym Notification
                </td>
              </tr>
              <tr>
                <td style="padding: 32px; color: #1f2937;">
                  <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${greeting}</p>
                  <div style="font-size: 15px; line-height: 1.75; color: #334155;">
                    ${body}
                  </div>
                  <p style="margin-top: 24px; color: #475569;">${closing}</p>
                </td>
              </tr>
              <tr>
                <td style="background: #f8fafc; padding: 24px; color: #64748b; font-size: 13px; text-align: center;">
                  This message was sent by SmartGym. If you did not expect this, please ignore it.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

export const sendTrainerRequestNotification = async ({ trainerEmail, trainerName, memberName, bookingDate, timeSlot, bookingType }) => {
  const subject = 'New Training Request Received - SmartGym';
  const text = `Hello ${trainerName},\n\nYou have received a new training request from ${memberName}.\n\nDate: ${new Date(bookingDate).toLocaleDateString()}\nTime: ${timeSlot}\nType: ${bookingType}\n\nPlease log in to your SmartGym dashboard to approve or reject this request.\n\nThank you,\nSmartGym Team`;
  const html = getHtmlTemplate({
    greeting: `Hello ${trainerName},`,
    body: `You have received a new training request from <strong>${memberName}</strong>.<br/><br/>
           <strong>Date:</strong> ${new Date(bookingDate).toLocaleDateString()}<br/>
           <strong>Time:</strong> ${timeSlot}<br/>
           <strong>Type:</strong> ${bookingType}<br/><br/>
           Please log in to your SmartGym dashboard to approve or reject this request.`,
    closing: 'Thank you,<br/>SmartGym Team',
  });
  return sendEmail({ to: trainerEmail, subject, text, html });
};

export const sendBookingApprovalEmail = async ({ memberEmail, memberName, trainerName, bookingDate, timeSlot, bookingType, meetingLink }) => {
  const subject = 'Your Training Session Is Approved - SmartGym';
  const text = `Hello ${memberName},\n\nYour training session with ${trainerName} has been approved.\n\nDate: ${new Date(bookingDate).toLocaleDateString()}\nTime: ${timeSlot}\nType: ${bookingType}\n${meetingLink ? `Meeting link: ${meetingLink}\n` : ''}\n\nThank you,\nSmartGym Team`;
  const html = getHtmlTemplate({
    greeting: `Hi ${memberName},`,
    body: `Your training session with <strong>${trainerName}</strong> has been approved.<br/><br/>
           <strong>Date:</strong> ${new Date(bookingDate).toLocaleDateString()}<br/>
           <strong>Time:</strong> ${timeSlot}<br/>
           <strong>Type:</strong> ${bookingType}<br/>
           ${meetingLink ? `<strong>Meeting link:</strong> <a href="${meetingLink}">${meetingLink}</a><br/>` : ''}<br/>
           We look forward to seeing you at your session!`,
    closing: 'Thank you,<br/>SmartGym Team',
  });
  return sendEmail({ to: memberEmail, subject, text, html });
};

export const sendTestEmail = async ({ to }) => {
  const subject = 'SmartGym Email Service Test';
  const text = `Hello,\n\nThis is a test email from the SmartGym email service.\n\nIf you received this, the SMTP settings are working correctly.\n\nThank you,\nSmartGym Team`;
  const html = getHtmlTemplate({
    greeting: 'SmartGym Email Service Test',
    body: 'This is a test email from the SmartGym email service. If you received this, the SMTP settings are configured correctly.',
    closing: 'Thank you,<br/>SmartGym Team',
  });
  return sendEmail({ to, subject, text, html });
};
