const db = require('./database');

// GET <ip:port>/api/vacuum
exports.vacuum = (req, res) => {
    db.run('VACUUM', (err) => {
        if (err) {
            console.error('Error running VACUUM:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
    
        console.log('VACUUM completed successfully');
        res.status(200).send('VACUUM completed');
    });
};

exports.shutdown = (req, res) => {
    process.exit(1);
}
