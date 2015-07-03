var Game = function(type, options)
{
	this.type = type || "client";
	this.options = options || {};

	this.world = 
	{
		width: 720,
		height: 480
	};

	this.ball = new Ball();
	this.startButton = new StartButton(this.world.width, this.world.height);
	this.leftPaddle = new Paddle(this.world.width, this.world.height, "left");
	this.rightPaddle = new Paddle(this.world.width, this.world.height, "right");
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
