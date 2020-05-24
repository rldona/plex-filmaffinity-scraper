const express = require('express');
const app = express();
const scraping = require('./index.js');
const port = process.env.PORT || 3000;

app.listen(port, () => {
   console.log(`Server is up a port ${port}!`);
   scraping.init();
});
