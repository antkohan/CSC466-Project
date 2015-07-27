window.onload = function()
{
	var client = new Client();	

	client.update(new Date().getTime());
	
	document.addEventListener("keyup", function(event) { client.onKeyUp(event); }, false);	
	document.addEventListener("keydown", function(event) { client.onKeyDown(event); }, false);
	//document.addEventListener("mousedown", function(event) { client.buttonClick(event); }, true);
}

var Client = function()
{
	this.game = new Game();

	this.canvas = document.getElementById("gameScreen");
	this.ctx = this.canvas.getContext("2d");

	this.canvas.width = this.game.world.width;
	this.canvas.height = this.game.world.height;

	this.inputSeq = 0;

	this.keys = {};

	this.connectToServer();
}

Client.prototype.pressed = function(code)
{
 	return this.keys[code];
}

Client.prototype.onKeyDown = function(event)
{
	var code = event.keyCode;
	this.keys[code] = true;	
}

Client.prototype.onKeyUp = function(event)
{
	var code = event.keyCode;
	this.keys[code] = false;
}

/*
Client.prototype.buttonClick = function(event)
{
	var x = event.pageX - this.canvas.offsetLeft;
	var y = event.pageY - this.canvas.offsetTop;

	var start = this.game.startButton;
	
	if(x >= start.x && x <= start.x + start.width &&
	   y >= start.y && y <= start.y + start.height)
	{
		//this.game.startGame();
	}
}
*/

Client.prototype.update = function(time)
{
	this.deltaTime = this.lastFrameTime ? ( (time - this.lastFrameTime)/1000.0) : 0.016;
	this.lastFrameTime = time;

	if(this.game.running)
	{	
		this.handleInput();
	}	

	this.draw();	

        this.updateid = window.requestAnimationFrame(this.update.bind(this));
}

Client.prototype.handleInput = function()
{
	var input = [];

	if(this.pressed(87) == true)
	{
		input.push('u');
	}		
	if(this.pressed(83) == true)
	{
		input.push('d');
	}

	if(input.length > 0)
	{
		this.inputSeq++;
		this.game.players[this.player].inputs.push({
			inputs: input,
			time: this.game.localTime.toFixed(3),
			seq: this.inputSeq
		});	
		
		var inputPacket = 'i.' +
				input.join('-') + '.' +
				this.game.localTime.toFixed(3).replace('.', '-') + '.' +
				this.inputSeq;

		this.socket.send(inputPacket);
	}
}

/* MIGHT NOT NEED THIS FUNCTION AT ALL */
Client.prototype.updateLocalPosition = function()
{
	if(this.game.clientPrediction)
	{
		//var t = (this.game.localTime = this.game.players.self.stateTime) / this.game.pdt;		
	}
}

Client.prototype.draw = function()
{
	/* Clear Screen to black */
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.fillStyle = "black";		
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	/* Draw Players  */
	var pl = this.game.players[0].paddle;
	var pr = this.game.players[1].paddle;
	
	this.ctx.fillStyle = "white"
	this.ctx.fillRect(pl.x, pl.y, pl.width, pl.height);
	this.ctx.fillRect(pr.x, pr.y, pr.width, pr.height);

	/* Draw Ball */
	var ball = this.game.ball;

	this.ctx.beginPath();
	this.ctx.fillStyle = "white";
	this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, false);
	this.ctx.fill();

	if(!this.game.running)
	{
		var waiting = this.game.waitingButton;

		this.ctx.strokeStyle = "white";
		this.ctx.lineWidth = "2";
		this.ctx.strokeRect(waiting.x, waiting.y, waiting.width, waiting.height);
		
		this.ctx.font = "18px Arial, sans-serif";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = "white";
		this.ctx.fillText("Waiting", this.game.world.width / 2, this.game.world.height / 2);
	}
}

Client.prototype.connectToServer = function()
{
	this.socket = io.connect();	
	
	this.socket.on('connect', this.onConnecting.bind(this));
	this.socket.on('onconnected', this.onConnected.bind(this));
	this.socket.on('disconnect', this.onDisconnect.bind(this));
	this.socket.on('error', this.onDisconnect.bind(this));
	this.socket.on('onserverupdate', this.onServerUpdate.bind(this));
	this.socket.on('message', this.onMessage.bind(this));
}

Client.prototype.onConnecting = function()
{
	this.state = 'connecting';
	console.log("connecting");	
}

Client.prototype.onConnected = function(data)
{
	this.state = 'connected';
	
	this.game.self = data.player;	
	this.player = data.player;

	console.log("connected");
}

Client.prototype.onDisconnect = function()
{
	console.log("disconnect");
}

Client.prototype.onServerUpdate = function(data)
{
	this.game.players[0].paddle.y = data.p1;
	this.game.players[1].paddle.y = data.p2;
	this.game.players[0].lastInputSeq = data.p1seq;
	this.game.players[1].lastInputSeq = data.p2seq;
	this.game.ball.y = data.ball.y;
	this.game.ball.x = data.ball.x;	
	this.game.ball.vy = data.ball.vy;
	this.game.ball.vx = data.ball.vx;
	this.serverTime = data.time	
}

Client.prototype.onMessage = function(data)
{
	console.log("message");
	
	var commands = data.split('.');
	var command = commands[0];
	var subcommand = commands[1] || null;
	var commanddata = commands[2] || null;

	switch(command)
	{
		case 's': /* Server Command  */	
			switch(subcommand)
			{
				case 's' : /* Start Game  */
					this.game.startGame(); break;
				case 'e' : /* End Game */
					this.game.endGame(); break;
			}
		break;
	}	
}

