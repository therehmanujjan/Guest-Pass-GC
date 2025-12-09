const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8082;

// Serve static files
app.use(express.static(__dirname));

// Security headers - more permissive for production
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; connect-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'guest-pass-system.html'));
});

app.listen(PORT, () => {
  console.log(`Grand City Guest Pass System running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});