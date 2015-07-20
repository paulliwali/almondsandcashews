# Meteor - Almond & Cashews

A fun social game where one player is a **almond**, and other players are **cashews** who are trying to find the almond and vote it out!

## Disclaimer

This is a a fork of [Spyfall](https://github.com/evanbrumley/spyfall). I modified Spyfall's architecture to create this game. This is an unofficial fan project designed for personal use and is not endorsed in any way by the designer or publisher of the actual game

## Rules to the game

*Goal:* the N-1 players to work together to vote out the player with the different item.

*Gameplay:*

Each player says a sentence about their item, this sentence has to be factual.

	"I am edible"

One round of AnC is complete when all players has said a sentence about their item. The players publicly discuss and vote for a player to be eliminated for being the **almond**. For games of various sizes refer to the table below for voting rounds.

Number of Players | Rounds of Gameplay
------------------|------------------
3-6 Players       |3 Rounds of Talking, Vote, 1 Round of Talking, Vote, etc
6-Players         |2 Rounds of Talking, Vote, 1 Round of Talking, Vote, etc


The **almond** loses when it is voted out by the **cashews**. The **almond** wins when
only 1 **cashew** is left with the **almond**.

*Tips:*

## Running your own instance with custom locations

[Install meteor](https://www.meteor.com/install)

Clone the repository:

	git clone https://github.com/paulliwali/almondsandcashews ./almondsandcashews

Enter the oddity directory:

	cd almondsandcashews/almondsandcashews

Edit the items file as required:

	vim lib/items.js

Run the meteor server to test locally:

	meteor

Deploy to meteor:

	meteor deploy myurl.meteor.com

## Links
