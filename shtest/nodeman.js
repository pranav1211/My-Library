const express = require('express');
const app = express();

app.get('/mylibg', (req, res) => {
  res.status(200).json({ message: 'Hello, world!', timestamp: new Date() });
});

app.listen(6004, () => {
  console.log('Server is running on port 3000');
});
