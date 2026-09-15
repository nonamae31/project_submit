const fs = require('fs');
const iconv = require('iconv-lite');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has mojibake (e.g. Quáº£n lÃ½)
    if (content.includes('Quáº£n') || content.includes('sÃ¡ch') || content.includes('Ã')) {
      console.log(`Fixing mojibake in ${filePath}...`);
      
      // The content was mistakenly decoded as utf8 when it was actually cp1252 bytes interpreted as utf8.
      // Wait, if it was written as UTF-8 but the bytes were from cp1252 string representation:
      // string -> win1252 bytes -> utf8 string.
      // We do: utf8 string -> win1252 bytes -> utf8 string.
      const bytes = iconv.encode(content, 'win1252');
      let decoded = iconv.decode(bytes, 'utf8');
      
      fs.writeFileSync(filePath, decoded, 'utf8');
      console.log(`Fixed ${filePath}`);
    } else {
      console.log(`${filePath} seems fine or not matching known mojibake.`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

fixFile('src/app/(dashboard)/page.tsx');
fixFile('src/app/(dashboard)/TeamListClient.tsx');
