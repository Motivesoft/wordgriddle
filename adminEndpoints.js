const db = require('./database');

exports.shutdown = (req, res) => {
    db.run('VACUUM', (err) => {
        if (err) {
            console.error('Error running VACUUM:', err.message);
        } else {
            console.log('VACUUM completed successfully');
        }
        
        db.close();
    });
};
