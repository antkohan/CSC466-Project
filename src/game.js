var Game = function(type, parameters)
{
	this.type = type || "client";
	this.parameters = parameters || {};

	this.player = null;
	if(type == 'client')
	{
		 this.player = 1; // This should be set by the client creating the game.
	}		

	this.localTime = 0.016;
	this.dt = new Date().getTime();
	this.dte = new Date().getTime();

	this.pdt = 0.0001;
	this.pdte = new Date().getTime();
	
	this.world = 
	{
		width: 720,
		height: 480
	};

	this.players =
	{
		p1 : new Player(this, "player 1"),
		p2 : new Player(this, "player 2")
	};

	this.ball = new Ball();
	this.startButton = new StartButton(this.world.width, this.world.height);

	this.createTimer();
	this.createPhysicsTimer();
}

Game.prototype.updatePhysics = function()
{
	if(this.type == 'client')
	{
		var y = this.processInput(this.players.p1)
		this.players.p1.paddle.y += y;
	}	
}

Game.prototype.processInput = function(player)
{
	var y = 0;

	var numSeq = player.inputs.length;

	for(var i = 0; i < numSeq; i++)
	{
		if(player.inputs[i].seq <= player.lastInputSeq) 
			continue;

		var input = player.inputs[i].inputs;
		var numInputs = input.length;
		
		for(var j = 0; j < numInputs; j++)
		{	
			var key = input[j];
			if(key == 'u'){
				y--;	
			}
			if(key == 'd'){
				y++;
			}
		}
	}	
		
	if(numSeq > 0)
	{
		player.lastInputTime = player.inputs[numSeq-1].time;
		player.lastInputSeq = player.inputs[numSeq-1].seq;
	}
		
	return y;
}

Game.prototype.createPhysicsTimer = function()
{
	setInterval(function(){
		this.pdt = (new Date().getTime() - this.pdte)/1000.0;
		this.pdte = new Date().getTime();
		this.updatePhysics();
	}.bind(this), 15); 
}

Game.prototype.createTimer = function()
{
	setInterval(function(){
		this.dt = new Date().getTime() - this.dte;
		this.dte = new Date().getTime();
		this.localTime += this.dt / 1000.0;	
	}.bind(this), 4);
}

var Player = function(gameInstance, port)
{
	this.game = gameInstance;

	this.lastInputSeq = -1;
	this.lastInputTime = -1;
	this.inputs = [];
	
	if(port == "player 1")
		this.paddle = new Paddle(this.game.world.width, this.game.world.height, "left");
	else 
		this.paddle = new Paddle(this.game.world.width, this.game.world.height, "right");
}

var Paddle = function(worldWidth, worldHeight, side)
{
	this.height = 100;
	this.width = 10;

	var padding = 10;

	this.x = (side == "left") ? 0 + padding : worldWidth - this.width - padding;
	this.y = (worldHeight / 2) - (this.height / 2);
}

var Ball = function(x, y, radius)
{
	this.x = x || 50;
	this.y = y || 50;
	this.vx = 4;
	this.vy = 4;
	this.radius = radius || 5;
}

var StartButton = function(worldWidth, worldHeight, x, y)
{
	this.width = 100;
	this.height = 50;
	this.x = x || (worldWidth / 2) - (this.width / 2);
	this.y = y || (worldHeight / 2) - (this.height / 2);
}

if('undefined' != typeof global)
{
	module.exports = global.Game = Game;
}
