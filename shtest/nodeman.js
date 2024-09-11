const http = require('http');
const { exec } = require('child_process');

http.createServer((request, response) => {
    // exec("sh test.sh")
    response.end("works")
}).listen(6006);

console.log('Server running at http://localhost:6006/');
