const { db, dbGet } = require('./database');

class WordListEndpoint {
    constructor(name, tableName) {
        this.name = name;
        this.tableName = tableName;
    }

    async match(req, res) {
        const word = req.params.word;
        console.debug(`Searching for match: '${word}'`);

        try {
            const exists = await this.matchWord(word);
            return res.json({ word: word, exists: exists });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async partialMatch(req, res) {
        const letters = req.params.letters;
        console.debug(`Search for partial match: '${letters}'`);

        try {
            const exists = await this.matchPartialWord(letters);
            return res.json({ letters: letters, exists: exists });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async info(req, res) {
        console.debug(`Get dictionary info`);

        try {
            const count = await this.wordCount();
            res.json({ name: this.name, wordCount: count });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async upload(req, res) {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        let uploadedFile = req.files.file;
        console.debug(`Importing words from: ${uploadedFile.name}`);

        const data = uploadedFile.data;
        const words = data.toString('utf8').split(/\s+/).filter(word => word.length > 0 && /^[a-zA-Z]*$/.test(word));

        if (words === undefined || words.length == 0) {
            throw new Error('File does not contain a word list');
        }

        try {
            const count = await this.importWordList(words);
            res.status(200).json({ status: "Complete", words: words.length, imported: count });
        } catch (err) {
            res.status(500).json({ message: 'An error occurred', error: err.message });
        }
    }

    async matchWord(word) {
        console.debug(`Searching for ${word} in the dictionary`);
        const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM ${this.tableName} WHERE word = ?) AS exists_flag`, [word]);
        return row.exists_flag === 1;
    }

    async matchPartialWord(letters) {
        console.debug(`Searching for ${letters}.* in the dictionary`);
        const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM ${this.tableName} WHERE word LIKE ?) AS exists_flag`, [`${letters}%`]);
        return row.exists_flag === 1;
    }

    async wordCount() {
        console.debug(`Getting the word count of the dictionary`);
        const row = await dbGet(`SELECT COUNT(word) AS count FROM ${this.tableName}`, []);
        return row.count;
    }

    async importWordList(words) {
        // Whereas many of the other methods use promisified db methods, that doesn't really work here due
        // to the serialized calls, so manually construct a single promise instead
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run(`DELETE FROM ${this.tableName}`);
                const stmt = db.prepare(`INSERT OR IGNORE INTO ${this.tableName} (word) VALUES (?)`);

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
}

// Declare the individual word lists
const dictionaryWordEndpoints = new WordListEndpoint('dictionary', 'dictionaryWordList');
const bonusWordEndpoints = new WordListEndpoint('bonusWords', 'bonusWordList');
const excludedWordEndpoints = new WordListEndpoint('excludedWords', 'excludedWordList');

module.exports = { dictionaryWordEndpoints, bonusWordEndpoints, excludedWordEndpoints };