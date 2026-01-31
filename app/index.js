const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from DevOps Test App!',
    hostname: os.hostname(),
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint (for basic monitoring)
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
