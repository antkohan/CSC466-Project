# CSC466-Project

## Project Proposal

Problem:  Video games are a multi-billion dollar industry, and online multiplayer in many game genres has become the norm.  These days, people expect low latency and stable connections when playing online.  All players within a match must see the same things happen and in the same order.  And ideally, this shouldn’t impose any input delay on players.  These requirements are difficult to satisfy when players have different latencies to the game server.  Many multiplayer focused games fail because they do not have sophisticated and stable networking systems.

Description: How networking in a video game is handled depends a lot on the genre of the game.  Peer-to-peer lockstep is one of the simpler approaches but is still used today in many real-time strategy games.  The game is abstracted into turns and commands.  Turns are chunks of time.   Commands direct the evolution of the game and are processed at the beginning of a turn. Now all the network does is make sure all players share turns and commands and that they happen in the same order.  The other approach, used by most first person games, is a client/server model with client-side prediction.  Here, the server controls the state of the game. Each client (player) only sends input to the server to change its state and receives the server’s current state.  Now, synchronization is guaranteed since there is only one game state being managed.  It does introduce latency to player input, though.  If a player presses a movement key, they have to wait until the signal is sent to the server, the state is changed, and the new state is sent back to the client before they see their character move.  To solve this, client-side prediction is introduced.  Now, the client actually has its own game state, so when a player presses a movement key they see the change immediately.   Input is still sent to the server in order to maintain a “master” state, which is used to correct client states when they disagree.

My Project:  I plan to build a simple multiplayer game (something like pong) and  implement  a client/server with client-side prediction model.  Many games implement this model somewhat differently, so my hope is tweak it such that I come up with my own method. 

## June 22

So far most of my time has been devoted to reading about and playing with the technologies I plan to use.  I've built a simple little game using the Quintus engine and node.js.  I've also spent some time reading about socket.io, webRTC, UDP vs TCP for games, and the client-prediction model I'll be using.

