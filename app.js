var express = require('express');
var io = require('socket.io');
var path = require('path');
var app = express();
var server = app.listen(process.env.PORT || 8080); 

app.use(express.static(__dirname));

app.get('/', function(req, res) {
	res.sendFile(path.join('/index.html'));
});

var gameServer = require('./src/server.js');
gameServer.createUpdateTimer();

var sio = io.listen(server);
var playerId = 0;

sio.set('authorization', function(handshakeData, callback)
{
	callback(null, true);
});

sio.sockets.on('connection', function(client)
{
	client.userId = playerId;
	playerId++;
 
        var gameInfo = gameServer.findGame(client);
	client.gameId = gameInfo.gameId;
	client.player = gameInfo.player;

	client.emit('onconnected', {player: gameInfo.player});

	console.log("Player " + client.userId + " has connected!");
	//console.log(gameServer.games);
	
	if(gameInfo.numplayers == 2)
	{
		gameServer.startGame(client.gameId);
	}

	client.on('message', function(message)
	{
		gameServer.onMessage(client, message);
	});

	client.on('disconnect', function()
	{
		gameServer.endGame(client.gameId);
		gameServer.removePlayer(client);
		console.log("Player " + client.userId + " has disconnected!");
		//console.log(gameServer.games);
	});

	
});

console.log('Listening on port 8080');


