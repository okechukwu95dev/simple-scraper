require('dotenv').config();
const crypto = require('crypto');
const zlib   = require('zlib');
const fs     = require('fs');
const path   = require('path');
const { MongoClient } = require('mongodb');
const { execSync }    = require('child_process');

// encryption setup
const algorithm = 'aes-256-ctr';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
function decrypt(hash) {
  const iv      = Buffer.from(hash.iv, 'hex');
  const content = Buffer.from(hash.content, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  return Buffer.concat([decipher.update(content), decipher.final()]);
}

const mongoUri       = 'mongodb://localhost:27017';
const dbName         = 'scrapertest';
const collectionName = 'quotes';

async function importData() {
  console.log('Starting import process...');

  console.log('Pulling latest changes...');
  execSync('git pull origin main');

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db         = client.db(dbName);
  const collection = db.collection(collectionName);

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('No data directory found.');
    await client.close();
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files`);

  let processedCount = 0;
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing ${file}...`);

    // read → decrypt → decompress → parse
    const wrapped     = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const decrypted   = decrypt(wrapped);
    const decompressed= zlib.gunzipSync(decrypted);
    const data        = JSON.parse(decompressed.toString());

    if (Array.isArray(data) && data.length) {
      await collection.insertMany(data);
      console.log(`Imported ${data.length} items from ${file}`);
      fs.unlinkSync(filePath);
      console.log(`Deleted ${file}`);
      processedCount++;
    }
  }

  if (processedCount > 0) {
    console.log('Committing deletions...');
    execSync('git add data/');
    execSync('git commit -m "Remove processed files" || true');
    execSync('git push origin main');
  }

  await client.close();
  console.log('Import completed successfully');
}

importData().catch(console.error);
