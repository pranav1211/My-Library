const express = require('express');
const app = express();

const { exec } = require('child_process');


app.get('/mylibg', (req, res) => {
    res.status(200).json({ message: 'Hello, world!', timestamp: new Date() });
    exec('sh test.sh')
});

app.listen(6004, () => {
    console.log('Server is running on port 6004');
});
