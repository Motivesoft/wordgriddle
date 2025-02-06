// External requires

// Internal requires
const { dbAll, dbGet } = require('./database');

const PUZZLE_NAME = "wordgriddle";

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

    async createPuzzleEndpoint(req, res) {
        const contentType = req.headers['content-type'];

        if (contentType !== 'application/json') {
            return res.status(400).json({ message: `Missing arguments for creating a new puzzle` });
        }

        const size = req.body.size;
        const author = req.body.author;
        console.log(`Create new ${this.name} of size ${size}x${size}`);

        try {
            const puzzle = await this.createPuzzle(size, author);
            res.status(200).json({ puzzle: puzzle });
        } catch (error) {
            console.error("Failed to create puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async updatePuzzleLettersEndpoint(req, res) {
        const id = req.params.id;
        const data = req.body;

        console.log(`Update letters for #${id} on ${this.name}`);

        const puzzle = await this.getPuzzle(id);

        if (puzzle === undefined) {
            console.log("skipping length check");
            //return res.status(400).json({ message: `Puzzle ID not recognised` });
        }

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

    // Other methods

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
            '-'.repeat(size*size),              // Letter grid, where '-' means unknown 
            1,                                  // Default status 
            today.toJSON(),                     // Created 
            today.toJSON()                      // Last updated
        ]);
    }
}

// Declare the instances
const editablePuzzleOperations = new PuzzleOperations("Editable Puzzles", "editablePuzzles", false);
const publishedPuzzleOperations = new PuzzleOperations("Published Puzzles", "publishedPuzzles", true);

module.exports = { editablePuzzleOperations, publishedPuzzleOperations };