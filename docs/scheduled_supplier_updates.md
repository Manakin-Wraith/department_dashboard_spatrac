# Scheduled Supplier Updates

This document explains how to set up automated supplier information updates in the SPATRAC system to ensure all audit records have up-to-date supplier details.

## Overview

The supplier-ingredient mapping system automatically populates supplier details in audit records by matching ingredients to suppliers from department-specific CSV files. To ensure all audit records have the most current supplier information, we've implemented a scheduled task system that runs the supplier update script at regular intervals.

## Implementation Options

### 1. Node-Cron Scheduler (Development/Testing)

We've created a Node.js script that uses `node-cron` to schedule regular updates:

```bash
# Install dependencies
npm install node-cron

# Run the scheduler
node src/scripts/scheduled_supplier_updates.js
```

This script:
- Runs supplier updates daily at 1:00 AM
- Performs a more thorough update weekly on Sundays at 2:00 AM
- Logs all activities to `logs/supplier_updates.log`

### 2. PM2 Process Manager (Development/Production)

For a more robust solution in development or small production environments, use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the scheduler as a managed process
pm2 start src/scripts/scheduled_supplier_updates.js --name "supplier-updates"

# Make sure PM2 restarts on system reboot
pm2 startup
pm2 save
```

### 3. Systemd Service (Linux Production)

For Linux production environments, create a systemd service:

1. Create a service file:

```bash
sudo nano /etc/systemd/system/spatrac-supplier-updates.service
```

2. Add the following content:

```
[Unit]
Description=SPATRAC Supplier Updates Service
After=network.target

[Service]
Type=simple
User=<your-user>
WorkingDirectory=/path/to/department_dashboard_spatrac/frontend
ExecStart=/usr/bin/node src/scripts/scheduled_supplier_updates.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl enable spatrac-supplier-updates
sudo systemctl start spatrac-supplier-updates
```

### 4. Windows Task Scheduler (Windows Production)

For Windows production environments:

1. Open Task Scheduler
2. Create a new task
3. Set it to run daily at 1:00 AM
4. Action: Start a program
5. Program/script: `node`
6. Arguments: `src/scripts/scheduled_supplier_updates.js`
7. Start in: `C:\path\to\department_dashboard_spatrac\frontend`

### 5. Launchd Service (macOS Production)

For macOS production environments:

1. Create a plist file:

```bash
nano ~/Library/LaunchAgents/com.spatrac.supplier-updates.plist
```

2. Add the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.spatrac.supplier-updates</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/department_dashboard_spatrac/frontend/src/scripts/scheduled_supplier_updates.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/path/to/department_dashboard_spatrac/frontend/logs/supplier_updates.err</string>
    <key>StandardOutPath</key>
    <string>/path/to/department_dashboard_spatrac/frontend/logs/supplier_updates.log</string>
</dict>
</plist>
```

3. Load the service:

```bash
launchctl load ~/Library/LaunchAgents/com.spatrac.supplier-updates.plist
```

## Alternative: API Endpoint for Manual Updates

In addition to scheduled updates, we've added an API endpoint that allows manual triggering of supplier updates:

```javascript
// In server.js or your API routes file
app.post('/api/admin/update-suppliers', async (req, res) => {
  try {
    // Run the supplier update script
    const { exec } = require('child_process');
    const scriptPath = path.join(__dirname, 'src/scripts/fix_supplier_details.js');
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
      
      return res.json({ 
        success: true, 
        message: 'Supplier update completed successfully',
        details: stdout
      });
    });
  } catch (error) {
    console.error('Error updating suppliers:', error);
    res.status(500).json({ error: error.message });
  }
});
```

This endpoint can be called from an admin interface or using a tool like curl:

```bash
curl -X POST http://localhost:4000/api/admin/update-suppliers
```

## Monitoring and Logging

All supplier updates are logged to `logs/supplier_updates.log`. You can monitor this file to ensure updates are running as expected:

```bash
tail -f logs/supplier_updates.log
```

## Troubleshooting

If supplier updates are not running as expected:

1. Check the log file for errors
2. Ensure the script has permission to access the database file
3. Verify that the CSV files are in the correct location and format
4. Check that the system clock is set correctly for scheduled tasks
5. Ensure the service has the necessary permissions to run

## Manual Update

You can always run the supplier update script manually:

```bash
node src/scripts/fix_supplier_details.js
```

This is useful for testing or when you need to immediately update supplier information after making changes to the CSV files.
