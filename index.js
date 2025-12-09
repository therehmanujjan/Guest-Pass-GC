// Vercel serverless function handler
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Root route - serve index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Serve static assets
app.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // If file doesn't exist, serve index.html (for SPA routing)
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// For Vercel serverless deployment
module.exports = app;
