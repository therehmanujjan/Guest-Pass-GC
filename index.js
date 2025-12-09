// Simple Express server for Vercel deployment
const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch all other routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel
module.exports = app;
