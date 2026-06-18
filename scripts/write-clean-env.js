const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
const content = [
  'DATABASE_URL="file:./dev.db"',
  'JWT_SECRET="super-secret-key-change-me"',
  '',
  '# SMTP Configuration for Email Notifications',
  'SMTP_HOST=smtp.gmail.com',
  'SMTP_PORT=587',
  'SMTP_SECURE=false',
  'SMTP_USER=',
  'SMTP_PASS=',
].join('\n');
fs.writeFileSync(envPath, content, 'utf8');
console.log('Wrote clean UTF-8 .env');
