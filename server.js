const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const port = 8996;

// Serve static files from the "public" directory and a public API
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', routes);

// Run the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
