// Custom json-server script with increased max listeners
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./mock/db.json');
const routes = require('./mock/routes.json');
const middlewares = jsonServer.defaults();
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// Increase the max listeners to prevent warnings
process.setMaxListeners(20);

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Parse JSON bodies
server.use(jsonServer.bodyParser);

// Add custom routes before JSON Server router
server.use(jsonServer.rewriter(routes));

// Add redirect for /admin/update-suppliers to /api/admin/update-suppliers
server.get('/admin/update-suppliers', (req, res) => {
  res.redirect('/api/admin/update-suppliers');
});

// Add custom API endpoints for manual supplier updates
// GET endpoint for browser access
server.get('/api/admin/update-suppliers', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Supplier Update Tool</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .btn { 
            display: inline-block; 
            background: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 4px; 
            border: none;
            cursor: pointer;
            font-size: 16px;
          }
          .btn:hover { background: #45a049; }
          .result { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
          .loading { display: none; margin-top: 20px; }
          pre { background: #f4f4f4; padding: 10px; overflow: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SPATRAC Supplier Update Tool</h1>
          <p>This tool allows you to manually update supplier information for all audit records.</p>
          <p>Click the button below to start the update process:</p>
          
          <button id="updateBtn" class="btn">Update Supplier Information</button>
          
          <div id="loading" class="loading">
            <p>Updating supplier information. This may take a few moments...</p>
          </div>
          
          <div id="result" class="result" style="display:none;"></div>
          
          <script>
            document.getElementById('updateBtn').addEventListener('click', function() {
              const loadingEl = document.getElementById('loading');
              const resultEl = document.getElementById('result');
              const btnEl = document.getElementById('updateBtn');
              
              loadingEl.style.display = 'block';
              resultEl.style.display = 'none';
              btnEl.disabled = true;
              
              fetch('/api/admin/update-suppliers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              .then(response => response.json())
              .then(data => {
                loadingEl.style.display = 'none';
                resultEl.style.display = 'block';
                btnEl.disabled = false;
                
                let html = '';
                if (data.success) {
                  html = '<h3>Success!</h3><p>' + data.message + '</p>';
                  if (data.details) {
                    html += '<h4>Details:</h4><pre>' + data.details + '</pre>';
                  }
                } else {
                  html = '<h3>Error</h3><p>' + (data.error || 'Unknown error occurred') + '</p>';
                }
                
                resultEl.innerHTML = html;
              })
              .catch(error => {
                loadingEl.style.display = 'none';
                resultEl.style.display = 'block';
                btnEl.disabled = false;
                
                resultEl.innerHTML = '<h3>Error</h3><p>' + error.message + '</p>';
              });
            });
          </script>
        </div>
      </body>
    </html>
  `);
});

// POST endpoint for API access
server.post('/api/admin/update-suppliers', (req, res) => {
  console.log('Received request to update supplier details');
  
  try {
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Log file path
    const logFile = path.join(logsDir, 'supplier_updates.log');
    
    // Log the update request
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] Manual supplier update requested\n`);
    
    // Run the supplier update script
    const scriptPath = path.join(__dirname, 'src/scripts/fix_supplier_details.js');
    
    console.log(`Executing script: ${scriptPath}`);
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running supplier update: ${error.message}`);
        fs.appendFileSync(logFile, `[${timestamp}] Error: ${error.message}\n`);
        return res.status(500).json({ error: error.message });
      }
      
      if (stderr) {
        console.warn(`Supplier update stderr: ${stderr}`);
        fs.appendFileSync(logFile, `[${timestamp}] Warning: ${stderr}\n`);
      }
      
      console.log('Supplier update completed successfully');
      fs.appendFileSync(logFile, `[${timestamp}] Success: Supplier update completed\n`);
      fs.appendFileSync(logFile, `[${timestamp}] Details: ${stdout}\n`);
      
      return res.json({ 
        success: true, 
        message: 'Supplier update completed successfully',
        details: stdout
      });
    });
  } catch (error) {
    console.error('Error processing supplier update request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use default router
server.use(router);

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
  console.log(`Max listeners set to ${process.getMaxListeners()}`);
  console.log(`Manual supplier update endpoint available at: http://localhost:${PORT}/api/admin/update-suppliers`);
});
