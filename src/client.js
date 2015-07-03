window.onload = function()
{
	var client = new Client();	

	client.update(new Date().getTime());
}

var Client = function()
{
	this.game = new Game();

	this.canvas = document.getElementById("gameScreen");
	this.ctx = this.canvas.getContext("2d");

	this.canvas.width = this.game.world.width;
	this.canvas.height = this.game.world.height;	
}

Client.prototype.update = function(time)
{
	this.deltaTime = this.lastFrameTime ? ( (time - this.lastFrametime)/1000.0) : 0.016;
	this.lastFrameTime = time;

	this.draw();

        this.updateid = window.requestAnimationFrame(this.update.bind(this));
}

Client.prototype.draw = function()
{
	/* Clear Screen to black */
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.fillStyle = "black";		
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	/* Draw Paddles  */
	var pl = this.game.leftPaddle;
	var pr = this.game.rightPaddle;
	
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

