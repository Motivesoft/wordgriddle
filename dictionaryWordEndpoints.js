// External requires
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

// Internal requires
const db = require('./database');

// The main table
const tableName = 'dictionaryWordList';

exports.match = (req, res) => {
    const word = req.params.word;

    console.debug(`Calling /api/dictionary/match/${word}`);

    try {
        const exists = matchWord(word, (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message });
            }

            return res.json({ word: word, exists: result });
        });
    } catch (error) {
        console.error('Error executing query:', error);

        res.status(500).json({ error: error.message });
    }
}

// Returns whether there are words in the dictionary that start with `:letters`
// Return is a JSON structure
// TODO See if performance would benefit from a simpler return value
// TODO See if this is just impractical from a performance point of view
// TODO RESTRUCTURE THIS TO UPLOAD THE WHOLE GRID - DO NOT MAKE INDIVIDUAL WEB CALLS TO THIS
// TODO TURN THIS INTO A REGULAR API CALL FROM A 'SOLVE PUZZLE' ENDPOINT 
// TODO Can we do a shutdown via API? And if we run with nodemon, would that be a restart?
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
        res.json({ letters: letters, exists: exists });
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

    res.status(200).json({ status: "Complete" });
};

exports.info = (req, res) => {
    console.debug(`Get dictionary info`);

    const query = `SELECT COUNT(word) AS count FROM ${tableName}`;

    db.get(query, [], (err, row) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ words: row.count });
    });
}

exports.upload = (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // * use uploadedFile.data instead of this mv
    // * tidy this implementation or get deepseek to write a sync import for one of our other implementationss

    // Upload the file to a temp folder and then import it
    let uploadedFile = req.files.file;

    console.debug(`Importing words from ${uploadedFile.name}`);

    // Get the data and split it into an array of 'words' - an unsanitized list at this point
    const data = uploadedFile.data;
    const words = data.toString('utf8').split(/\s+/).filter(word => word.length > 0);

    if (words === undefined || words.length == 0) {
        throw new Error('File does not contain a word list');
    }

    importWordList(words, (err) => {
        if (err) {
            res.status(500).json({ message: 'An error occurred', error: err.message });
        }

        res.status(200).json({ status: "Complete" });
    });
}

// Returns a [err, boolean] on whether 'word' is in the dictionary
async function matchWord(word, callback) {
    console.debug(`Searching for ${word} in the dictionary`);

    db.get(`SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE word = ?) AS exists_flag`, [word], (err, rows) => {
        if (err) {
            return callback(err, null);
        }

        callback(null, rows.exists_flag === 1);
    });
}

// Import the word list, replacing the current contents, as a transaction
async function importWordList(words, callback) {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(`DELETE FROM ${tableName}`);

        const stmt = db.prepare(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`);

        for (const word of words) {
            stmt.run(word.toLowerCase().trim(), (err) => {
                if (err) {
                    console.error('Error inserting row:', err.message);
                }
            });
        }

        stmt.finalize();

        db.run("COMMIT", (err) => {
            if (err) {
                console.error('Error committing transaction:', err.message);
                callback(err);
            } else {
                console.log('All inserts completed successfully');
                callback(null);
            }
        });
    });
}