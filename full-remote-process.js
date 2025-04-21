const { execSync } = require('child_process');

async function fullProcess() {
  try {
    // 1. Trigger the GitHub workflow
    console.log('Triggering GitHub Actions workflow...');
    execSync('npm run trigger-scrape', { stdio: 'inherit' });

    // 2. Wait for some time to allow the workflow to complete
    // This is a simple approach - in a real-world scenario you might
    // poll the GitHub API to check workflow status
    console.log('Waiting for workflow to complete (60 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // 3. Run the import process
    console.log('Running import process...');
    execSync('npm run import', { stdio: 'inherit' });

    console.log('Full remote process completed successfully!');
  } catch (error) {
    console.error('Error in full remote process:', error);
  }
}

fullProcess();
