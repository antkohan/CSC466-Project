var server = module.exports = { games : {}, numgames: 0 };

require('./game.js');

server.createGame = function()
{
	var game = 
	{
		id: this.numgames,
		players: [],
		numplayers: 0
	};

	this.games[game.id] = game;
	this.numgames++;

	game.core = new Game();

	return game;
}
