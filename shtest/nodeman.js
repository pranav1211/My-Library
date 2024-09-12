const express = require('express');
const app = express();
const port = 6004; // Ensure this matches the port you configured in Nginx

// Route for /mylibg
app.get('/mylibg', (req, res) => {
  res.send('Welcome to My Library');
});

// Start the server
app.listen(port, () => {
  console.log(`Node.js server running on http://localhost:${port}/mylibg`);
});
