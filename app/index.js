const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const startTimeMs = Date.now();
let totalRequests = 0;
const requestTimestamps = [];

app.use((req, res, next) => {
  totalRequests += 1;
  const now = Date.now();
  requestTimestamps.push(now);

  // Keep a rolling 60-second window for near-real-time QPS.
  while (requestTimestamps.length && requestTimestamps[0] <= now - 60000) {
    requestTimestamps.shift();
  }
  next();
});

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
  const uptimeSeconds = process.uptime();
  const qpsAverage = uptimeSeconds > 0 ? totalRequests / uptimeSeconds : 0;
  const qpsLastMinute = requestTimestamps.length / 60;

  res.json({
    uptime: uptimeSeconds,
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    requests: {
      total: totalRequests,
      qpsAverage: Number(qpsAverage.toFixed(4)),
      qpsLastMinute: Number(qpsLastMinute.toFixed(4)),
      startedAt: new Date(startTimeMs).toISOString()
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
