var express = require('express');
var path = require('path');
var app = express();

app.use(express.static(path.resolve(__dirname, 'client')));
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/new/:url', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(req.params.url);
});

app.listen(process.env.PORT || 8080, function () {
  console.log('Kurtz app listening on port 8080!');
});