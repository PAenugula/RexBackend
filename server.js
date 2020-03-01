const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	  res.sendFile(path.join(__dirname, 'views/SloHacksProject/index.html'));
});

const server = app.listen(8080, () => {
	  const host = server.address().address;
	  const port = server.address().port;

	  console.log(`Example app listening at http://${host}:${port}`);
});
