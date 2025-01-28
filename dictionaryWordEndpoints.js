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
        const exists = matchWord(word);

        return res.json({ word: word, exists: exists });
    } catch (error) {
        console.error('Error executing query:', error);

        res.status(500).json({ error: error.message });
    }
}

function matchWord(word) {
    {
        
        try {
            const stmt = db.prepare('SELECT word FROM dictionaryWordList');
            const rows = stmt.all();

            rows.forEach(row => {
                console.log(row.word);
            });
        } catch (error) {
            console.error('Error reading words:', error.message);
        } finally {
            db.close();
        }

    }
    try {
        const stt = db.prepare('SELECT * FROM dictionaryWordList');
        const rows = stt.all();

        rows.forEach(row => {
            console.log(row.word);
        });

        // Prepare the SQL statement
        const stmt = db.prepare(`SELECT COUNT(word) as count FROM ${tableName} WHERE word = ?`);

        // Execute the query and get the result
        const result = stmt.get(word.toLowerCase().trim());

        const s = db.prepare(`SELECT COUNT(word) AS count FROM ${tableName}`);
        const x = s.get();
        console.log(`Count=${x.count}`);

        // Check if the count is greater than 0
        return result.count > 0;
    } catch (error) {
        console.error('Error checking word:', error.message);
        return false;
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

    // Upload the file to a temp folder and then import it
    let uploadedFile = req.files.file;
    let uploadPath = path.join(os.tmpdir(), uploadedFile.name);

    uploadedFile.mv(uploadPath, async (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        try {
            console.debug(`Importing words from ${uploadedFile.name}`);

            const words = await getWordListFromFile(uploadPath);
            const results = await importWordList(words);

            res.json(results);
        } catch (error) {
            console.log('Error importing file');

            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    });
}

async function getWordListFromFile(uploadPath) {
    try {
        const data = await fs.readFile(uploadPath, 'utf8');
        const words = data.split(/\s+/).filter(word => word.length > 0);

        if (words === undefined || words.length == 0) {
            throw new Error('File does not contain a word list');
        }

        return words;
    } catch (error) {
        console.error('Error importing from word list file:', error);
        throw error;
    }
}

async function importWordList(words) {
    // Import the word list, replacing the current contents, as a transaction
    try {
        // Start a transaction
        // Strictly speaking, we could do this after we've read the file, but that gets messy in the error handler
        await db.run('BEGIN TRANSACTION');

        // Delete all existing rows
        await db.run(`DELETE FROM ${tableName}`);

        const stmt = await db.prepare(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`);

        for (const word of words) {
            await stmt.run(word.toLowerCase().trim());
        }

        await stmt.finalize();
        await db.run('COMMIT');

        return { message: `Import complete`, count: words.length, success: true };
    } catch (error) {
        console.error('Error:', error);

        await db.run('ROLLBACK');
        throw error;
    }
}