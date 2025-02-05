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
        console.log(`Create new ${this.name}`);

        try {
            const puzzle = await this.createPuzzle();
            res.status(200).json({ puzzle: puzzle });
        } catch (error) {
            console.error("Failed to create puzzle:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async savePuzzleEndpoint(req, res) {
        const data = req.body;

        if (data.puzzle.id === undefined) {
            return res.status(400).json({ message: `Puzzle data missing an ID` });
        }

        console.log(`Save puzzle ${data.puzzle.id} in ${this.name}`);

        try {
            const puzzle = await this.savePuzzle(data.puzzle);
            res.status(200).json({ puzzle: puzzle });
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

        // Get update date
        const today = new Date();

        return await dbGet(`
            UPDATE ${this.tableName} SET 
                    title = ?,
                    author = ?,
                    letters = ?,
                    status = ?,
                    updated = ?
                WHERE id = ?
                RETURNING *
        `, [puzzle.title, puzzle.author, puzzle.letters, puzzle.status, today.toJSON(), puzzle.id]);
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

    async createPuzzle() {
        console.log(`Create new ${this.name}`);

        // Get creation/update date
        const today = new Date();

        return await dbGet(`
            INSERT INTO ${this.tableName} (title, author, letters, status, created, updated) 
                VALUES (
                    CONCAT('${PUZZLE_NAME}', ' #', COALESCE((SELECT MAX(id) FROM ${this.tableName}), 0) + 1, ' - ', ?),
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
            '',                                 // No letters 
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