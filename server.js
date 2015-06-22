var express = require('express');
var app = express();
var server = app.listen(8080); 
var io = require('socket.io').listen(server);

var path = require('path');

app.use(express.static(__dirname));

app.get('/', function(req, res) {
	res.sendFile(path.join('/index.html'));
});


console.log('Listening on port 8080');


