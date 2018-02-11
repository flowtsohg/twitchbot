let EventEmitter = require('events');
let Timer = require('./timer');
let twitchApi = require ('./twitchapi');
let Commands = require('./commands');
let Intervals = require('./intervals');

class Channel extends EventEmitter {
    constructor(bot, name, db) {
        super();

        this.db = db;
        this.settings = db.settings;
        this.bot = bot;
        this.name = name.toLowerCase();
        this.joined = false;

        this.muted = false;
        
        this.isLive = false;
        this.isHosting = false;
        this.hostTarget = '';

        this.chatters = new Map();
        this.mods = new Set();

        this.liveUpdater = new Timer(() => this.updateLive(), 30000);

        this.users = db.users;

        this.commands = new Commands(db, bot.commands);

        this.intervals = new Intervals(db);
        this.intervals.on('fired', (interval) => this.runCommand({ command: interval, args: this.buildCommandArgs(interval) }));
    }

    part() {
        this.joined = false;

        this.liveUpdater.stop();

        this.intervals.stop();

        this.emit('parted', this);
    }

    message(message) {
        if (!this.muted) {
            this.bot.message(this.name, message);
        }
    }

    log(message) {
        this.bot.log(`#${this.name} ${message}`);
    }

    getUserPrivLevel(userName) {
        // Owner.
        if (userName === this.bot.connection.name) {
            return 3;
        // Streamer.
        } else if (userName === this.name) {
            return 2;
        // Moderator.
        } else if (this.mods.has(userName)) {
            return 1;
        }

        // Normal user.
        return 0;
    }

    // See if a user matches any of the tokens in a command, and thus is allowed to run it.
    getPrivToken(userName, command) {
        for (let token of command.permitted) {
            if (token === userName) {
                return userName;
            } else if (token === 'owner') {
                if (userName === this.bot.connection.name) {
                    return 'owner';
                }
            } else if (token === 'streamer') {
                if (userName === this.name) {
                    return 'streamer';
                }
            } else if (token === 'mod') {
                if (this.mods.has(userName)) {
                    return 'mod';
                }
            } if (token === 'all') {
                return 'all';
            } 
        }

        return '';
    }

    isPrivForCommand(userName, command) {
        // See if the user matches one of the privilege tokens.
        // The bot owner is always privileged.
        return !!this.getPrivToken(userName, command) || userName === this.bot.name;
    }

    buildCommandArgs(command, event) {
        let args = command.response.split(' ');
        
        if (event) {
            let eventArgs = event.data.split(' ').slice(1),
                elementsToRemove = [];
            
            for (let i = 0, l = args.length; i < l; i++) {
                let arg = args[i],
                    match;
                
                // Replace $argN with the Nth event argument.
                match = arg.match(/\$arg(\d+)/);
                if (match) {
                    let index = parseInt(match[1], 10),
                        eventArg = eventArgs[index];

                    if (eventArg) {
                        args[i] = eventArg;

                        elementsToRemove.push(index)
                    }
                }

                // Replace $user with the event user.
                if (arg === '$user') {
                    args[i] = event.user;
                }
            }

            // Remove duplicates and sort.
            elementsToRemove = [...new Set(elementsToRemove)].sort((a, b) => b - a);

            // Remove event arguments that were injected.
            for (let i of elementsToRemove) {
                eventArgs.splice(i, 1);
            }

            args.push(...eventArgs);
        }

        return args;
    }

    runCommand(data) {
        let args = data.args,
            arg0 = args[0];

        if (arg0.startsWith('$')) {
            let command = this.bot.nativeCommands.get(arg0.substring(1));

            if (command) {
                // Remove the native command name.
                args.shift();

                // Run the command.
                command(this, data);
                
                return;
            }
        }

        this.message(args.join(' '));
    }

    handleCommand(event) {
        let message = event.data,
            command = this.commands.get(message.split(' ', 1)[0].toLowerCase());
        
        if (command) {
            if (this.isPrivForCommand(event.user, command)) {
                this.runCommand({ command, event, args: this.buildCommandArgs(command, event) });
            } else {
                this.message(`@${event.user}, you are not allowed to use that.`);
            }
        }
    }

    handleEvent(event) {
        let type = event.type,
            tags = event.tags,
            user = event.user || tags['display-name'];

        // The ROOMSTATE event doesn't contain a user.
        if (user) {
            // While the JOIN event should have been used to check if a user joined, it doesn't work like that.
            // Twitch batches join/part events and sends them sometimes after a long time.
            // This means that a user can join the channel and send a message long before the join event comes through.
            this.addChatter(user);
    
            // Another place to get mod status.
            if (tags.mod === '1') {
                this.mods.add(user);
            }
        }

        if (type === 'message') {
            if (this.settings.commandsEnabled) {
                this.handleCommand(event);
            }
        } else if (type === 'join') {
            if (user === this.bot.connection.name) {
                // Load up this channel's chatters list.
                // While this requires an HTTP fetch, it is still a lot faster than waiting for the initial JOIN events.
                // See the comment above in handleEvent().
                this.loadChattersList();
                
                // Check if the channel is live right now.
                this.updateLive();

                // If this is the first time joining.
                if (!this.joined) {
                    // And check if the channel is live continuously forever.
                    // Note that this may show wrong results for up to a couple of minutes after the channel changed modes.
                    // Twitch. ¯\_(ツ)_/¯
                    this.liveUpdater.start();
                }

                this.joined = true;

                this.emit('joined', this, event);
            }
        } else if (type === 'part') {
            this.chatters.delete(user);
        } else if (type === 'mode') {
            if (event.mode === '+') {
                this.mods.add(user);
            } else {
                this.mods.delete(user);
            }
        } else if (type === 'names') {
            // Handle the names list, even though it's not really needed due to the chatters list being obtained via HTTP above in the 'join' event.
            for (let name of event.data.split(' ')) {
                this.addChatter(name);
            }
        } else if (type === 'host') {
            let target = event.target;

            if (target === '-') {
                this.isHosting = false;
                this.hostTarget = '';
            } else {
                this.isHosting = true;
                this.hostTarget = target;

                if (this.isLive) {
                    this.isLive = false;

                    this.emit('live', this);
                }
            }
        }

        this.emit(type, this, event);
    }

    async loadChattersList() {
        this.log('Trying to get chatters list...');

        let json = await twitchApi.getChatters(this.name);

        if (json) {
            let chatters = json.chatters;

            this.log(`Got chatters list with ${chatters.moderators.length} mods and ${chatters.viewers.length} viewers.`);

            for (let mod of chatters.moderators) {
                this.addChatter(mod);
                this.mods.add(mod);
            }

            for (let viewer of chatters.viewers) {
                this.addChatter(viewer);
            }
        }
    }

    async updateLive() {
        if (!this.isHosting) {
            let json = await twitchApi.getStream(this.bot.clientid, this.name);

            // Check if hosting again, because the fetch might have happened before getting the host event.
            if (json && !this.isHosting) {
                let isLive = !!json.stream;

                if (isLive !== this.isLive) {
                    this.isLive = isLive;

                    // If live the stream object is given, otherwise it will be undefined.
                    this.emit('live', this, json.stream)
                }
            }
        }
    }

    addChatter(name) {
        // If this user is a chatter, there is no need to do anything.
        let chatters = this.chatters;
        if (chatters.has(name)) {
            return false;
        }

        // If this user is in the DB, add it to the chatters.
        let users = this.users,
            user = users[name];

        if (user) {
            chatters.set(name, user);
            return true;
        }

        // This is a new user, so create it, add it to the DB, and add it to the chatters.
        let newUser = { name };

        users[name] = newUser;
        chatters.set(name, newUser);

        return true;
    }

    getUser(name, autocomplete) {
        // Allow to refer to users with the Twitch @user notation.
        if (name[0] === '@') {
            name = name.substring(1);
        }

        let chatters = this.chatters,
            chatter = chatters.get(name);

        if (chatter) {
            return chatter;
        }

        if (autocomplete) {
            for (let chatter of chatters.values()) {
                if (chatter.name.startsWith(name)) {
                    return chatter;
                }
            }
        }
        
        let users = this.users,
            user = users[name];
        
        if (user) {
            return user;
        }

        if (autocomplete) {
            for (let user of Object.values(users)) {
                if (user.name.startsWith(name)) {
                    return user;
                }
            }
        }

        return null;
    }
}

module.exports = Channel;
