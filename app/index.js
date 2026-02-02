const express = require('express');
const os = require('os');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

app.use((req, res, next) => {
  res.on('finish', () => {
    const route = req.route && req.route.path ? req.route.path : req.path;
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode)
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main endpoint
app.get('/', (req, res) => {
  const payload = {
    message: 'Testing deploy using ansible and workflow!',
    hostname: os.hostname(),
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DevOps Test App</title>
    <style>
      :root {
        --bg: #0f172a;
        --card: #111827;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #22d3ee;
        --accent-2: #60a5fa;
        --border: #1f2937;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
        background: radial-gradient(1200px 600px at 10% 0%, #0b1220, var(--bg));
        color: var(--text);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        width: min(900px, 100%);
        background: linear-gradient(160deg, #0b1326, var(--card));
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      }
      .title {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.2px;
        margin: 0 0 8px 0;
      }
      .subtitle {
        color: var(--muted);
        margin: 0 0 24px 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .tile {
        background: #0b1020;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
      }
      .label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
      .value {
        font-size: 16px;
        font-weight: 600;
      }
      .cta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .btn {
        text-decoration: none;
        color: #0b1220;
        background: linear-gradient(90deg, var(--accent), var(--accent-2));
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
      }
      .btn.secondary {
        background: transparent;
        color: var(--text);
        border: 1px solid var(--border);
      }
      pre {
        margin: 20px 0 0 0;
        background: #0b1020;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
        color: #cbd5f5;
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1 class="title">DevOps Test App</h1>
      <p class="subtitle">Service is running and ready to be monitored.</p>

      <section class="grid">
        <div class="tile">
          <div class="label">Message</div>
          <div class="value">${payload.message}</div>
        </div>
        <div class="tile">
          <div class="label">Hostname</div>
          <div class="value">${payload.hostname}</div>
        </div>
        <div class="tile">
          <div class="label">Version</div>
          <div class="value">${payload.version}</div>
        </div>
        <div class="tile">
          <div class="label">Environment</div>
          <div class="value">${payload.env}</div>
        </div>
      </section>

      <div class="cta">
        <a class="btn" href="/health">Health Check</a>
        <a class="btn secondary" href="/metrics">Prometheus Metrics</a>
      </div>

      <pre>${JSON.stringify(payload, null, 2)}</pre>
    </main>
  </body>
</html>`);
});

// Prometheus metrics endpoint.
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
