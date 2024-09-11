const http = require('http');

http.createServer((request, response) => {
    const path = request.url;
    const substr = '/mylibg';

    if (path.includes(substr)) {
        console.log('server called');
        response.end("Unauthorized")


    } else {
        response.statusCode = 404;
        response.end("Not Found");
    }

}).listen(6004);