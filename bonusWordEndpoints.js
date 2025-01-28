const db = require('./database');

const tableName = 'bonusWordList';

exports.getWords = (req, res) => {
  db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

exports.installWords = (req, res) => {
  const { name, price } = req.body;
  db.run(`INSERT INTO ${tableName} (name, price) VALUES (?, ?)`, [name, price], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, price });
  });
};
