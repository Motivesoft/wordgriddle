const { db, dbAll, dbGet } = require('./database');

const PUZZLE_LABEL_PREFIX = "wordgriddle #";
const PUZZLE_LABEL_MIDDLE = "(";
const PUZZLE_LABEL_SUFFIX = ")";

class PuzzleOperations {
    constructor(name, publishedStatus) {
        this.name = name;
        this.publishedStatus = publishedStatus;

        // TODO also pass in other behaviours?
    }

    // Endpoints

    async getPuzzleList(req, res) {
        try {
            const puzzles = await this.getPuzzles();
            res.status(200).json({ status: "complete", puzzleCount: puzzles.length, puzzles: puzzles });
        } catch (error) {
            console.error("Failed to get puzzle list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async createPuzzleLabel(req, res) {
        try {
            const label = await this.createNewPuzzleLabel();
            res.status(200).json({ label: label });
        } catch (error) {
            console.error("Failed to create puzzle label:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    async getPuzzlesMetadata() {
        console.debug(`Getting all ${this.name} puzzles`);

        // Execute the query and transform the result into a string array
        const rows = await dbAll(`SELECT word FROM ${this.tableName} ORDER BY LENGTH(word), word ASC`);
        const content = rows.map(row => row.word);
        return content;
    }

    async createNewPuzzleLabel() {
        console.debug(`Creating a new puzzle label`);

        // Get date as a (sortable) string in the form yyyy-mm-dd
        const today = new Date().toISOString().slice(0, 10); 

        // Execute the query and transform the result into a string array
        // return await dbGet(`INSERT INTO puzzleLabels (label) VALUES CONCAT(?, '-', COALESCE((SELECT MAX(id) FROM puzzleLabels), 0) + 1)`,[today]);
        //return await dbGet(`INSERT INTO puzzleLabels (label) VALUES (SELECT MAX(id) FROM puzzleLabels)+1)`,[today]);
        return await dbGet(`
            INSERT INTO puzzleLabels (label)
                VALUES (CONCAT(?, '-', COALESCE((SELECT MAX(id) FROM puzzleLabels), 0) + 1))
                RETURNING id, label
        `,[today]);
    }
}

// Declare the instances
const editablePuzzleOperations = new PuzzleOperations("Editable Puzzles", false);
const publishedPuzzleOperations = new PuzzleOperations("Published Puzzles", true);

module.exports = { editablePuzzleOperations, publishedPuzzleOperations };