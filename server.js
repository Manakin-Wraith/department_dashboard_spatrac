// Custom json-server script with increased max listeners
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./mock/db.json');
const routes = require('./mock/routes.json');
const middlewares = jsonServer.defaults();

// Increase the max listeners to prevent warnings
process.setMaxListeners(20);

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.use(jsonServer.rewriter(routes));

// Use default router
server.use(router);

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
  console.log(`Max listeners set to ${process.getMaxListeners()}`);
});
