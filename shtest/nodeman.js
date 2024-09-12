const http = require('http');

http.createServer((request, response) => {
    const substr = '/mylibg';

    if (path.includes(substr)) {
        response.end("Unauthorized")
    } else {
        response.statusCode = 404;
        response.end("Not Found");
    }

}).listen(6004);

