const db = require('./database');

const tableName = 'dictionaryWordList';

exports.match = (req, res) => {
    const word = req.params.word;

    console.debug(`Calling /api/dictionary/match/${word}`);

    const query = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE word = ?) AS exists_flag`;

    db.get(query, [word], (err, row) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        const exists = row.exists_flag === 1;
        res.json({word: word, exists: exists});
    });
};

// Returns whether there are words in the dictionary that start with `:letters`
// Return is a JSON structure
// TODO See if performance would benefit from a simpler return value
// TODO See if this is just impractical from a performance point of view
// TODO RESTRUCTURE THIS TO UPLOAD THE WHOLE GRID - DO NOT MAKE INDIVIDUAL WEB CALLS TO THIS
// TODO TURN THIS INTO A REGULAR API CALL FROM A 'SOLVE PUZZLE' ENDPOINT 
exports.partialMatch = (req, res) => {
    const letters = req.params.letters;

    console.debug(`Calling /api/dictionary/partial/${letters}`);

    const query = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE word LIKE ?) AS exists_flag`;

    db.get(query, [`${letters}%`], (err, row) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        const exists = row.exists_flag === 1;
        res.json({letters: letters, exists: exists});
    });
};

// Inserts the contents of the `words` array into the dictionary table
// TODO consider using express file upload
// TODO delete current database contents
// TODO make sure to use an insert method reasonable for performance 
// TODO return word/insert count
exports.installWords = (req, res) => {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
        res.status(400).json({ error: 'Array of words is required' });
        return;
    }

    const stmt = db.prepare(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`);
    let addedCount = 0;

    // db.serialize(() => {

    // });

    words.forEach((word) => {
        db.run(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`, [word], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
//            res.json({ id: this.lastID, name, price });
        });
    });

    res.status(200).json({status: "Complete"});
};
