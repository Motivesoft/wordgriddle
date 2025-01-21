const db = require('./database');

exports.vacuum = (req, res) => {
    db.run('VACUUM', (err) => {
        if (err) {
            console.error('Error running VACUUM:', err.message);
        } else {
            console.log('VACUUM completed successfully');
        }
    });
};

// Housekeeping

process.on('SIGINT', () => {
    console.log("SIGINT");

    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("SIGTERM");

    db.close();
    process.exit(0);
});
