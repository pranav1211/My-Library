const { exec } = require('child_process');
const http = require('http');

http.createServer((request, response) => {
 exec("sh test.sh")

}).listen(6004);