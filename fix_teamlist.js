const fs = require('fs');
const iconv = require('iconv-lite');

const filePath = 'src/app/(dashboard)/TeamListClient.tsx';
let content = fs.readFileSync(filePath);

// Read as utf8 string first to see if it was saved as utf8 with literal mojibake
let str = content.toString('utf8');
if (str.charCodeAt(0) === 0xFEFF) {
  str = str.slice(1);
}

// Convert from literal mojibake (utf8 string) to win1252 buffer to utf8 string
let bytes = iconv.encode(str, 'win1252');
let decoded = iconv.decode(bytes, 'utf8');

fs.writeFileSync(filePath, decoded, 'utf8');
console.log('Fixed TeamListClient.tsx');
