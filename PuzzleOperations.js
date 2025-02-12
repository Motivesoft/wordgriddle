// External requires

// Internal requires
const { db, dbAll, dbGet } = require('./database');
const { dictionaryWordOperations, bonusWordOperations, excludedWordOperations } = require('./WordListOperations');

const PUZZLE_NAME = "wordgriddle";

// Inner class to help with dictionary full and partial lookups
class DictionaryLookupHelper
{
    constructor() {
        this.longestWordLength = 0;
        this.dictionary = new Set();
        this.prefixes = new Set();
    }

    addWordList(list) {
        list.forEach((word) => {
            // Track all the words
            this.dictionary.add(word);

            // Track the longest word
            if (word.length > this.longestWordLength) {
                this.longestWordLength = word.length;
            }

            // Track all the word fragments
            while (word.length) {
                this.prefixes.add(word);
                word = word.slice(0,word.length-1);
            }
        });
    }

    lookup(word) {
        return this.dictionary.has(word);
    }

    lookupPrefix(letters) {
        return this.prefixes.has(letters);
    }
}

class PuzzleOperations {
    // Parameters:
    // - readable name for log statements etc
    // - database table name (e.g. designer or published)
    // - whether the table is for published puzzles only
    constructor(name, tableName, published) {
        this.name = name;
        this.tableName = tableName;
        this.published = published;
    }

    // Endpoints

    // Download all puzzles as a JSON object - a backup operation
    async downloadEndpoint(req, res) {
        // This code, right now, is ostensibly the same as the getPuzzles endpoint but that might not
        // always be the case as we get more into status management
        try {
            console.log(`Download puzzle list from ${this.name}`);

            const puzzles = await this.getPuzzles();
            res.status(200).json({ puzzleCount: puzzles.length, puzzles: puzzles });
        } catch (error) {
            console.error("Failed to get puzzle list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Upload puzzles in JSON as a replacement to the current contents - a restore operation
    async uploadEndpoint(req, res) {
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
        if (data.length === 0) {
            return res.status(400).json({ message: 'File does not appear to contain a word list.' });
        }

        const mimetype = uploadedFile.mimetype;
        if (mimetype !== 'application/json') {
            return res.status(400).json({ message: 'File does not appear to be of the correct format.' });
        }

        const parsedData = JSON.parse(data);
        const puzzles = parsedData.puzzles;

        if (puzzles.length !== parsedData.puzzleCount) {
            // Report the difference, but continue anyway - effectively, we ignore the 'count' here
            console.log(`Uploaded puzzle list does not have expected number of puzzles: ${puzzles.length} instead of ${parsedData.count}`);
        }

        if (puzzles === undefined || puzzles.length == 0) {
            return res.status(400).json({ message: 'File does not appear to contain a list of puzzles.' });
        }

        try {
            const count = await this.replacePuzzles(puzzles);
            res.status(200).json({ status: "complete", puzzleCount: puzzles.length, processedCount: count });
        } catch (error) {
            console.error("Failed to upload puzzle list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async getPuzzlesEndpoint(req, res) {
        try {
            console.log(`Get puzzle list from ${this.name}`);

            const puzzles = await this.getPuzzles();
            res.status(200).json({ puzzleCount: puzzles.length, puzzles: puzzles });
        } catch (error) {
            console.error("Failed to get puzzle list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async getPuzzleEndpoint(req, res) {
        try {
            const id = req.params.id;
            console.log(`Get #${id} from ${this.name}`);

            const puzzle = await this.getPuzzle(id);

            if (puzzle === undefined) {
                return res.status(400).json({ message: `No ${this.name} entry exists with this ID` });
            }

            res.status(200).json({ puzzle: puzzle });
        } catch (error) {
            console.error("Failed to get puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Given a size and an author ID in the application/json request body, create a new puzzle
    async createPuzzleEndpoint(req, res) {
        const contentType = req.headers['content-type'];

        const size = req.body.size;
        const author = req.body.author;

        if (size === undefined || author === undefined) {
            return res.status(400).json({ message: `Missing arguments for creating a new puzzle` });
        }

        try {
            const puzzle = await this.createPuzzle(size, author);
            res.status(200).json({ puzzle: puzzle });
        } catch (error) {
            console.error("Failed to create puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Given the puzzle ID as a param, and a letters object as an application/json request body, update the letters field in a puzzle
    async updatePuzzleLettersEndpoint(req, res) {
        const id = req.params.id;
        const data = req.body;

        console.log(`Update letters for #${id} on ${this.name}`);

        try {
            const savedPuzzle = await this.updatePuzzleLetters(id, data.letters);

            if (savedPuzzle === undefined) {
                return res.status(400).json({ message: `Puzzle ID not recognised` });
            }

            res.status(200).json({ puzzle: savedPuzzle });
        } catch (error) {
            console.error("Failed to update puzzle:", error.message);

            // Error 19 is 'failed database constraint' - this is a user error (4xx), not a system one (5xx)
            if (error.errno === 19) {
                res.status(400).json({ message: `Length of 'letters' inconsistent with puzzle size` });
            } else {
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        }
    }

    async solvePuzzleEndpoint(req, res) {
        try {
            const letters = req.params.letters;
            console.log(`Solve puzzle with '${letters}' from ${this.name}`);

            const wordLists = await this.solvePuzzle(letters);
            const wordCount = wordLists.required.length + wordLists.bonus.length + wordLists.excluded.length;

            res.status(200).json({ wordCount, wordLists });
        } catch (error) {
            console.error("Failed to get puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    // Replace the entire contents with the provided puzzles
    async replacePuzzles(puzzles) {
        if (puzzles === undefined) {
            throw new Error("Missing input");
        }

        console.debug(`Replacing ${this.name} with ${puzzles.length} puzzles`);

        // Whereas many of the other methods use promisified db methods, that doesn't really work here due
        // to the serialized calls, so manually construct a single promise instead

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Delete existing data
                db.run(`DELETE FROM ${this.tableName}`);

                // Insert new data using a prepared statement for performance
                const stmt = db.prepare(`INSERT OR IGNORE INTO ${this.tableName} 
                        (id, title, author, size, letters, status, created, updated)
                    VALUES 
                        (?, ?, ?, ?, ?, ?, ?, ?)`);

                let counter = 0;
                for (const puzzle of puzzles) {
                    stmt.run([puzzle.id, puzzle.title, puzzle.author, puzzle.size, puzzle.letters, puzzle.status, puzzle.created, puzzle.updated], (err) => {
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

    // Return all puzzles in this table
    async getPuzzles() {
        console.debug(`List of all ${this.name}`);

        // Execute the query and transform the result into an array
        return await dbAll(`SELECT * FROM ${this.tableName}`, []);
    }

    // Return a specific puzzle
    async getPuzzle(id) {
        console.log(`Get #${id} from ${this.name}`);

        return await dbGet(`
            SELECT * from ${this.tableName} 
                WHERE id = ?
        `, [id]);
    }

    // Update the letters for a puzzle
    // There is a database constraint on the letters field to match sure it is of the right length
    // and will fail this update if not. 
    // It would be good to prevent this issue by checking the value beforehand but if an exception is
    // thrown for this, it will have an 'errno' of 19 (constraint failed)
    // If no rows is updated ('id' unknown), then the return from this call will be 'undefined'.  
    async updatePuzzleLetters(id, letters) {
        console.log(`Update the letters for #${id} in ${this.name}`);

        if (id === undefined || letters === undefined) {
            throw new Error("Missing data");
        }

        // Get update date
        const today = new Date();

        return await dbGet(`
            UPDATE ${this.tableName} SET 
                    letters = ?,
                    updated = ?
                WHERE id = ?
                RETURNING *
        `, [letters, today.toJSON(), id]);
    }

    async changePuzzleStatus(id, status) {
        console.log(`Change status of #${id} in ${this.name}`);

        // Get update date
        const today = new Date();

        return await dbGet(`
            UPDATE ${this.tableName} SET 
                    status = ?,
                    updated = ?
                WHERE id = ?
                RETURNING *
        `, [status, today.toJSON(), id]);
    }

    async createPuzzle(size, author) {
        console.log(`Create new ${this.name}`);

        // Get creation/update date
        const today = new Date();

        return await dbGet(`
            INSERT INTO ${this.tableName} (title, author, size, letters, status, created, updated) 
                VALUES (
                    CONCAT('${PUZZLE_NAME}', ' #', COALESCE((SELECT MAX(id) FROM ${this.tableName}), 0) + 1, ' - ', ?),
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                RETURNING *
        `, [
            today.toISOString().slice(0, 10),   // Creation date in short form
            author,                             // Default author 
            size,                               // Grid size (for any edge, remembering that these are square)
            '-'.repeat(size * size),              // Letter grid, where '-' means unknown 
            1,                                  // Default status 
            today.toJSON(),                     // Created 
            today.toJSON()                      // Last updated
        ]);
    }

    // Assumes 'letters' is the correct length, and using '.' for empty squares
    async solvePuzzle(letters) {
        console.log(`Solve puzzle for ${letters}`);

        // Make a 2D grid of the letters
        let size = Math.sqrt(letters.length);
        let index = 0;
        let grid = [];
        for (let i = 0; i < size; i++) {
            let row = [];
            for (let j = 0; j < size; j++) {
                const letter = letters[index++];
                row.push(letter);
            }
            grid.push(row);
        }

        const allWords = await this.findInGrid(grid);

        const allBonusWords = await bonusWordOperations.getWords();
        const allExcludedWords = await excludedWordOperations.getWords();

        // Now sort the found words into required, bonus and excluded
        let requiredWords = [];
        let bonusWords = [];
        let excludedWords = [];

        allWords.forEach( ([word,path])=>{
            if (allExcludedWords.includes(word)) {
                excludedWords.push([word,path]);
            } else if( allBonusWords.includes(word)) {
                bonusWords.push([word,path]);
            } else {
                requiredWords.push([word,path]);
            }
        })

        return {required: requiredWords, bonus: bonusWords, excluded: excludedWords};
    }

    async findInGrid(grid) {
        const wordsFound = new Array();

        // Create an object that will help us search the dictionary, but without passing the
        // dictionary through the call stack
        //
        // As new excluded words can be 'created' at a faster rate than dictionaries can be created
        // and as some dictionaries don't carry what we would think of as excluded words, make a 
        // composite list of all the words we know about for this word search
        const lookupHelper = new DictionaryLookupHelper();
        lookupHelper.addWordList( await dictionaryWordOperations.getWords() );
        lookupHelper.addWordList( await bonusWordOperations.getWords() );
        lookupHelper.addWordList( await excludedWordOperations.getWords() );

        // Iterate over the grid, letter by letter, and find words from each one
        for (var rowIndex = 0; rowIndex < grid.length; rowIndex++) {
            for (var columnIndex = 0; columnIndex < grid[rowIndex].length; columnIndex++) {
                await this.findWordsFromPosition(grid, rowIndex, columnIndex, wordsFound, new Set(), "", lookupHelper);
            }
        }

        //Sort the found words array by length and alphabetical within that
        const sorted = wordsFound.sort((a, b) => {
            const itemA = a[0];
            const itemB = b[0];
            if (itemA.length === itemB.length) {
                return itemA.localeCompare(itemB);
            }
            return itemA.length - itemB.length;
        });

        // Find all duplicated words (same word found by different path) and simplify down to one (randomly)
        const deDupArray = new Array();
        var index = 0;
        while (index < wordsFound.length) {
            const [word, path] = wordsFound[index];
            var lookAhead = index;
            while (lookAhead < wordsFound.length - 1) {
                const [nextWord, nextPath] = wordsFound[lookAhead + 1];
                if (word !== nextWord) {
                    break;
                }

                lookAhead++;
            }

            if (lookAhead === index) {
                // No duplicates - simply add it to the list
                deDupArray.push([word, path]);
            } else {
                // Multiple ways to spell this word.
                const matches = lookAhead - index + 1;

                // Eliminate all but one of the ways
                // Randomise the one we choose (e.g. 4 matches means get a random number between 0-3 and add it to index)
                const elementToKeep = index + Math.floor(Math.random() * (matches));

                // Add the chosen one to the list
                deDupArray.push(wordsFound[elementToKeep]);

                // Move past the matching words
                index = lookAhead;
            }

            // Move on to the next word
            index++;
        }

        return deDupArray;
    }
    
    // Using grid(rowIndex,columnIndex), search for words
    // Call this recursively, building visited and currentWord as we go
    // Add found words to a set as we may find duplicates
    async findWordsFromPosition(grid, row, col, wordsFound, visitedCoordinates, currentWord, lookupHelper) {
        // Bounds checking
        if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) {
            return;
        }

        // Create a string representation of row and column to act as a unique coordinate
        // Wrap the values in a string that makes them easy to match later - e.g. so the web page
        // can generate its own coordinate and look for it in a list associated with the puzzle in play
        //const coordinate = `[${row}x${col}]`;
        const index = (row * grid[row].length) + col;
        const coordinate = `[${index}]`;

        // Don't loop back over ourselves
        if (visitedCoordinates.has(coordinate)) {
            return;
        }

        // Get the letter we've just landed on
        const currentLetter = grid[row][col];

        // Blank, dash or dot signifies missing letter - nothing to see here
        if ([' ', '.', '-'].includes(currentLetter)) {
            return;
        }

        // Remember we've been here as part of the current word
        visitedCoordinates.add(coordinate);

        currentWord += currentLetter.toLowerCase();

        if (currentWord.length >= 4 && lookupHelper.lookup(currentWord)) {
            // Coords are wrapped (above), so don't need any other separator
            const path = Array.from(visitedCoordinates).join('');

            // Store the word and the path taken to form it
            // We will prune duplicate words (with different paths) later
            wordsFound.push([currentWord, path]);
        }

        // Constrain the algorithm to avoid creating words that are too long
        if (lookupHelper.lookupPrefix(currentWord) && currentWord.length < lookupHelper.longestWordLength) {
            // Cross
            await this.findWordsFromPosition(grid, row - 1, col, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row + 1, col, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row, col - 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row, col + 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);

            // Diagonal
            await this.findWordsFromPosition(grid, row - 1, col - 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row - 1, col + 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row + 1, col - 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);
            await this.findWordsFromPosition(grid, row + 1, col + 1, wordsFound, visitedCoordinates, currentWord, lookupHelper);
        }

        visitedCoordinates.delete(coordinate);
    }
}

// Declare the instances
const editablePuzzleOperations = new PuzzleOperations("Editable Puzzles", "editablePuzzles", false);
const publishedPuzzleOperations = new PuzzleOperations("Published Puzzles", "publishedPuzzles", true);

module.exports = { editablePuzzleOperations, publishedPuzzleOperations };