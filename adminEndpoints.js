const { db } = require('./database');

// GET <ip:port>/api/vacuum
exports.vacuum = (req, res) => {
    db.run('VACUUM', (err) => {
        if (err) {
            console.error('Error running VACUUM:', err.message);
            return res.status(500).json({ error: err.message });
        }
    
        console.log('VACUUM completed successfully');
        res.status(200).json({status: 'completed'});
    });
};

exports.shutdown = (req, res) => {
    process.exit(1);
}
