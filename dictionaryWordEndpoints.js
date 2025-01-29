// External requires

// Internal requires
const db = require('./database');

// The main table
const tableName = 'dictionaryWordList';

// Endpoint to confirm whether :word exists in the word list table
// Returns a JSON structure
exports.match = (req, res) => {
    const word = req.params.word;

    console.debug(`Calling /api/dictionary/match/${word}`);

    matchWord(word, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }

        return res.json({ word: word, exists: result });
    });
}

// Endpoint to confirm whether there are words in the word list table that _start with_ `:letters`
// Returns a JSON structure
exports.partialMatch = (req, res) => {
    const letters = req.params.letters;

    console.debug(`Calling /api/dictionary/partial/${letters}`);

    matchPartialWord(letters, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }

        return res.json({ letters: letters, exists: result });
    });
};

// Endpoint that returns the number of entries in the word list table
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

// Endpoint to upload a text file and have its contents injected into the word list table, deleting the existing content
// Returns a JSON structure
exports.upload = (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Get the file from the input. 
    // Its contents will be in 'uploadedFile.data' and we will need to call 'toString' on it before use
    let uploadedFile = req.files.file;

    console.debug(`Importing words from ${uploadedFile.name}`);

    // Get the data and split it into an array of 'words' - an unsanitized list at this point
    // TODO consider excluding words of less than 4 chars
    // TODO finally decide whether we like this a-z test
    const data = uploadedFile.data;
    const words = data.toString('utf8').split(/\s+/).filter(word => word.length > 0 && /^[a-zA-Z]*$/.test(word));

    if (words === undefined || words.length == 0) {
        throw new Error('File does not contain a word list');
    }

    importWordList(words, (err, count) => {
        if (err) {
            res.status(500).json({ message: 'An error occurred', error: err.message });
        }

        res.status(200).json({ status: "Complete", words: words.length, imported: count });
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

// Returns a [err, boolean] on whether any words starting with 'letters' are in the dictionary
async function matchPartialWord(letters, callback) {
    console.debug(`Searching for ${letters}.* in the dictionary`);

    // Append '%' to the provided value to do a SQL wildcard search for words starting with 'letters'
    db.get(`SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE word LIKE ?) AS exists_flag`, [`${letters}%`], (err, rows) => {
        if (err) {
            return callback(err, null);
        }

        callback(null, rows.exists_flag === 1);
    });
}

// Import the word list, replacing the current contents, as a transaction
// Returns [err, wordcount]. Word count will differ from words.length if any of the individual inserts failed. Unlikely. 
async function importWordList(words, callback) {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(`DELETE FROM ${tableName}`);

        const stmt = db.prepare(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`);

        let counter = 0;
        for (const word of words) {
            stmt.run(word.toLowerCase().trim(), (err) => {
                if (err) {
                    console.error('Error inserting row:', err.message);
                } else {
                    counter++;
                }
            });
        }

        stmt.finalize();

        db.run("COMMIT", (err) => {
            if (err) {
                console.error('Error committing transaction:', err.message);
                callback(err, null);
            } else {
                console.log('All inserts completed successfully');
                callback(null, counter);
            }
        });
    });
}