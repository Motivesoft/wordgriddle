const sqlite3 = require('sqlite3').verbose();

//const databaseName = ':memory:';
const databaseName = './wordgriddle.db';

const db = new sqlite3.Database(databaseName, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');

        db.run(
            `CREATE TABLE IF NOT EXISTS dictionaryWordList (
            id INTEGER PRIMARY KEY, 
            word TEXT NOT NULL UNIQUE
        )`);

        db.run(
            `CREATE TABLE IF NOT EXISTS bonusWordList (
                id INTEGER PRIMARY KEY, 
                word TEXT NOT NULL UNIQUE
            )`);

        db.run(
            `CREATE TABLE IF NOT EXISTS excludedWordList (
            id INTEGER PRIMARY KEY, 
            word TEXT NOT NULL UNIQUE
        )`);
    }
});

module.exports = db;
