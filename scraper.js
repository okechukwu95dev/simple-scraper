const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Simple function to scrape quotes from a test website
async function scrapeQuotes() {
  console.log('Starting scrape...');

  try {
    // This is a public test site for web scraping
    const response = await axios.get('https://quotes.toscrape.com/');

    // Extract quotes using simple string manipulation
    const html = response.data;
    const quotes = [];

    // Very basic parsing (in real project you'd use cheerio or similar)
    const quoteBlocks = html.split('<div class="quote"');

    for (let i = 1; i < quoteBlocks.length; i++) {
      const block = quoteBlocks[i];

      // Extract the text
      const textMatch = block.match(/<span class="text"[^>]*>(.*?)<\/span>/);
      const text = textMatch ? textMatch[1].replace(/["″]/g, '') : null;

      // Extract the author
      const authorMatch = block.match(/<small class="author">(.*?)<\/small>/);
      const author = authorMatch ? authorMatch[1] : null;

      if (text && author) {
        quotes.push({ text, author, scrapedAt: new Date().toISOString() });
      }
    }

    console.log(`Found ${quotes.length} quotes`);

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Save to a file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dataDir, `quotes-${timestamp}.json`);


    fs.writeFileSync(filePath, JSON.stringify(quotes, null, 2));
    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    console.error('Error scraping data:', error);
    process.exit(1);
  }
}

// Run the scraper
scrapeQuotes();
