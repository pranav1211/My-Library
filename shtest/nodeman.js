const http = require('http');

http.createServer((request, response) => {
    response.end("works")
}).listen(6004);

console.log('Server running at http://localhost:6006/');
