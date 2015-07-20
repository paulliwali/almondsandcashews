function cleanUpGamesAndPlayers(){
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();

  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });

  var numCategoriesRemoved = Categories.remove({
    createdAt: {$lt: cutoff}
  });
}

Meteor.startup(function () {
  // Delete all games and players at startup
  // And delete all stored categories
  Games.remove({});
  Players.remove({});
  Categories.remove({});
});

var MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpGamesAndPlayers);

Meteor.publish('games', function(accessCode) {
  return Games.find({"accessCode": accessCode});
});

Meteor.publish('players', function(gameID) {
  return Players.find({"gameID": gameID});
});

Meteor.publish('categories', function(gameID) {
  return Categories.find({"gameID": gameID});
});
