const http = require('http');
const { exec } = require('child_process');

http.createServer((request, response) => {
    exec('sh test.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Error executing script.');
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('Script executed successfully.');
    });
}).listen(6006);

console.log('Server running at http://localhost:6006/');
