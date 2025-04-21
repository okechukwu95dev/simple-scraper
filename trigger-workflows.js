const axios = require('axios');
require('dotenv').config(); // For loading environment variables

// GitHub repository details
const REPO_OWNER = 'okechukwu95dev';
const REPO_NAME = 'simple-scraper';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // You'll need to set this in a .env file

// Function to trigger a specific workflow
async function triggerWorkflow(workflowFileName) {
  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN not set. Please create a .env file with your token.');
    process.exit(1);
  }

  try {
    console.log(`Triggering workflow: ${workflowFileName}...`);

    await axios.post(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${workflowFileName}/dispatches`,
      { ref: 'main' },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(`✅ Successfully triggered ${workflowFileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to trigger ${workflowFileName}:`, error.response?.data || error.message);
    return false;
  }
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node trigger-workflows.js [options]

Options:
  --scrape         Trigger the scraping workflow only
  --all            Trigger all workflows
  --help           Show this help message
    `);
    return;
  }

  // Handle different command options
  if (args.includes('--scrape')) {
    await triggerWorkflow('scrape.yml');
  } else if (args.includes('--all')) {
    // Add all your workflows here
    await triggerWorkflow('scrape.yml');
    // You can add more workflows as you add them to your project
    // await triggerWorkflow('another-workflow.yml');
  }
}

// Run the script
main().catch(console.error);
