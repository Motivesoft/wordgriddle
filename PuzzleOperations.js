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
        const size = req.params.size;
        console.log(`Create new ${this.name} of size ${size}x${size}`);

        try {
            const puzzle = await this.createPuzzle(size);
            res.status(200).json({ puzzle: puzzle });
        } catch (error) {
            console.error("Failed to create puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async savePuzzleEndpoint(req, res) {
        const data = req.body;
        const puzzle = data.puzzle;

        if (puzzle.id === undefined) {
            return res.status(400).json({ message: `Puzzle data missing an ID` });
        }

        if ((puzzle.size * puzzle.size) != puzzle.letters.length) {
            return res.status(400).json({ message: `Size does not match number of letters` });
        }

        console.log(`Save puzzle ${puzzle.id} in ${this.name}`);

        try {
            const savedPuzzle = await this.savePuzzle(puzzle);
            res.status(200).json({ puzzle: savedPuzzle });
        } catch (error) {
            console.error("Failed to save puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
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

    // Update certain metadata items (title, author, letters, maybe more in future)
    async savePuzzle(puzzle) {
        console.log(`Save #${puzzle.id} in ${this.name}`);

        if (puzzle === undefined || puzzle.id === undefined) {
            throw new Error("Missing or unsaved puzzle data");
        }

        if ((puzzle.size * puzzle.size) != puzzle.letters.length) {
            throw new Error("Size does not match number of letters");
        }

        // Get update date
        const today = new Date();

        return await dbGet(`
            UPDATE ${this.tableName} SET 
                    title = ?,
                    author = ?,
                    size = ?,
                    letters = ?,
                    status = ?,
                    updated = ?
                WHERE id = ?
                RETURNING *
        `, [puzzle.title, puzzle.author, puzzle.size, puzzle.letters, puzzle.status, today.toJSON(), puzzle.id]);
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

    async createPuzzle(size) {
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
            0,                                  // Default author 
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