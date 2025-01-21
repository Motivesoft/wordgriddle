const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the in-memory SQLite database');

    db.run(
        `CREATE TABLE IF NOT EXISTS dictionaryWords (
            id INTEGER PRIMARY KEY, 
            name TEXT NOT NULL UNIQUE
        )`);

        db.run(
            `CREATE TABLE IF NOT EXISTS bonusWords (
                id INTEGER PRIMARY KEY, 
                name TEXT NOT NULL UNIQUE
            )`);
    
    db.run(
        `CREATE TABLE IF NOT EXISTS excludedWords (
            id INTEGER PRIMARY KEY, 
            name TEXT NOT NULL UNIQUE
        )`);
  }
});

module.exports = db;
