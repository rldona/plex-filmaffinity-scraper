const express = require('express');
const app = express();
const scraping = require('./index.js');
const port = process.env.PORT || 3000;

// const args = process.argv.slice(2);
// const type = args[0].split('=')[1];

app.listen(port, () => {
   console.log(`Server is up a port ${port}!`);
   // scraping.init(type);
   scraping.init();
});
