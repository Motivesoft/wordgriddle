const db = require('./database');

const tableName = 'dictionaryWords';

exports.getWords = (req, res) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

exports.installWords = (req, res) => {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
        res.status(400).json({ error: 'Array of words is required' });
        return;
    }

    const stmt = db.prepare(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`);
    let addedCount = 0;

    db.serialize(() => {

    });

    words.forEach(
        db.run(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`, [name, price], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, name, price });
        })
    );
};
