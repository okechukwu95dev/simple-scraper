require('dotenv').config();
const crypto = require('crypto');
const zlib   = require('zlib');
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');

// encryption setup
const algorithm = 'aes-256-ctr';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
function encrypt(buffer) {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
}

async function scrapeQuotes() {
  console.log('Starting scrape...');
  try {
    const response = await axios.get('https://quotes.toscrape.com/');
    const html     = response.data;
    const quotes   = [];
    const blocks   = html.split('<div class="quote"');

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      const textM = block.match(/<span class="text"[^>]*>(.*?)<\/span>/);
      const authM = block.match(/<small class="author"[^>]*>(.*?)<\/small>/);
      const tagsM = block.match(/<meta class="keywords"[^>]*content="([^"]*)"[^>]*>/);
      const text  = textM ? textM[1].replace(/["″]/g, '') : null;
      const author= authM ? authM[1] : null;
      const tags  = tagsM ? tagsM[1].split(',') : [];
      if (text && author) {
        quotes.push({
          text,
          author,
          tags,
          scrapedAt: new Date().toISOString()
        });
      }
    }

    console.log(`Found ${quotes.length} quotes`);
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath  = path.join(dataDir, `quotes-${timestamp}.json`);

    // serialize → compress → encrypt → write
    const jsonData   = JSON.stringify(quotes, null, 2);
    const compressed = zlib.gzipSync(Buffer.from(jsonData));
    const payload    = encrypt(compressed);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

    console.log(`Encrypted data saved to ${filePath}`);
  } catch (error) {
    console.error('Error scraping data:', error);
    process.exit(1);
  }
}

scrapeQuotes();
