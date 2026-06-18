const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found');
  process.exit(1);
}
const raw = fs.readFileSync(envPath);
let text;
if (raw[0] === 0xFF && raw[1] === 0xFE) {
  text = raw.slice(2).toString('utf16le');
} else if (raw[0] === 0xFE && raw[1] === 0xFF) {
  text = raw.slice(2).toString('utf16be');
} else if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
  text = raw.slice(3).toString('utf8');
} else if (raw.includes(0)) {
  text = raw.toString('utf16le');
} else {
  text = raw.toString('utf8');
}
text = text.replace(/^\uFEFF/, '');
fs.writeFileSync(envPath, text, 'utf8');
console.log('Rewrote .env as UTF-8');
