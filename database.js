const sqlite3 = require('sqlite3').verbose();
const util = require('util');

// Toggle between in-memory and file-based database
const databaseName = ':memory:';
//const databaseName = './wordgriddle.db';

const db = new sqlite3.Database(databaseName, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');

        db.serialize(() => {
            // Word list tables
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

            // Users tables

            db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )`);

            // Insert some hard-wired entries for puzzle creations
            db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (1, "Ian" )`);
            db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (2, "Catherine" )`);
            db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (3, "Squaredle" )`);

            // Puzzle tables

            // Puzzle status - editable, published, ...
            db.run(`
            CREATE TABLE IF NOT EXISTS puzzleStatus (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )`);

            // Insert some hard-wired entries so we can have guaranteed IDs
            db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (0, "Unsaved" )`);     // no details on server
            db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (1, "Editable" )`);    // still being worked on
            db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (2, "Locked" )`);      // e.g. for beta testing, e.g. playable but results not stored
            db.run(`INSERT OR IGNORE INTO puzzleStatus (id, name) VALUES (3, "Published" )`);   // released to users, no longer editable

            // Table that is used to create and store auto-generated puzzle labels, e.g. "wordgriddle #10 - 2025-12-25"
            db.run(`
            CREATE TABLE IF NOT EXISTS puzzleLabels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL UNIQUE
            )`);

            // Make sure there is at least one entry
            db.run(`INSERT OR IGNORE INTO puzzleLabels (id, label) VALUES (0, "**Unused**" )`);

            // A single table for all puzzles, with 'status' being the key to its editable/locked/published status
            db.run(`
            CREATE TABLE IF NOT EXISTS puzzles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label INTEGER,
                alternateName TEXT,
                author INTEGER NOT NULL,
                letters TEXT,
                status INTEGER,
                FOREIGN KEY (label) REFERENCES puzzleLabels(id),
                FOREIGN KEY (author) REFERENCES users(id),
                FOREIGN KEY (status) REFERENCES puzzleStatus(id)
            )`);
        });
    }
});

// Allow database transactions to be used as promised
const dbAll = util.promisify(db.all.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));

// Exports
module.exports = { db, dbAll, dbGet, dbRun };
