
var Game = function(type, options)
{
	var Q = Quintus({audioSupported: [ 'wav','mp3' ]})
      		.include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio');
	      	
	if(type == "client")
	{
		Q.setup("gameScreen", { maximize: false })
		      .enableSound()
		      .controls().touch();

		Q.gravityY = 0;

		var objectFiles = [
			'./src/player'
		];

	 	Q.Sprite.extend('Player', 
		{
			init: function (p) 
			{
				this._super(p, 
				{
					sheet: 'player'
				});
		 
			this.add('2d, platformerControls, animation');
		    	},
		    	step: function (dt) 
			{
		      		if (Q.inputs['up'])
					this.p.vy = -200;
		        	else if (Q.inputs['down'])
					this.p.vy = 200;
		     		else if (!Q.inputs['down'] && !Q.inputs['up'])
					this.p.vy = 0;
		      
		    	}
		});

		Q.scene('arena', function(stage)
		{
			stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles'}));


			var player = stage.insert(new Q.Player({ x: 100, y: 100 }));
			stage.add('viewport').follow(player);
		});
	

		var files = [
			'/images/tiles.png',
			'/maps/arena.json',
			'/images/sprites.png',
			'/images/sprites.json'
		];

		Q.load(files.join(','), function()
		{
			Q.sheet('tiles', '/images/tiles.png', { tilew: 32, tileh: 32});
			Q.compileSheets('/images/sprites.png', '/images/sprites.json');
			Q.stageScene('arena', 0);
		});
	}
}
