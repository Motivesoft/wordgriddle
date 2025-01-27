const express = require('express');
const path = require('path');
const routes = require('./routes');
const db = require('./database');

// Doing this allows us to read version info etc.
var packageInfo = require('./package.json');

// Use this to track for shutdown events so we can try and be graceful about them
let server;

// Allow the user to configute the network port to use, or use our default
const port = process.env.PORT || 8996;
const app = express();

// Serve static files from the "public" directory and a public API
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', routes);

// Run the server
server = app.listen(port, () => {
    console.log(`Server ${packageInfo.name} ${packageInfo.version} running at http://localhost:${port}`);
});

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Listen for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);

    gracefulShutdown();
});

// Listen for process exit
process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);

    closeResources();
});

// Function to close resources
function closeResources() {
    console.log('Closing resources...');

    db.close();
}

// Graceful shutdown function
function gracefulShutdown() {
    console.log('Received shutdown signal, shutting down gracefully...');

    server.close(() => {
        console.log('Closing out remaining connections.');

        closeResources();
        process.exit(0);
    });

    // If after 10 seconds, forcefully shut down
    setTimeout(() => {
        console.error('Forcing shutdown due to timeout.');

        process.exit(1);
    }, 10000);
}