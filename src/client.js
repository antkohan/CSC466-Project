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

	this.keys = {};

	this.inputSeq = 0;
	this.lastPingTime = 0.001;
	this.ping = 0.001;
	this.latency = 0.001;
	this.offset = 100;
	this.serverTime = 0.001;
	this.clientTime = 0.001;

	this.naive = false;
	this.smooth = true;
	this.smoothValue = 25;

	this.maxUpdates = 120;
	this.serverUpdates = [];

	this.connectToServer();
	this.createPingTimer();
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

Client.prototype.update = function(time)
{
	this.deltaTime = this.lastFrameTime ? ( (time - this.lastFrameTime)/1000.0) : 0.016;
	this.lastFrameTime = time;

	if(this.game.running)
	{	
		this.handleInput();
	}	

	if(!this.naive)
	{
		this.processUpdates();
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

Client.prototype.predictionCorrection = function()
{
	if(this.serverUpdates.length == 0)
	{
		return;
	}

	var latestData = this.serverUpdates[this.serverUpdates.length - 1];
	var latestPos = (this.player == 0) ? latestData.p1 : latestData.p2;	
	var latestSeq = (this.player == 0) ? latestData.p1seq : latestData.p2seq; 	
	{
		var lastSeqIndex = -1;

		for(var i = 0; i < this.game.players[this.player].inputs.length; i++)
		{
			if(this.game.players[this.player].inputs[i].seq == latestSeq)
			{
				lastSeqIndex = i;
				break;
			}
		}

		if(lastSeqIndex != -1)
		{
			var numClear = Math.abs(lastSeqIndex + 1);
			this.game.players[this.player].inputs.splice(0, numClear);
	
			this.game.players[this.player].paddle.y = latestPos;
			this.game.players[this.player].lastInputSeq = lastSeqIndex;

			this.game.updatePhysics();
		}
	}	
}

Client.prototype.processUpdates = function()
{
	if(this.serverUpdates.length == 0)
	{
		return;
	}

	var target = null;
	var previous = null;	

	for(var i = 0; i < this.serverUpdates.length - 1; i++)
	{
		var point = this.serverUpdates[i];
		var nextPoint = this.serverUpdates[i+1];

		if(this.clientTime > point.time && this.clientTime < nextPoint.time)
		{
			target = nextPoint;
			previous = point;
			break;
		}		
	}

	if(!target)
	{
		target = this.serverUpdates[0];
		previous = this.serverUpdates[0];
	}

	if(target && previous)
	{
		this.targetTime = target.time;

		var timeDiff = this.targetTime - this.clientTime;
		var maxDiff = target.time - previous.time;
		var timePoint = timeDiff / maxDiff;

		if(isNaN(timePoint)) timePoint = 0;
		if(timePoint == -Infinity) timePoint = 0;
		if(timePoint == Infinity) timePoint = 0;

		var latestUpdate = this.serverUpdates[this.serverUpdates.length-1];
		var otherServerPos = (this.other == 0) ? latestUpdate.p1 : latestUpdate.p2;

		var otherTargetPos = (this.other == 0) ? target.p1 : target.p2;
		var otherPreviousPos = (this.other == 0) ? previous.p1 : previous.p2;	
		
		var otherPos = this.game.lerp(otherPreviousPos, otherTargetPos, timePoint);

		if(this.smooth)
		{
			this.game.players[this.other].paddle.y = this.game.lerp(this.game.players[this.other].paddle.y,
			otherPos, this.game.pdt * this.smoothValue);	
		}
		else
		{
			this.game.players[this.other].paddle.y = otherPos;
		}	

		if(!this.game.clientPrediction && !this.naive)
		{
			var serverPos = (this.player == 0) ? latestUpdate.p1 : latestUpdate.p2;
			var targetPos = (this.player == 0) ? target.p1 : target.p2;
			var previousPos = (this.player == 0) ? previous.p1 : previous.p2;

			var localTarget = this.game.lerp(previousPos, targetPos, timePoint);

			if(this.smooth)
			{
				this.game.players[this.player].paddle.y = this.game.lerp(this.game.players[this.player].paddle.y, localTarget, this.game.pdt * this.smoothValue);		
			}
			else
			{
				this.game.players[this.player].paddle.y = localTarget;
			}
		}
	}
}

Client.prototype.draw = function()
{
	/* Clear Screen to black */
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.fillStyle = "black";		
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	if(this.game.running)
	{
		/* Draw Dividing Line  */
		for(var i = 5; i < this.game.world.height; i += 35)
		{
			this.ctx.fillStyle = "white";
			this.ctx.fillRect(this.game.world.width/2 - 3, i, 6, 15);
		}

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
		
		/* Draw Ping  */ 
		this.ctx.font = "bold 14px Arial, sans-serif";
		this.ctx.fillStyle = "white";
		this.ctx.textAlign = "start";
		this.ctx.fillText("Ping: " + this.ping, 5, 10);

		/* Draw Scores */
		this.ctx.font = "bolder 50px Arial, sans-serif";
		this.ctx.fillStyle = "white";
		this.ctx.textAlign = "center";

		this.ctx.fillText("" + this.game.players[0].score, this.game.world.width/2 - 60, 60);
		this.ctx.fillText("" + this.game.players[1].score, this.game.world.width/2 + 60, 60);
	}

	if(!this.game.running)
	{
		/* Draw Waiting Box  */
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

Client.prototype.createPingTimer = function()
{
	setInterval(function()
	{
		this.lastPingTime = new Date().getTime();
		this.socket.send('p.' + this.lastPingTime);	
	}.bind(this), 1000);
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
	this.other = (this.player == 0) ? 1 : 0;

	console.log("connected");
}

Client.prototype.onDisconnect = function()
{
	this.game.endGame();
	console.log("disconnect");
}

Client.prototype.onServerUpdate = function(data)
{
	this.serverTime = data.time	
	this.clientTime = this.serverTime - (this.offset / 1000);

	this.game.players[0].score = data.p1sc;
	this.game.players[1].score = data.p2sc;
	this.game.ball.y = data.ball.y;
	this.game.ball.x = data.ball.x;	
	this.game.ball.vy = data.ball.vy;
	this.game.ball.vx = data.ball.vx;
	this.game.ball.hits = data.ball.hits;

	if(this.naive)
	{
		/* This is an ugly way to set a state. Should change this.  */
		this.game.players[0].paddle.y = data.p1;
		this.game.players[1].paddle.y = data.p2;
		this.game.players[0].lastInputSeq = data.p1seq;
		this.game.players[1].lastInputSeq = data.p2seq;
	}
	else
	{
		this.serverUpdates.push(data);	
		
		if(this.serverUpdates.length >= this.maxUpdates)
		{
			this.serverUpdates.splice(0,1);
		}

		this.predictionCorrection();
	}	
}

Client.prototype.onPing = function(data)
{
	this.ping = new Date().getTime() - parseFloat(data);
	this.latency = this.ping / 2;		
}

Client.prototype.onMessage = function(data)
{
	var commands = data.split('.');
	var command = commands[0];
	var subcommand = commands[1] || null;
	var commandData = commands[2] || null;

	switch(command)
	{
		case 's': /* Server Command  */	
			switch(subcommand)
			{
				case 's' : /* Start Game  */
					this.game.startGame(); break;
				case 'e' : /* End Game */
					this.game.endGame(); break;
				case 'p' :
					this.onPing(commandData); break;
			}
		break;
	}	
}


