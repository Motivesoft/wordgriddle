const { db, dbAll, dbGet } = require('./database');

class PuzzleDesignerOperations {
    constructor() {
    }

    // Endpoints

    async getPuzzleList(req, res) {
        try {
            const puzzles = await this.getPuzzlesMetadata();
            res.status(200).json({ status: "complete", puzzleCount: puzzles.length, puzzles: puzzles });
        } catch (error) {
            console.error("Failed to get puzzle list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    async getPuzzlesMetadata() {
        console.debug(`Getting all the words from ${this.name}`);

        // Execute the query and transform the result into a string array
        const rows = await dbAll(`SELECT word FROM ${this.tableName} ORDER BY LENGTH(word), word ASC`);
        const content = rows.map(row => row.word);
        return content;
    }
}

// Declare the instance
const puzzleDesignerOperations = new PuzzleDesignerOperations();

module.exports = { puzzleDesignerOperations };