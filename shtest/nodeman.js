// Install express and node-fetch before running
// npm install express node-fetch

const express = require('express');
const fetch = require('node-fetch'); // or use global fetch in Node.js v18+

const app = express();
const PORT = 6004;

app.get('/data', (req, res) => {
  const data = { message: 'Hello from Node.js!' };
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on http://64.227.143.61:${PORT}`);
});

fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Error:', err));
