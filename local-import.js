const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { execSync } = require('child_process');

// MongoDB connection string - change as needed
const mongoUri = 'mongodb://localhost:27017';
const dbName = 'scrapertest';
const collectionName = 'quotes';

async function importData() {
  console.log('Starting import process...');

  // 1. Pull latest changes from GitHub
  console.log('Pulling latest changes...');
  execSync('git pull origin main');

  // 2. Connect to MongoDB
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUri);
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // 3. Process all JSON files in the data directory
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('No data directory found.');
    await client.close();
    return;
  }

  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  console.log(`Found ${files.length} JSON files`);

  let processedCount = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing ${file}...`);

    // Read and parse JSON file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (Array.isArray(data) && data.length > 0) {
      // Insert data into MongoDB
      await collection.insertMany(data);
      console.log(`Imported ${data.length} items from ${file}`);

      // Delete the file after successful import
      fs.unlinkSync(filePath);
      console.log(`Deleted ${file}`);

      processedCount++;
    }
  }

  // 4. Commit the file deletions
  if (processedCount > 0) {
    console.log('Committing deletions...');
    execSync('git add data/');
    execSync('git commit -m "Remove processed files" || true');
    execSync('git push origin main');
  }

  // 5. Close MongoDB connection
  await client.close();
  console.log('Import completed successfully');
}

// Run the import function
importData().catch(console.error);
