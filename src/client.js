window.onload = function()
{
	var client = new Client();	

	client.update(new Date().getTime());
	
	document.addEventListener("keyup", function(event) { client.onKeyUp(event); }, false);	
	document.addEventListener("keydown", function(event) { client.onKeyDown(event); }, false);
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
	
	this.handleInput();

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
		this.game.players.p1.inputs.push({
			inputs: input,
			time: this.game.localTime.toFixed(3),
			seq: this.inputSeq
		});	
		
	}
}

Client.prototype.draw = function()
{
	/* Clear Screen to black */
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.fillStyle = "black";		
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	/* Draw Players  */
	var pl = this.game.players.p1.paddle;
	var pr = this.game.players.p2.paddle;
	
	this.ctx.fillStyle = "white"
	this.ctx.fillRect(pl.x, pl.y, pl.width, pl.height);
	this.ctx.fillRect(pr.x, pr.y, pr.width, pr.height);

	/* Draw Ball */
	var ball = this.game.ball;

	this.ctx.beginPath();
	this.ctx.fillStyle = "white";
	this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, false);
	this.ctx.fill();

}

