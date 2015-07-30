require('./game.js');

var Server = module.exports = { games : {}, numgames: 0};

Server.fakeLatency = 0;
Server.messages = [];

Server.update = function()
{
	for(var i = 0; i < this.numgames; i++)
	{
		var state = 
		{
			p1: this.games[i].core.players[0].paddle.y,
			p2: this.games[i].core.players[1].paddle.y,
			p1seq: this.games[i].core.players[0].lastInputSeq,
			p2seq: this.games[i].core.players[1].lastInputSeq,	
			p1sc: this.games[i].core.players[0].score,
			p2sc: this.games[i].core.players[1].score,	
			ball: this.games[i].core.ball,
			time: this.games[i].core.localTime
		}
	
		for(var j = 0; j < this.games[i].players.length; j++)
		{
			this.games[i].players[j].emit('onserverupdate', state);
		}	
	}
}

Server.createGame = function(player)
{
	var game = 
	{
		id: this.numgames,
		players: [],
		numplayers: 0
	};

	game.core = new Game('server');
	game.players.push(player);
	game.numplayers++;

	this.games[game.id] = game;
	this.numgames++;

	return game;
}

Server.findGame = function(player)
{
	gameInfo = {};	
	
	for(var i = 0; i < this.numgames; i++)
	{
		if(this.games[i].numplayers == 1)
		{
			this.games[i].players.push(player);
			this.games[i].numplayers++;
		
			gameInfo.player = (this.games[i].players[0].player == 0) ? 1 : 0; 
			gameInfo.numplayers = 2;
			gameInfo.gameId = this.games[i].id;

			return gameInfo;	
		}	
	}
	
	var game = this.createGame(player);

	gameInfo.player = 0;
	gameInfo.numplayers = 1;
	gameInfo.gameId = game.id; 

	return gameInfo;
}

Server.startGame = function(gameId)
{
	console.log("Game " + gameId + " has started!");

	this.games[gameId].core.startGame();

	for(var i = 0; i < this.games[gameId].players.length; i++)
	{
		this.games[gameId].players[i].send('s.s.' + String(this.games[gameId].core.localTime).replace('.','-'));
	}	
}

Server.endGame = function(gameId)
{
	console.log("Game " + gameId + " has ended!");

	this.games[gameId].core.endGame();

	for(var i = 0; i < this.games[gameId].players.length; i++)
	{
		this.games[gameId].players[i].send('s.e.' + String(this.games[gameId].core.localTime).replace('.','-'));
	}	
}

Server.removePlayer = function(player)
{
	var gameId = player.gameId;
	var index = this.games[gameId].players.indexOf(player);

	this.games[gameId].players.splice(index, 1);	
	this.games[gameId].numplayers--;

	if(this.games[gameId].numplayers <= 0)
	{
		delete this.games[gameId];
		this.numgames--;
	}
}

Server.onInput = function(client, parts)
{
	var input = parts[1].split('-');
	var time = parts[2].replace('-', '.');
	var seq = parts[3];

	this.games[client.gameId].core.players[client.player].inputs.push({inputs: input, time: time, seq: seq});
}

Server.onMessage = function(client, message)
{
	/* Apply fake latency to input messages only  */
	if(this.fakeLatency > 0 && message.split('.')[0].substr(0,1) == 'i')
	{
		this.messages.push({client: client, message: message});

		setTimeout(function()
		{
			if(this.messages.length > 0)
			{
				this.handleMessage(this.messages[0].client, this.messages[0].message);
				this.messages.splice(0,1);
			}	
		}.bind(this), this.fakeLatency);
	}
	else
	{
		this.handleMessage(client, message);
	}
}
	
Server.handleMessage = function(client, message)
{
	var parts = message.split('.');
	var type = parts[0];

	switch(type)
	{
		case 'i': 	
			this.onInput(client, parts); break;
		
		case 'p':
			client.send('s.p.' + parts[1]); break;			
	}	
}

Server.createUpdateTimer = function()
{
	return setInterval(function(){
		this.update();
	}.bind(this), 45);
}
