const sqlite3 = require('sqlite3').verbose();
const util = require('util');

// Toggle between in-memory and file-based database
//const databaseName = ':memory:';
const databaseName = './wordgriddle.db';

const db = new sqlite3.Database(databaseName, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');

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
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `);

        // Puzzle tables

        db.run(`
            CREATE TABLE IF NOT EXISTS puzzles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                author INTEGER NOT NULL,
                letters TEXT,
                created INTEGER,
                FOREIGN KEY (author) REFERENCES users(id)
            )
        `);    
    }
});

// Allow database transactions to be used as promised
const dbAll = util.promisify(db.all.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));

// Exports
module.exports = {db, dbAll, dbGet, dbRun};
