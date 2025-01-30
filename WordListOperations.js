const { db, dbAll, dbGet } = require('./database');

class WordListOperations {
    constructor(name, tableName) {
        this.name = name;
        this.tableName = tableName;
    }

    // Endpoints

    async validateWord(req, res) {
        const word = req.params.word;
        console.debug(`Searching for ${this.name} match: '${word}'`);

        try {
            const exists = await this.findWord(word);
            return res.json({ word: word, exists: exists });
        } catch (error) {
            console.error("Failed to validate word:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async validateWordPrefix(req, res) {
        const letters = req.params.letters;
        console.debug(`Search for ${this.name} partial match: '${letters}'`);

        try {
            const exists = await this.findWordPrefix(letters);
            return res.json({ letters: letters, exists: exists });
        } catch (error) {
            console.error("Failed to validate word prefix:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async getInformation(req, res) {
        console.debug(`Get ${this.name} info`);

        try {
            const count = await this.getWordCount();
            res.json({ name: this.name, wordCount: count });
        } catch (error) {
            console.error("Failed to get information:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async upload(req, res) {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({message:'No files were uploaded.'});
        }

        let uploadedFile = req.files.file;
        console.debug(`Uploading ${this.name} words from: ${uploadedFile.name}`);

        const data = uploadedFile.data;
        const words = data.toString('utf8').split(/\s+/).filter(word => word.length > 0 && /^[a-zA-Z]*$/.test(word));

        if (words === undefined || words.length == 0) {
            return res.status(400).json({ message: 'File does not appear to contain a word list.' });
        }

        try {
            const count = await this.replaceWordList(words);
            res.status(200).json({ status: "complete", uploadedCount: words.length, importedCount: count });
        } catch (error) {
            console.error("Failed to upload word list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async download(req, res) {
        try {
            // Generate database content as text
            const words = await this.getWordList();

            // Allow text/plain or JSON download
            const acceptHeader = req.headers['accept'];
            console.log(`AcceptHeader: ${acceptHeader}`);

            if (acceptHeader === 'text/plain') {
                console.log(">text/plain");
                res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Disposition': `attachment; filename="${this.tableName}.txt"` });
                res.end(words.join('\n'));
            } else {
                console.log(">application/json");
                res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${this.tableName}.json"`  });
                res.end(JSON.stringify({words: words}));
            }
 
            // Set headers for file download
            // res.setHeader('Content-Disposition', `attachment; filename="${this.tableName}.txt"`);
            // res.setHeader('Content-Type', 'text/plain');
     
            // Send the database content as the response
            // res.send(words);
        } catch (error) {
            console.error("Failed to download word list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    async findWord(word) {
        if (word === undefined || word.length === 0) {
            throw new Error("Missing input");
        }

        console.debug(`Searching for ${word} in ${this.name}`);

        const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM ${this.tableName} WHERE word = ?) AS exists_flag`, [word]);
        return row.exists_flag === 1;
    }

    async findWordPrefix(letters) {
        if (letters === undefined || letters.length === 0) {
            throw new Error("Missing input");
        }

        console.debug(`Searching for ${letters}.* in ${this.name}`);

        const row = await dbGet(`SELECT EXISTS (SELECT 1 FROM ${this.tableName} WHERE word LIKE ?) AS exists_flag`, [`${letters}%`]);
        return row.exists_flag === 1;
    }

    async getWordCount() {
        console.debug(`Getting the word count of ${this.name}`);

        const row = await dbGet(`SELECT COUNT(word) AS count FROM ${this.tableName}`, []);
        return row.count;
    }

    async replaceWordList(words) {
        if (words === undefined) {
            throw new Error("Missing input");
        }

        console.debug(`Replacing ${this.name} with ${words.length} words`);

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

    async getWordList() {
        console.debug(`Getting all the words from ${this.name}`);

        // Execute the query and transform the result into a string array
        const rows = await dbAll(`SELECT word FROM ${this.tableName} ORDER BY LENGTH(word), word ASC`);
        const content = rows.map(row => row.word);
        return content;
    }
}

// Declare the individual word lists
const dictionaryWordOperations = new WordListOperations('Dictionary Words', 'dictionaryWordList');
const bonusWordOperations = new WordListOperations('Bonus Words', 'bonusWordList');
const excludedWordOperations = new WordListOperations('Excluded Words', 'excludedWordList');

module.exports = { dictionaryWordOperations, bonusWordOperations, excludedWordOperations };