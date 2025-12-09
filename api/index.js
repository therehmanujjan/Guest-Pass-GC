const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Read the index.html file from the root directory
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load page', details: error.message });
  }
};
