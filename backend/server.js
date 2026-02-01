import 'dotenv/config'; // Requires npm install dotenv
import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
app.use(express.json());

// HTML/CSS for debug page
const debugHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>ComfyUI Proxy Debug</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #0f0; padding: 20px; }
    .log-entry { border-bottom: 1px solid #333; padding: 10px 0; }
    .method { font-weight: bold; color: #fff; }
    .url { color: #4db8ff; }
    .ts { color: #888; }
  </style>
</head>
<body>
  <h2>🎛️ ComfyUI Proxy Debugger</h2>
  <div id="logs"></div>
  <script>
    const evtSource = new EventSource("/debug/events");
    evtSource.onmessage = function(e) {
      const log = JSON.parse(e.data);
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = \`<span class="ts">[\${new Date(log.ts).toLocaleTimeString()}]</span> <span class="method">\${log.method}</span> <span class="url">\${log.url}</span> <pre>\${JSON.stringify(log.body || {}, null, 2)}</pre>\`;
      document.getElementById("logs").prepend(div);
    };
  </script>
</body>
</html>
`;

// SSE clients for real-time debug
let debugClients = [];

app.get('/debug', (req, res) => res.send(debugHtml));

app.get('/debug/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    debugClients.push(newClient);
    req.on('close', () => {
        debugClients = debugClients.filter(c => c.id !== clientId);
    });
});

const broadcastLog = (data) => {
    debugClients.forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }

    broadcastLog({
        ts: Date.now(),
        method: req.method,
        url: req.url,
        body: req.body
    });

    next();
});

const COMFY_URL = process.env.VITE_COMFY_API_URL || 'http://127.0.0.1:8188';

/* ===============================
   SYSTEM STATS (Test Connection)
================================ */
app.get('/api/comfy/system_stats', async (req, res) => {
    try {
        const r = await fetch(`${COMFY_URL}/system_stats`);
        res.json(await r.json());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ===============================
   QUEUE PROMPT
================================ */
app.post('/api/comfy/prompt', async (req, res) => {
    try {
        const r = await fetch(`${COMFY_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        res.json(await r.json());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ===============================
   HISTORY
================================ */
app.get('/api/comfy/history/:id', async (req, res) => {
    try {
        const r = await fetch(`${COMFY_URL}/history/${req.params.id}`);
        res.json(await r.json());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ===============================
   IMAGE UPLOAD
================================ */
app.post('/api/comfy/upload/image', async (req, res) => {
    try {
        const r = await fetch(`${COMFY_URL}/upload/image`, {
            method: 'POST',
            body: req,
            headers: req.headers,
        });

        r.body.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log('✅ ComfyUI proxy running on url');
});
