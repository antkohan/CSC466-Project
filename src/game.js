var Game = function(type, parameters)
{
	this.type = type || "client";
	this.parameters = parameters || {};

	this.clientPrediction = true;
	this.hits = 0;

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
		self : new Player(this, "self"),
		other : new Player(this, "other")
	};

	this.ball = new Ball();
	this.startButton = new StartButton(this.world.width, this.world.height);
}

Game.prototype.updatePhysics = function()
{
	if(this.type == 'client' && this.clientPrediction)
	{
		var deltaY = 5 * this.processInput(this.players.self)
		var y = this.players.self.paddle.y + deltaY;

		if(y + this.players.self.paddle.height <= this.world.height && y >= 0)
		{
			this.players.self.paddle.y = y;
		}
		
		this.players.self.stateTime = this.localTime;
	}	

	this.ball.x += this.ball.vx;
	this.ball.y += this.ball.vy;	

	if(this.collides(this.ball, this.players.self.paddle))
	{
		this.hits++;
		this.ball.vx = -this.ball.vx;
		this.ball.increaseSpeed(this.hits);
	}
		
	if(this.collides(this.ball, this.players.other.paddle))
	{
		this.hits++;
		this.ball.vx = -this.ball.vx;
		this.ball.increaseSpeed(this.hits);
	}

	if(this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.world.height) 
	{
		this.ball.vy = -this.ball.vy;
	}

	if(this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.world.width) 
	{
		console.log("GAME OVER"); /* Need a function to stop game for client and server  */
		this.stopGame();
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
	return setInterval(function(){
		this.pdt = (new Date().getTime() - this.pdte)/1000.0;
		this.pdte = new Date().getTime();
		this.updatePhysics();
	}.bind(this), 15); 
}

Game.prototype.createTimer = function()
{
	return setInterval(function(){
		this.dt = new Date().getTime() - this.dte;
		this.dte = new Date().getTime();
		this.localTime += this.dt / 1000.0;	
	}.bind(this), 4);
}

Game.prototype.startGame = function()
{
	this.running = true;
	this.timerId = this.createTimer();
	this.physicsId = this.createPhysicsTimer();
	
	this.ball = new Ball();
}

Game.prototype.stopGame = function()
{
	this.running = false;
	clearInterval(this.timerId);
	clearInterval(this.physicsId);			
}

Game.prototype.collides = function(ball, paddle)
{
	if(ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height)
	{
		if(ball.x + ball.radius >= paddle.x && paddle.side == "right")
		{
			return true;
		} 

		if(ball.x - ball.radius <= paddle.x + paddle.width && paddle.side == "left")
		{
			return true;
		}
	}
	
	return false;
}

var Player = function(gameInstance, port)
{
	this.game = gameInstance;

	this.lastInputSeq = -1;
	this.lastInputTime = -1;
	this.inputs = [];

	this.stateTime = new Date().getTime();
	this.score = 0;

	if(port == "self")
		this.paddle = new Paddle(this.game.world.width, this.game.world.height, "left");
	else 
		this.paddle = new Paddle(this.game.world.width, this.game.world.height, "right");

}

var Paddle = function(worldWidth, worldHeight, side)
{
	this.height = 100;
	this.width = 10;

	this.side = side;

	var padding = 10;

	this.x = (side == "left") ? 0 + padding : worldWidth - this.width - padding;
	this.y = (worldHeight / 2) - (this.height / 2);
}

var Ball = function(x, y, radius)
{
	this.x = x || 200;
	this.y = y || 200;
	this.vx = 4;
	this.vy = 4;
	this.radius = radius || 5;
}

Ball.prototype.increaseSpeed = function(hits)
{
	if(hits % 4 == 0)
	{
		if(Math.abs(this.vx) < 15)
		{
			this.vx += (this.vx < 0) ? -2 : 2;
			this.vy += (this.vy < 0) ? -1 : 1;
		}
	}	
}

var StartButton = function(worldWidth, worldHeight, x, y)
{
	this.width = 80;
	this.height = 40;
	this.x = x || (worldWidth / 2) - (this.width / 2);
	this.y = y || (worldHeight / 2) - (this.height / 2);
}

if('undefined' != typeof global)
{
	module.exports = global.Game = Game;
}
