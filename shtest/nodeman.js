const { exec } = require('child_process');
const http = require('http');

http.createServer((request, response) => {
    const path = request.url;
    const substr = '/mylibg';

    if (path.includes(substr)) {
        console.log('Server called');
        
        // Execute shell script
        exec("sh test.sh", (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                response.statusCode = 500;
                response.end(`Server error: ${error.message}`);
                return;
            }

            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            response.end("Shell script executed");
        });

    } else {
        response.statusCode = 404;
        response.end("Not Found");
    } 

}).listen(6004, () => {
    console.log('Server running at http://localhost:6004/');
});
