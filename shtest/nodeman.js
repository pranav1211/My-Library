const http = require('http');

http.createServer((request, response) => {
    response.end("works")
}).listen(6006);

console.log('Server running at http://localhost:6006/');
