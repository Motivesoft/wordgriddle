const db = require('./database');

const tableName = 'excludedWordList';

// Route to upload a text file and insert words into the database
exports.upload = async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded.');
  }

  const wordFile = req.files.file;

  try {
    // Read the file and split into words
    const data = wordFile.data.toString('utf8');
    const words = data.split(/\s+/).filter(word => word.length > 0);

    // Delete all existing words in the database
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM ${tableName}`, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Insert new words into the database
    const insertPromises = words.map(word => {
      return new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO ${tableName} (word) VALUES (?)`, [word], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    await Promise.all(insertPromises);

    res.send('Words uploaded and inserted into the database successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while processing the file.');
  }
}

// Route to get the total number of words in the database
exports.count = async (req, res) => {
  try {
    const count = await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as total FROM ${tableName}`, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });

    res.send(`Total words in the database: ${count}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while fetching the word count.');
  }
}

// Route to check if a specific word exists in the database
exports.checkWord = async (req, res) => {
  const word = req.params.word;

  try {
    const exists = await new Promise((resolve, reject) => {
      db.get(`SELECT 1 FROM ${tableName} WHERE word = ?`, [word], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });

    if (exists) {
      res.send(`The word "${word}" exists in the database.`);
    } else {
      res.send(`The word "${word}" does not exist in the database.`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while checking the word.');
  }
}