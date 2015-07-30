var Game = function(type, parameters)
{
	this.type = type || "client";
	this.parameters = parameters || {};
	
	this.self = 0;
	
	this.clientPrediction = true;

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

	this.players = [];	
	this.players.push(new Player(this.world, "p1"));
        this.players.push(new Player(this.world, "p2"));
	

	this.ball = new Ball();
	this.waitingButton = new WaitingButton(this.world.width, this.world.height);
}

Game.prototype.updatePhysics = function()
{
	if(this.type == 'client' && this.clientPrediction)
	{
		var deltaY = 5 * this.processInput(this.players[this.self])
		var y = this.players[this.self].paddle.y + deltaY;

		if(y + this.players[this.self].paddle.height <= this.world.height && y >= 0)
		{
			this.players[this.self].paddle.y = y;
		}
		
		this.players[this.self].stateTime = this.localTime;
	}	

	if(this.type == 'server')
	{
		for(var i = 0; i < 2; i++)
		{
			var deltaY = 5 * this.processInput(this.players[i])
			var y = this.players[i].paddle.y + deltaY;

			if(y + this.players[i].paddle.height <= this.world.height && y >= 0)
			{
				this.players[i].paddle.y = y;
			}
			
			this.players[i].inputs = [];
		}
	}	

	this.ball.x += this.ball.vx;
	this.ball.y += this.ball.vy;	

	if(this.collides(this.ball, this.players[0].paddle))
	{
		this.ball.hits++;
		this.ball.vx = -this.ball.vx;
		this.ball.increaseSpeed(this.ball.hits);
	}
		
	if(this.collides(this.ball, this.players[1].paddle))
	{
		this.ball.hits++;
		this.ball.vx = -this.ball.vx;
		this.ball.increaseSpeed(this.ball.hits);
	}

	if(this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.world.height) 
	{
		this.ball.vy = -this.ball.vy;
	}

	if(this.ball.x - this.ball.radius < 0)
	{
		this.players[1].score++;
		this.ball.reset();
	}
	
	if(this.ball.x + this.ball.radius > this.world.width)
	{
		this.players[0].score++;
		this.ball.reset();
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
	this.endGame(); /* Force the game to stop first. */

	this.running = true;
	this.timerId = this.createTimer();
	this.physicsId = this.createPhysicsTimer();
	
	this.ball.reset();
	this.players[0].paddle.reset();
	this.players[1].paddle.reset();
	this.players[0].score = 0;
	this.players[1].score = 0;
}

Game.prototype.endGame = function()
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

Game.prototype.lerp = function(value1, value2, weight)
{
	var w = Number(weight);	
	w = Math.max(0, Math.min(1, w));
	return value1 + w * (value2 - value1);
}

var Player = function(world, port)
{
	this.lastInputSeq = -1;
	this.lastInputTime = -1;
	this.inputs = [];

	this.stateTime = new Date().getTime();
	this.score = 0;

	if(port == "p1")
		this.paddle = new Paddle(world.width, world.height, "left");
	else 
		this.paddle = new Paddle(world.width, world.height, "right");

}

var Paddle = function(worldWidth, worldHeight, side)
{
	this.worldWidth = worldWidth;
	this.worldHeight = worldHeight;

	this.height = 60;
	this.width = 10;

	this.side = side;

	this.padding = 10;
	
	this.reset = function()
	{
		this.x = (this.side == "left") ? 0 + this.padding : this.worldWidth - this.width - this.padding;
		this.y = (this.worldHeight / 2) - (this.height / 2);
	}	
	
	this.reset();
}

var Ball = function()
{
	this.reset = function()
	{
		this.x = 200;
		this.y = 200;
		this.vx = 2;
		this.vy = 2;
		this.hits = 0;
	}

	this.reset();
	this.radius = 5;
}

Ball.prototype.increaseSpeed = function()
{
	if(this.hits % 4 == 0)
	{
		if(Math.abs(this.vx) < 15)
		{
			this.vx += (this.vx < 0) ? -2 : 2;
			this.vy += (this.vy < 0) ? -1 : 1;
		}
	}	
}

var WaitingButton = function(worldWidth, worldHeight, x, y)
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
