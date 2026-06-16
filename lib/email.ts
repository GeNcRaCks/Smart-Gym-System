import nodemailer from 'nodemailer';

// Configure the SMTP transport using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an email using the configured SMTP server.
 * @param to Recipient email address
 * @param subject Subject of the email
 * @param text Body of the email in plain text
 */
export const sendEmail = async (to: string, subject: string, text: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not configured. Email will not be sent.');
        console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
        console.log(`Body: ${text}`);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: `"SmartGym" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
