// External requires
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');

// Internal requires
const routes = require('./routes');
const { db } = require('./database');

// Disable logging
if (process.env.NODE_ENV !== 'development') {
    console.log = () => { };
    console.debug = () => { };
}

// Doing this allows us to read version info etc.
var packageInfo = require('./package.json');

// Allow the user to configute the network port to use, or use our default
const port = process.env.PORT || 8996;
const app = express();

// Serve static files from the "public" directory, file upload middleware, and a public API
app.use(express.json());
app.use(express.text());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use('/api', routes);

// Run the server
const server = app.listen(port, () => {
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