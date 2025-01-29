const db = require('./database');
const util = require('util');

// Promisify db.get and db.run
const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));

exports.match = async (req, res) => {
    const word = req.params.word;
    console.debug(`Calling /api/dictionary/match/${word}`);

    try {
        const result = await matchWord(word);
        return res.json({ word: word, exists: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.partialMatch = async (req, res) => {
    const letters = req.params.letters;
    console.debug(`Calling /api/dictionary/partial/${letters}`);

    try {
        const result = await matchPartialWord(letters);
        return res.json({ letters: letters, exists: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.info = async (req, res) => {
    console.debug(`Get dictionary info`);
    const query = `SELECT COUNT(word) AS count FROM dictionaryWordList`;

    try {
        const row = await dbGet(query, []);
        res.json({ words: row.count });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.upload = async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let uploadedFile = req.files.file;
    console.debug(`Importing words from ${uploadedFile.name}`);

    const data = uploadedFile.data;
    const words = data.toString('utf8').split(/\s+/).filter(word => word.length > 0 && /^[a-zA-Z]*$/.test(word));

    if (words === undefined || words.length == 0) {
        throw new Error('File does not contain a word list');
    }

    try {
        const count = await importWordList(words);
        res.status(200).json({ status: "Complete", words: words.length, imported: count });
    } catch (err) {
        res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};

async function matchWord(word) {
    console.debug(`Searching for ${word} in the dictionary`);
    const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM dictionaryWordList WHERE word = ?) AS exists_flag`, [word]);
    return row.exists_flag === 1;
}

async function matchPartialWord(letters) {
    console.debug(`Searching for ${letters}.* in the dictionary`);
    const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM dictionaryWordList WHERE word LIKE ?) AS exists_flag`, [`${letters}%`]);
    return row.exists_flag === 1;
}

async function importWordList(words) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run(`DELETE FROM dictionaryWordList`);
            const stmt = db.prepare(`INSERT OR IGNORE INTO dictionaryWordList (word) VALUES (?)`);

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
                    reject(err);
                } else {
                    console.log('All inserts completed successfully');
                    resolve(counter);
                }
            });
        });
    });
}
