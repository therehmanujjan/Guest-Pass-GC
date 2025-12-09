const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.static(__dirname));

// Serve the shared guest pass system
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shared-guest-pass-system.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Shared Guest Pass System running on port ${PORT}`);
  console.log(`Access the shared system at: http://localhost:${PORT}`);
});

module.exports = app;