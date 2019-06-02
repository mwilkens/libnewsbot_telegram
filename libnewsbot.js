const Slimbot = require('slimbot');
var FeedParser = require('feedparser');
var request = require('request');

const slimbot = new Slimbot(process.env['TELEGRAM_BOT_TOKEN']);
var req = request('https://www.liberationnews.org/feed/');
var feedparser = new FeedParser([]);

var saved_ids = [];
var last_article = null;

// Request Listeners

req.on('error', function (error) {
    // report the error
    console.log("[ERROR]: %s", error);
});

req.on('response', function(res){
    var stream = this;
    if (res.statusCode !== 200){
        this.emit('error', new Error('Bad status code'));
    } else {
        stream.pipe(feedparser);
    }
});

// FeedParser Listeners

feedparser.on('error', function(error){
    console.log("[ERROR]: %s", error);
});

// If we've recieved an RSS message
feedparser.on('readable', function() {
    var stream = this;
    var meta = this.meta;
    var item;
    while (item = stream.read()) {
        console.log("----------------------");
        console.log("Title: %s", item.title);
        console.log("Date: %s", item.date);
        console.log("Link: %s", item.link);
        console.log("Author: %s", item.author);
        for(var i=0; i < saved_ids.length; i++){
            slimbot.sendMessage(saved_ids[i], item.title + "\nby " + item.author + "\n" + item.link);
        }
        last_article = item;
    }
});

// Slimbot Listeners

// If we've got a message directly from a user
slimbot.on('message', message => {
    if (message.text == '/start'){
        saved_ids.push(message.chat.id);
        slimbot.sendMessage(message.chat.id, "Welcome to the Liberation News Bot! Here's the latest article...");
        if (last_article != null)
            slimbot.sendMessage(message.chat.id, last_article.title + "\nby " + last_article.author + "\n" + last_article.link);
    } else {
        slimbot.sendMessage(message.chat.id, 'Message received: ' + message.text);
    }
});

// Call API
slimbot.startPolling();
