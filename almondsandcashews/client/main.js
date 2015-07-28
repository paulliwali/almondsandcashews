Handlebars.registerHelper('toCapitalCase', function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function initUserLanguage() {
  var language = amplify.store("language");

  if (language){
    Session.set("language", language);
  }

  setUserLanguage(getUserLanguage());
}

function getUserLanguage() {
  var language = Session.get("language");

  if (language){
    return language;
  } else {
    return "en";
  }
};

function setUserLanguage(language) {
  TAPi18n.setLanguage(language).done(function () {
    Session.set("language", language);
    amplify.store("language", language);
  });
}

function getLanguageDirection() {
  var language = getUserLanguage()
  var rtlLanguages = ['he'];

  if ($.inArray(language, rtlLanguages) !== -1) {
    return 'rtl';
  } else {
    return 'ltr';
  }
}

function getLanguageList() {
  var languages = TAPi18n.getLanguages();
  var languageList = _.map(languages, function(value, key) {
    var selected = "";

    if (key == getUserLanguage()){
      selected = "selected";
    }

    return {
      code: key,
      selected: selected,
      languageDetails: value
    };
  });

  if (languageList.length <= 1){
    return null;
  }

  return languageList;
}

function getCurrentGame(){
  var gameID = Session.get("gameID");

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getAccessLink(){
  var game = getCurrentGame();

  if (!game){
    return;
  }

  return Meteor.settings.public.url + game.accessCode + "/";
}

function getCurrentPlayer(){
  var playerID = Session.get("playerID");

  if (playerID) {
    return Players.findOne(playerID);
  }
}

function getCurrentCategory(){
  var gameID = Session.get("gameID");

  if (gameID){
    return Games.findOne(gameID).category;
  }
}

function generateAccessCode(){
  var code = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

    for(var i=0; i < 6; i++){
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
}

function getRadioValue(theRadioGroup){
  var elements = document.getElementsByName(theRadioGroup);
  for (var i = 0, l = elements.length; i < l; i++){
    if (elements[i].checked){
      return elements[i].value;
    }
  }
}

function generateNewGame(){
  var game = {
    accessCode: generateAccessCode(),
    state: "waitingForPlayers",
    gameMode: null,
    category: null,
    items: [
      {item: "test1"},
      {item: "test2"},
      {item: "test3"},
      {item: "test4"}
    ],
    lengthInMinutes: 8,
    endTime: null,
    paused: false,
    pausedTime: null
  };

  var gameID = Games.insert(game);

  return Games.findOne(gameID);
}

// add a new attribute - isOdd to indicate the player with the odd item
// add a new attribute - item to hold the item for the player
// add a new attribute - votes to hold the number of votes
// add a new attribute - votedOut to hold boolean value
function generateNewPlayer(game, name){
  var player = {
    gameID: game._id,
    name: name,
    item: null,
    isOdd: false,
    isFirstPlayer: false,
    votes: 0,
    voted: false,
    votedOut: false
  };

  var playerID = Players.insert(player);

  return Players.findOne(playerID);
}

function getRandomCategory(){
  var categoryIndex = Math.floor(Math.random() * categories.length);
  return categories[categoryIndex]
}

function getRandomItems(){
  var itemIndex = Math.floor(Math.random() * items.length);
  return items[itemIndex]
}

function assignItems(gameMode, players, item){
  // check for classic mode
  if (gameMode === "classic") {
    //Yeah...not very smart but I can't think atm
    var randomNumber = Math.floor((Math.random() * 10) + 1);
    if (randomNumber % 2 == 0) {
      var oddItem = item.itemA;
      var commonItem = item.itemB;
    } else {
      var oddItem = item.itemB;
      var commonItem = item.itemA;
    }
    var item = null;

    players.forEach(function(player){
      if (!player.isOdd){
        item = commonItem;

        Players.update(player._id, { $set: {item: item}});
      } else {
        item = oddItem;

        Players.update(player._id, { $set: {item: item}});
      }
    });
  } else if (gameMode === "advanced") {
    console.log("wrong assignItem() call for advnaced mode");
  }
}

function assignAdvancedItems(gameMode, players, game){
  // check advanced mode
  if(gameMode == "advanced"){
    oddItem = null;
    commonItem = null;

    // check the two items are not identical
    while (oddItem == commonItem){
      var choosenCategory = game.category;
      var itemsArray = game.items;
      var randomIndex = Math.floor(Math.random() * itemsArray.length);
      var oddItem = itemsArray[randomIndex].item;
      var randomIndexTwo = Math.floor(Math.random() * itemsArray.length);
      var commonItem = itemsArray[randomIndexTwo].item;
    }

    var item = null;

    players.forEach(function(player){
      if (!player.isOdd){
        item = commonItem;

        Players.update(player._id, {$set: {item: item}});
      } else {
        item = oddItem;

        Players.update(player._id, {$set: {item: item}});
      }
    });
  } else if(gameMode == "classic") {
    console.log("wrong assignAdvancedItems() call for normal mode");
  }
}

function resetUserState(){
  var player = getCurrentPlayer();

  if (player){
    Players.remove(player._id);
  }

  Session.set("gameID", null);
  Session.set("playerID", null);
}

function trackGameState () {
  var gameID = Session.get("gameID");
  var playerID = Session.get("playerID");

  if (!gameID || !playerID){
    return;
  }

  var game = Games.findOne(gameID);
  var player = Players.findOne(playerID);

  if (!game || !player){
    Session.set("gameID", null);
    Session.set("playerID", null);
    Session.set("currentView", "startMenu");
    return;
  }

  // track the state for the game, added new code to look for the
  // game mode of classic or advanced
  if(game.state === "inProgress"){
    Session.set("currentView", "gameView");
  } else if (game.state === "waitingForPlayers") {
      if(game.mode === "classic"){
        Session.set("currentView", "lobby");
      } else if (game.mode === "advanced"){
        Session.set("currentView", "lobbyAdvanced");
      }
  }
}

function leaveGame () {
  GAnalytics.event("game-actions", "gameleave");
  var player = getCurrentPlayer();

  Session.set("currentView", "startMenu");
  Players.remove(player._id);

  Session.set("playerID", null);
}

function endGame () {
  GAnalytics.event("game-actions", "gameend");
  var game = getCurrentGame();
  var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();

  Session.set("currentView", "startMenu");

  players.forEach(function(player){
    Players.remove(player._id);
  });
  // Put code here to clean the items list and category name
  Games.update(game._id, {$set: {state: 'waitingForPlayers'}});
  Games.update(game._id, {$set: {category: null}});
  Games.update(game._id, {$set: {items: []}});

  Session.set("playerID", null);
  Session.set("gameID", null);
}

initUserLanguage();

Meteor.setInterval(function () {
  Session.set('time', new Date());
}, 1000);

Tracker.autorun(trackGameState);

FlashMessages.configure({
  autoHide: true,
  autoScroll: false
});

Template.main.helpers({
  whichView: function() {
    return Session.get('currentView');
  },
  language: function() {
    return getUserLanguage();
  },
  textDirection: function() {
    return getLanguageDirection();
  }
});

Template.footer.helpers({
  languages: getLanguageList
})

Template.footer.events({
  'click .btn-set-language': function (event) {
    var language = $(event.target).data('language');
    setUserLanguage(language);
    GAnalytics.event("language-actions", "set-language-" + language);
  },
  'change .language-select': function (event) {
    var language = event.target.value;
    setUserLanguage(language);
    GAnalytics.event("language-actions", "set-language-" + language);
  }
})

Template.startMenu.events({
  'click #btn-new-game': function () {
    Session.set("currentView", "createGame");
  },
  'click #btn-join-game': function () {
    Session.set("currentView", "joinGame");
  }
});

Template.startMenu.helpers({
  alternativeURL: function() {
    return Meteor.settings.public.alternative;
  }
});

Template.startMenu.rendered = function () {
  GAnalytics.pageview("/");

  resetUserState();
};

Template.createGame.events({
  'submit #create-game': function (event) {
    GAnalytics.event("game-actions", "newgame");

    var playerName = event.target.playerName.value;

    if (!playerName) {
      return false;
    }

    var gameMode = getRadioValue('selectedMode');
    var game = generateNewGame();
    var player = generateNewPlayer(game, playerName);

    Games.update(game._id, {$set: {gameMode: gameMode}});

    Meteor.subscribe('games', game.accessCode);
    Session.set("loading", true);

    Meteor.subscribe('players', game._id, function onReady(){
      Session.set("loading", false);

      Session.set("gameID", game._id);
      Session.set("playerID", player._id);

      if (gameMode == "advanced") {
        var randomCategory = getRandomCategory();
        Games.update(game._id, {$set: {category: randomCategory}});

        //TEST CODE ---------------------------
        // test if the collection Games contains the right category
        console.log(
                    "Test - categories are correctly loaded",
                    Games.findOne(game._id),
                    Games.findOne(game._id).category,
                    Games.findOne(game._id).items
                  );
        // ------------------------------------
      }

      // conditionals for the 2 game modes
      if (gameMode == "classic"){
        Session.set("currentView", "lobby");
      } else if (gameMode == "advanced") {
        Session.set("currentView", "lobbyAdvanced");
      }
    });

    return false;
  },

  'click .btn-back': function () {
    Session.set("currentView", "startMenu");
    return false;
  }
});

Template.createGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  }
});

Template.createGame.rendered = function (event) {
  $("#player-name").focus();
};

Template.joinGame.events({
  'submit #join-game': function (event) {
    GAnalytics.event("game-actions", "gamejoin");

    var accessCode = event.target.accessCode.value;
    var playerName = event.target.playerName.value;

    accessCode = accessCode.trim();
    accessCode = accessCode.toLowerCase();

    Session.set("loading", true);

    Meteor.subscribe('games', accessCode, function onReady(){
      var game = Games.findOne({
        accessCode: accessCode
      });

      if (game) {

        Meteor.subscribe('players', game._id);

        player = generateNewPlayer(game, playerName);
        Session.set("gameID", game._id);
        Session.set("playerID", player._id);

        if (game.gameMode == "classic"){
          Session.set("currentView", "lobby");
        } else if (game.gameMode == "advanced") {
          Session.set("currentView", "lobbyAdvanced");
        }
      } else {
        FlashMessages.sendError(TAPi18n.__("ui.invalid access code"));
        GAnalytics.event("game-actions", "invalidcode");
      }
    });

    return false;
  },
  'click .btn-back': function () {
    Session.set("currentView", "startMenu");
    return false;
  }
});

Template.joinGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  },
});


Template.joinGame.rendered = function (event) {
  resetUserState();

  var urlAccessCode = Session.get('urlAccessCode');

  if (urlAccessCode){
    $("#access-code").val(urlAccessCode);
    $("#access-code").hide();
    $("#player-name").focus();
    Session.set('urlAccessCode', null);
  } else {
    $("#access-code").focus();
  }
};

Template.lobby.helpers({
  game: function () {
    return getCurrentGame();
  },
  accessLink: function () {
    return getAccessLink();
  },
  player: function () {
    return getCurrentPlayer();
  },
  players: function () {
    var game = getCurrentGame();
    var currentPlayer = getCurrentPlayer();

    if (!game) {
      return null;
    }

    var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();

    players.forEach(function(player){
      if (player._id === currentPlayer._id){
        player.isCurrent = true;
      }
    });

    return players;
  }
});

Template.lobby.events({
  'click .btn-leave': leaveGame,
  'click .btn-start': function () {
    GAnalytics.event("game-actions", "gamestart");

    var game = getCurrentGame();
    var item = getRandomItems();
    var players = Players.find({gameID: game._id});
    var localEndTime = moment().add(game.lengthInMinutes, 'minutes');
    var gameEndTime = TimeSync.serverTime(localEndTime);
    var oddIndex = Math.floor(Math.random() * players.count());
    var firstPlayerIndex = Math.floor(Math.random() * players.count());

    players.forEach(function(player, index){
      Players.update(player._id, {$set: {
        isOdd: index == oddIndex,
        isFirstPlayer: index === firstPlayerIndex
      }});
    });

    assignItems("classic", players, item);

    // THIS FUNCITON MIGHT NEED TO BE LOOKED AT
    // IMPROVE PERFORMANCE OR THE PROBLEM OF CERTAIN PLAYERS GETTING ODD ONLY
    Games.update(game._id, {$set: {state: 'inProgress', location: location, endTime: gameEndTime, paused: false, pausedTime: null}});
  },
  'click .btn-toggle-qrcode': function () {
    $(".qrcode-container").toggle();
  },
  'click .btn-remove-player': function (event) {
    var playerID = $(event.currentTarget).data('player-id');
    Players.remove(playerID);
  },
  'click .btn-edit-player': function (event) {
    var game = getCurrentGame();
    resetUserState();
    Session.set('urlAccessCode', game.accessCode);
    Session.set('currentView', 'joinGame');
  }
});

Template.lobby.rendered = function (event) {
  var url = getAccessLink();
  var qrcodesvg = new Qrcodesvg(url, "qrcode", 250);
  qrcodesvg.draw();
};

Template.lobbyAdvanced.helpers({
  game: function () {
    return getCurrentGame();
  },
  accessLink: function () {
    return getAccessLink();
  },
  player: function () {
    return getCurrentPlayer();
  },
  category: function () {
    return getCurrentCategory();
  },
  players: function () {
    var game = getCurrentGame();
    var currentPlayer = getCurrentPlayer();

    if (!game) {
      return null;
    }

    var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();

    players.forEach(function(player){
      if (player._id === currentPlayer._id){
        player.isCurrent = true;
      }
    });

    return players;
  }
});

Template.lobbyAdvanced.events({
  'click .btn-leave': leaveGame,
  'click .btn-start': function () {
    GAnalytics.event("game-actions", "gamestart");

    var game = getCurrentGame();
    var category = getCurrentCategory();
    var players = Players.find({gameID: game._id});
    var localEndTime = moment().add(game.lengthInMinutes, 'minutes');
    var gameEndTime = TimeSync.serverTime(localEndTime);
    var oddIndex = Math.floor(Math.random() * players.count());
    var firstPlayerIndex = Math.floor(Math.random() * players.count());

    players.forEach(function(player, index){
      Players.update(player._id, {$set: {
        isOdd: index == oddIndex,
        isFirstPlayer: index === firstPlayerIndex
      }});
    });

    assignAdvancedItems("advanced", players, game);

    // THIS FUNCITON MIGHT NEED TO BE LOOKED AT
    // IMPROVE PERFORMANCE OR THE PROBLEM OF CERTAIN PLAYERS GETTING ODD ONLY
    Games.update(game._id, {$set: {state: 'inProgress', location: location, endTime: gameEndTime, paused: false, pausedTime: null}});
  },
  'click .btn-toggle-qrcode': function () {
    $(".qrcode-container").toggle();
  },
  'click .btn-remove-player': function (event) {
    var playerID = $(event.currentTarget).data('player-id');
    Players.remove(playerID);
  },
  'click .btn-edit-player': function (event) {
    var game = getCurrentGame();
    resetUserState();
    Session.set('urlAccessCode', game.accessCode);
    Session.set('currentView', 'joinGame');
  },
  'submit #category-input': function (event) {
    var game = getCurrentGame();
    event.preventDefault();

    var categoryItem = event.target.categoryItem.value;
    categoryItem = categoryItem.trim();
    categoryItem = categoryItem.toLowerCase();

    // Add code here to edit the Mongo database for the category's item list
    // readup on $push on MongoDB to see if this is correct
    Games.update(game._id, {$push: {
      items: {item: categoryItem}
    }});

    event.target.categoryItem.value = "";
    return false;
  }
});

Template.lobbyAdvanced.rendered = function (event) {
  var url = getAccessLink();
  var qrcodesvg = new Qrcodesvg(url, "qrcode", 250);
  qrcodesvg.draw();
};

function getTimeRemaining(){
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();

  if (game.paused){
    var localPausedTime = game.pausedTime - TimeSync.serverOffset();
    var timeRemaining = localEndTime - localPausedTime;
  } else {
    var timeRemaining = localEndTime - Session.get('time');
  }

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

Template.gameView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  category: getCurrentCategory,
  players: function () {
    var game = getCurrentGame();

    if (!game){
      return null;
    }

    var players = Players.find({
      'gameID': game._id
    });

    return players;
  },
  items: function () {
    return items
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  }
});

Template.gameView.events({
  'click .btn-leave': leaveGame,
  'click .btn-end': endGame,
  'click .btn-toggle-status': function () {
    $(".status-container-content").toggle();
  },
  'click .game-countdown': function () {
    var game = getCurrentGame();
    var currentServerTime = TimeSync.serverTime(moment());

    if(game.paused){
      GAnalytics.event("game-actions", "unpause");
      var newEndTime = game.endTime - game.pausedTime + currentServerTime;
      Games.update(game._id, {$set: {paused: false, pausedTime: null, endTime: newEndTime}});
    } else {
      GAnalytics.event("game-actions", "pause");
      Games.update(game._id, {$set: {paused: true, pausedTime: currentServerTime}});
    }
  },
  'click .btn-vote': function () {
    // get the playerID instead to find it quicker, instead of a loop...DONE
    // meteor display messages
    // add function to limit one click per vote round..DONE
    // add function to keep track all players are voted -> vote out the max player
    // deal with ties
    // remove player from play, but not from game (authorization?)

    var game = getCurrentGame();
    var currentPlayer = getCurrentPlayer();

    if (!currentPlayer.voted) {
      var votedPlayerID = getRadioValue('selectedPlayer');
      Players.update(votedPlayerID, { $inc: {votes: 1}});

      console.log("testing - votebutton");
      console.log(votedPlayerID);
      console.log(Players.find().fetch());
      console.log(Players.findOne(votedPlayerID));

      // set player.voted to true after submitting a vote
      Players.update(currentPlayer._id, { $set: {voted: true}});

      console.log(currentPlayer._id);
      console.log(Players.findOne(currentPlayer._id));

      console.log(Players.find().count());

      // Refactored -PD
      var majorityVote = Players.find().count() / 2;
      // majorityVote = majorityVote / 2;

      if(Players.findOne(votedPlayerID).votes > majorityVote)
      {
        // flashmessages for the voted player
        if(Players.findOne(votedPlayerID).isOdd) {
          console.log("Great!");
          FlashMessages.sendSuccess("Great! The odd player was voted out!");
        } else if (!Players.findOne(votedPlayerID).isOdd) {
          console.log("Drag!");
          FlashMessages.sendWarning("Shoot! That wasn't the odd player.");
        }
        
        // Refactored -PD
        // var player = Players.findOne(votedPlayerID)
        // Players.remove(player._id);
        Players.remove(votedPlayerID);

        // I don't think this code should be here -PD
        // Session.set("playerID", null);



        if(currentPlayer._id == votedPlayerID)
          {
             GAnalytics.event("game-actions", "gameleave");
              // Not needed - PD
              // var player = getCurrentPlayer();
              Session.set("currentView", "startMenu");
              Session.set("playerID", null);
          }
      }

    } else {
      console.log("Current player has already voted");
    }

  }


  //   if (AllVotesIn()){
  //     console.log("ALL VOTES ARE IN");
  //     VotedOutPlayer = getVotedOutPlayer();
  //     if(!IsTie()){
  //       console.log("NOT A TIE");
  //     }else{
  //       console.log("TIE HAS OCCURED");
  //     }
  //   }
  // },
  // AllVotesIn: function (){
  //   var VotesNeeded = 0;
  //   Players.forEach(function(player){
  //     if (player.votedOut == false){
  //       ++VotesNeeded;
  //     }
  //   })
  //
  //   var TotalVotes = 0;
  //   TotalVotes = Players.forEach(function(player){
  //     TotalVotes = player.votes + TotalVotes;
  //   })
  //
  //   if (TotalVotes == VotesNeeded){
  //     return true;
  //   }else{
  //     return false;
  //   }
  // },
  // getVotedOutPlayer: function (){
  //   var MaxVotes = 0;
  //   var PlayerVotedOut = Players.forEach(function(player){
  //     if (player.votes > MaxVotes){
  //       PlayerName = player.name;
  //     }
  //     return PlayerName
  //   })
  //   return VotedOutPlayer;
  // },
  // IsTie: function () {
  //
  // }
});
