const http = require('http');
const { exec } = require('child_process');

http.createServer((request, response) => {
    exec('test.sh')
}).listen(6006);

console.log('Server running at http://localhost:6006/');
