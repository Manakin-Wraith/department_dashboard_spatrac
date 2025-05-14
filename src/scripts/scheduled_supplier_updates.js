/**
 * Scheduled Supplier Updates
 * 
 * This script sets up scheduled tasks to automatically update supplier information
 * in audit records at regular intervals.
 */

const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Path to log file
const LOG_FILE = path.join(__dirname, '../../logs/supplier_updates.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log message to file with timestamp
 * @param {string} message - Message to log
 */
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(logEntry);
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, logEntry);
}

/**
 * Run the supplier update script
 */
function runSupplierUpdate() {
  logMessage('Starting scheduled supplier update...');
  
  const scriptPath = path.join(__dirname, 'fix_supplier_details.js');
  
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      logMessage(`Error running supplier update: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logMessage(`Supplier update stderr: ${stderr}`);
    }
    
    logMessage(`Supplier update completed successfully: ${stdout}`);
  });
}

// Schedule supplier updates to run daily at 1:00 AM
// Cron format: minute hour day-of-month month day-of-week
cron.schedule('0 1 * * *', () => {
  logMessage('Running scheduled daily supplier update');
  runSupplierUpdate();
});

// Schedule supplier updates to run weekly on Sunday at 2:00 AM
// for a more thorough update
cron.schedule('0 2 * * 0', () => {
  logMessage('Running scheduled weekly supplier update');
  runSupplierUpdate();
});

// Also run immediately when the script starts
runSupplierUpdate();

logMessage('Supplier update scheduler started');

// Keep the script running
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logMessage('Supplier update scheduler stopped');
  process.exit(0);
});

/**
 * To run this script as a service:
 * 
 * 1. For development/testing:
 *    - Run with: node src/scripts/scheduled_supplier_updates.js
 *    - Use tools like PM2: pm2 start src/scripts/scheduled_supplier_updates.js --name "supplier-updates"
 * 
 * 2. For production:
 *    - Create a systemd service (Linux)
 *    - Use Windows Task Scheduler (Windows)
 *    - Set up as a launchd service (macOS)
 * 
 * See the README.md for more details on setting up the scheduled task in production.
 */
