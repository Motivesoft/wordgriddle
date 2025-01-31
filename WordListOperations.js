const { db, dbAll, dbGet } = require('./database');

const CONTENT_TYPE_APPLICATION_JSON = "application/json";
const CONTENT_TYPE_TEXT_PLAIN = "text/plain";

class WordListOperations {
    constructor(name, tableName) {
        this.name = name;
        this.tableName = tableName;
    }

    // Endpoints

    async addWords(req, res) {
        const contentType = req.headers['content-type'] || CONTENT_TYPE_TEXT_PLAIN;

        console.debug(`Add words to ${this.name} using ${contentType} list`);

        // Allow json or plain text
        let words = [];
        if (contentType === CONTENT_TYPE_APPLICATION_JSON) {
            words = req.body.words;
        } else if (contentType === CONTENT_TYPE_TEXT_PLAIN) {
            words = req.body.split('\n').filter(word => word.trim() !== '');
        } else {
            return res.status(400).json({ message: `Only ${CONTENT_TYPE_TEXT_PLAIN} and ${CONTENT_TYPE_APPLICATION_JSON} are supported` });
        }

        if (words.length === 0) {
            return res.status(400).json({ message: 'No words were provided.' });
        }

        try {
            const count = await this.insertWords(words);
            res.status(200).json({ status: "complete", wordCount: words.length, processedCount: count });
        } catch (error) {
            console.error("Failed to insert words:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async removeWords(req, res) {
        const contentType = req.headers['content-type'] || CONTENT_TYPE_TEXT_PLAIN;

        console.debug(`Remove words from ${this.name} using ${contentType} list`);

        // Allow json or plain text
        let words = [];
        if (contentType === CONTENT_TYPE_APPLICATION_JSON) {
            words = req.body.words;
        } else if (contentType === CONTENT_TYPE_TEXT_PLAIN) {
            words = req.body.split('\n').filter(word => word.trim() !== '');
        } else {
            return res.status(400).json({ message: `Only ${CONTENT_TYPE_TEXT_PLAIN} and ${CONTENT_TYPE_APPLICATION_JSON} are supported` });
        }

        if (words.length === 0) {
            return res.status(400).json({ message: 'No words were provided.' });
        }

        try {
            const count = await this.deleteWords(words);
            res.status(200).json({ status: "complete", wordCount: words.length, processedCount: count });
        } catch (error) {
            console.error("Failed to delete words:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

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

    async getWordList(req, res) {
        console.debug(`Get ${this.name} list`);

        try {
            const words = await this.getWords();
            res.json({ words: words, wordCount: words.length });
        } catch (error) {
            console.error("Failed to get word list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async upload(req, res) {
            // Allow text (default) or JSON upload
            if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }

        let uploadedFile = req.files.file;
        console.debug(`Uploading ${this.name} words from: ${uploadedFile.name} (${uploadedFile.mimetype})`);

        const fileData = uploadedFile.data;
        if (fileData === undefined) {
            return res.status(400).json({ message: 'No data was uploaded.' });
        }

        const data = fileData.toString('utf8');
        const mimetype = uploadedFile.mimetype || CONTENT_TYPE_TEXT_PLAIN;

        let words = [];
        if (mimetype === CONTENT_TYPE_APPLICATION_JSON) {
            const parsedData = JSON.parse(data);

            words = parsedData.words;
            if (words.length !== parsedData.count) {
                // Report the difference, but continue anyway - effectively, we ignore the 'count' here
                console.log(`Uploaded word list does not have expected number of words:- ${words.length} instead of ${parsedData.count}`);
            }
        } else { 
            // Handle as 'plain/txt'
            words = data.split(/\s+/).filter(word => word.length > 0 && /^[a-zA-Z]*$/.test(word));
        }

        if (words === undefined || words.length == 0) {
            return res.status(400).json({ message: 'File does not appear to contain a word list.' });
        }

        try {
            const count = await this.replaceAllWords(words);
            res.status(200).json({ status: "complete", wordCount: words.length, processedCount: count });
        } catch (error) {
            console.error("Failed to upload word list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async download(req, res) {
        try {
            // Allow text (default) or JSON download
            const acceptHeader = req.headers['accept'] || CONTENT_TYPE_TEXT_PLAIN;

            console.log(`Downloading ${this.name} words as '${acceptHeader}'`);

            // Get database content as a word array
            const words = await this.getWords();

            // Work out whether text or JSON download and set headers for file download
            if (acceptHeader === CONTENT_TYPE_APPLICATION_JSON) {
                res.setHeader('Content-Disposition', `attachment; filename="${this.tableName}.json"`);
                res.setHeader('Content-Type', CONTENT_TYPE_APPLICATION_JSON);
                res.send(JSON.stringify({ count: words.length, words: words }));
            } else { 
                // Handle as 'plain/text'
                res.setHeader('Content-Disposition', `attachment; filename="${this.tableName}.txt"`);
                res.setHeader('Content-Type', CONTENT_TYPE_TEXT_PLAIN);
                res.send(words.join('\n'));
            }
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

    async getWords() {
        console.debug(`Getting all the words from ${this.name}`);

        // Execute the query and transform the result into a string array
        const rows = await dbAll(`SELECT word FROM ${this.tableName} ORDER BY LENGTH(word), word ASC`);
        const content = rows.map(row => row.word);
        return content;
    }

    async deleteWords(words) {
        if (words === undefined) {
            throw new Error("Missing input");
        }

        console.debug(`Deleting ${words.length} words from ${this.name}`);

        // Whereas many of the other methods use promisified db methods, that doesn't really work here due
        // to the serialized calls, so manually construct a single promise instead

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE word = ?`);

                let counter = 0;
                for (const word of words) {
                    stmt.run(word.toLowerCase().trim(), (err) => {
                        if (err) {
                            console.error('Error deleting row:', err.message);
                        } else {
                            counter++;
                        }
                    });
                }

                stmt.finalize();

                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error('Error committing transaction:', err.message);

                        // If the commit fails, roll back
                        db.run("ROLLBACK", (rollbackError) => {
                            if (rollbackError) {
                                console.error('Error rolling back transaction:', rollbackError.message);
                            }

                            reject(err);
                        });
                    } else {
                        console.log('All deletes completed successfully');
                        resolve(counter);
                    }
                });
            });
        });
    }

    async insertWords(words) {
        if (words === undefined) {
            throw new Error("Missing input");
        }

        console.debug(`Inserting ${words.length} words into ${this.name}`);

        // Whereas many of the other methods use promisified db methods, that doesn't really work here due
        // to the serialized calls, so manually construct a single promise instead

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
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

                        // If the commit fails, roll back
                        db.run("ROLLBACK", (rollbackError) => {
                            if (rollbackError) {
                                console.error('Error rolling back transaction:', rollbackError.message);
                            }

                            reject(err);
                        });
                    } else {
                        console.log('All inserts completed successfully');
                        resolve(counter);
                    }
                });
            });
        });
    }

    async replaceAllWords(words) {
        if (words === undefined) {
            throw new Error("Missing input");
        }

        console.debug(`Replacing ${this.name} with ${words.length} words`);

        // Whereas many of the other methods use promisified db methods, that doesn't really work here due
        // to the serialized calls, so manually construct a single promise instead

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Delete existing data
                db.run(`DELETE FROM ${this.tableName}`);

                // Insert new data using a prepared statement for performance
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

                // Finalise the transaction and commit - with explicit rollback in the event of an error
                stmt.finalize();

                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error('Error committing transaction:', err.message);

                        // If the commit fails, roll back
                        db.run("ROLLBACK", (rollbackError) => {
                            if (rollbackError) {
                                console.error('Error rolling back transaction:', rollbackError.message);
                            }

                            reject(err);
                        });
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
const dictionaryWordOperations = new WordListOperations('Dictionary Words', 'dictionaryWords');
const bonusWordOperations = new WordListOperations('Bonus Words', 'bonusWords');
const excludedWordOperations = new WordListOperations('Excluded Words', 'excludedWords');

module.exports = { dictionaryWordOperations, bonusWordOperations, excludedWordOperations };