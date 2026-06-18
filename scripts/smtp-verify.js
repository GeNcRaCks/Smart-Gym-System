import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function verify() {
  try {
    const result = await transporter.verify();
    console.log('verify result', result);
  } catch (err) {
    console.error('verify error', err);
  }
  try {
    const info = await transporter.sendMail({
      from: `SmartGym <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TEST_RECIPIENT || process.env.SMTP_USER,
      subject: 'SMTP Verify Test',
      text: 'This is a connectivity test.',
    });
    console.log('sendMail info', info);
  } catch (err) {
    console.error('sendMail error', err);
  }
}

verify();
