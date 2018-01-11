let Bot = require('twitch-bot');

// Make a new bot and connect to Twitch using a name and an OAuth token.
// You can get the token here: http://www.twitchapps.com/tmi/
// In addition, if you want to use the Twitch API, you need a client ID.
// You can get the ID from here: https://dev.twitch.tv/dashboard/apps
let bot = new Bot('name', 'oauth', 'clientid');

bot.connect();

// When the bot is connected...
bot.on('connected', (bot, event) => {
	// This sets the amount of messages the bot can response per 30 seconds.
	// If you join only channels that you are a moderator on, you can send up to 100 messages.
	// Otherwise, the maximum is 20.
	// This is enforced by Twitch, and exceeding these limits can get you banned for 30 minutes.
	// Defaults to 20.
    bot.connection.setMessagesPerHalfMinute(100);
	
	// The rate at which the database is saved, in miliseconds.
	// Defaults to once per minute.
    bot.db.setSaveTimeout(60000);
	
	// Add a global command that will be accessible on all channels.
	// First argument is the name - what the chatters will type to use the command.
	// Second argument is an array of permissions.
	// Possible permissions are 'all', 'mod', 'streamer', 'owner', and any specific user name.
	// The third argument is the command response.
	// If the response starts with a dollar sign, the bot will try to match a native command.
	// In this case, it will find the native 'commands' command that lists all of the available commands.
    bot.addCommand('!commands', ['all'], '$commands list');
	
	// Another example that calls the 'intervals' native command.
    bot.addCommand('!intervals', ['mod', 'owner'], '$intervals list');
	
	// Allow the streamer and the bot owner to mute and umute it.
    bot.addCommand('!mute', ['streamer', 'owner'], '$mute 1');
    bot.addCommand('!unmute', ['streamer', 'owner'], '$mute');
	
	// Join a Twitch channel with the given name.
    let channel = bot.join('name');
	
	// Let's set some channel specific settings.
    let settings = channel.settings;
	
	// Enable commands for this channel
    settings.commandsEnabled = true;
	
	// Used by the points native command, which defines its own defaults if you don't care.
    settings.pointsNameSingle = 'meme';
    settings.pointsNamePlural = 'memes';
	
	// Channel specific commands are added exactly like global commands.
    channel.addCommand('!hours', ['all'], '$hours');
    channel.addCommand('!points', ['all'], '$points get');
    channel.addCommand('!howlong', ['all'], '$howlong');
	
	// Channels also support intervals - commands that get executed automatically every period of time.
	// The first argument is the name of the interval. Use it later to reference to this interval.
	// The second argument is the interval timeout, in seconds.
	// The third argument is the response, much like commands.
	// In this case, I want to add a point to all of the chatters every 300 seconds, but only if the channel is currently live.
    channel.addInterval('channeladdpoints', 300, '$iflive $channeladdpoints 1');
	
	// And add 5 seconds to all chatters every 5 seconds if the channel is live.
    channel.addInterval('channeladdseconds', 5, '$iflive $channeladdseconds 5');
	
	// You can attach event listeners to many events.
	// In the case of 'live', if stream is defined it will contain the stream information.
	// If it's undefined, the stream is no longer live.
    channel.on('live', (channel, stream) => {
        if (stream) {
            console.log(`#${channel.name} is now live.`);
        } else {
            console.log(`#${channel.name} is no longer live.`);
        }
    });
	
	// Hosting - you can check channel.isHosting for the status.
	// channel.hostTarget contains the name of the hosted channel.
    channel.on('host', (channel, event) => {
        if (channel.isHosting) {
            console.log(`#${channel.name} now hosting #${channel.hostTarget}.`);
        } else {
            console.log(`#${channel.name} is no longer hosting anyone.`);
        }
    });
});
