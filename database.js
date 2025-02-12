// External requires
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

// Internal requires

// Toggle between in-memory and file-based database
///const databaseName = ':memory:';
const databaseName = './wordgriddle.db';

const db = new sqlite3.Database(databaseName, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');

        db.serialize(() => {
            // Word list tables
            createWordListTables();

            // Users tables
            createUserTables();

            // Puzzle tables
            createPuzzleSupportTables();

            // A single table for all puzzles, with 'status' being the key to its editable/locked/published status
            createPuzzleTables();
        });
    }
});

// Create tables containing the global dictionary, bonus and excluded words
// These are used as reference during puzzle design, but not during play
function createWordListTables() {
    db.run(`
            CREATE TABLE IF NOT EXISTS dictionaryWords (
                id INTEGER PRIMARY KEY, 
                word TEXT NOT NULL UNIQUE
            )`);

    db.run(`
            CREATE TABLE IF NOT EXISTS bonusWords (
                id INTEGER PRIMARY KEY, 
                word TEXT NOT NULL UNIQUE
            )`);

    db.run(`
            CREATE TABLE IF NOT EXISTS excludedWords (
                id INTEGER PRIMARY KEY, 
                word TEXT NOT NULL UNIQUE
            )`);
}

// Create tables relating to users, and seed with core set 
function createUserTables() {
    db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )`);

    // Insert some hard-wired entries for puzzle creations
    db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (0, "Anonymous" )`);
    db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (1, "Ian" )`);
    db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (2, "Catherine" )`);
    db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (3, "Squaredle" )`);
}

// Create tables used to support the main puzzle tables
function createPuzzleSupportTables() {
    // TODO is this redundant?
    // Puzzle status - editable, published, ...
    db.run(`
            CREATE TABLE IF NOT EXISTS puzzleStatus (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )`);

    // Insert some hard-wired entries so we can have guaranteed IDs
    db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (1, "Editable" )`); // still being worked on
    db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (2, "Locked" )`); // e.g. for beta testing, e.g. playable but results not stored
    db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (3, "Published" )`); // released to users, no longer editable
    db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (4, "Withdrawn" )`); // no longer available
}

// Create tables for the puzzles themselves
function createPuzzleTables() {
    db.run(`
            CREATE TABLE IF NOT EXISTS editablePuzzles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author INTEGER DEFAULT 0,
                size INTEGER,
                letters TEXT CHECK(length(letters) = size*size),
                status INTEGER DEFAULT 1,
                created STRING NOT NULL,
                updated STRING NOT NULL,
                FOREIGN KEY (author) REFERENCES users(id),
                FOREIGN KEY (status) REFERENCES puzzleStatus(id)
            )`);

    db.run(`
            CREATE TABLE IF NOT EXISTS publishedPuzzles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                origin INTEGER,
                title TEXT NOT NULL,
                author INTEGER DEFAULT 0,
                letters TEXT DEFAULT '',
                status INTEGER DEFAULT 3,
                created STRING NOT NULL,
                FOREIGN KEY (origin) REFERENCES editablePuzzles(id),
                FOREIGN KEY (author) REFERENCES users(id),
                FOREIGN KEY (status) REFERENCES puzzleStatus(id)
            )`);
}

// Allow database transactions to be used as promised
const dbAll = util.promisify(db.all.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));

// Exports
module.exports = { db, dbAll, dbGet, dbRun };
