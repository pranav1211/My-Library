const express = require('express');
const app = express();
const { exec } = require('child_process');
const path = require('path');

// Absolute path to the shell script
const scriptPath = '/shellfiles/test.sh';

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/mylibg', (req, res) => {    
    exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).json({ message: 'Error executing script', error: error.message });
        }
        
        // Log the script output (for debugging purposes)
        console.log(`Script output: ${stdout}`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }

        // Send the response
        res.status(200).json({ message: 'Script executed successfully', timestamp: new Date() });
    });
});

app.listen(6004, () => {
    console.log('Server is running on port 6004');
});
