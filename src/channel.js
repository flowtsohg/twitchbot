let EventEmitter = require('events');
let Timer = require('./timer');

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

        this.timers = new Map();

        this.users = db.users;
        this.commands = db.commands;
        this.intervals = db.intervals;

        for (let interval of Object.values(db.intervals)) {
            let data = { command: interval, args: this.buildCommandArgs(interval) };

            this.addTimer(interval.name, () => this.runCommand(data), interval.timeout * 1000);
        }
    }
    
    addTimer(name, handler, timeout) {
        let timers = this.timers;

        if (!timers.has(name)) {
            timers.set(name, new Timer(name, handler, timeout));

            return true;
        }

        return false;
    }

    removeTimer(name) {
        let timers = this.timers,
            timer = timers.get(name);

        if (timer) {
            timer.stop();
        }

        return timers.delete(name);
    }

    stopTimers() {
        for (let timer of this.timers.values()) {
            timer.stop();
        }
    }
    
    join() {
        this.bot.rawMessage(`JOIN #${this.name}`);
    }

    part() {
        this.bot.rawMessage(`PART #${this.name}`);

        this.joined = false;

        this.stopTimers();

        this.emit('parted', this);
    }

    chatMessage(message) {
        if (!this.muted) {
            this.bot.rawMessage(`PRIVMSG #${this.name} :${message}`);
        }
    }

    whisperMessage(target, message) {
        this.bot.whisperMessage(target, message);
    }

    banUser(name) {
        this.bot.chatMessage(this.name, `/ban ${name}`);
    }

    unbanUser(name) {
        this.bot.chatMessage(this.name, `/unban ${name}`);
    }

    timeoutUser(name, duration) {
        this.bot.chatMessage(this.name, `/timeout ${name} ${duration}`);
    }

    untimeoutUser(name) {
        this.bot.chatMessage(this.name, `/untimeout ${name}`);
    }

    log(message) {
        this.bot.log(`#${this.name} ${message}`);
    }
    
    addInterval(name, timeout, response, overwriteIfExists) {
        let intervals = this.intervals;

        if (!intervals[name]) {
            let interval = {
                name,
                timeout,
                response
            };

            intervals[name] = interval;

            let data = { command: interval, args: this.buildCommandArgs(interval) };

            this.addTimer(interval.name, () => this.runCommand(data), timeout * 1000);

            return true;
        }

        if (overwriteIfExists) {
            let interval = intervals[name];

            interval.timeout = timeout;
            interval.response = response;
        }

        return false;
    }

    removeInterval(name) {
        let intervals = this.intervals;

        if (intervals[name]) {
            delete intervals[name];

            this.removeTimer(name);

            return true;
        }

        return false;
    }

    getInterval(name) {
        return this.intervals[name];
    }

    addCommand(name, permitted, response, overwriteIfExists) {
        let commands = this.commands;

        if (!commands[name]) {
            let command = {
                name,
                permitted,
                response
            };

            commands[name] = command;

            return true;
        }

        if (overwriteIfExists) {
            let command = commands[name];

            command.permitted = permitted;
            command.response = response;
        }

        return false;
    }

    removeCommand(name) {
        let commands = this.commands;

        if (commands[name]) {
            delete commands[name];

            return true;
        }

        return false;
    }

    getCommand(name) {
        return this.bot.getCommand(name) || this.commands[name];
    }

    getUserPrivLevel(userName) {
        // Owner.
        if (userName === this.bot.name) {
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

    isPrivilegedForCommand(userName, command) {
        for (let token of command.permitted) {
            if (token === 'all') {
                return true;
            } else if (token === 'mod') {
                if (this.mods.has(userName)) {
                    return true;
                }
            } else if (token === 'streamer') {
                if (userName === this.name) {
                    return true;
                }
            } else if (token === 'owner') {
                if (userName === this.bot.name) {
                    return true;
                }
            } else if (token === userName) {
                return true;
            }
        }

        return false;
    }

    buildCommandArgs(command, event) {
        let args = command.response.split(' ');

        if (event) {
            args.push(...event.data.split(' ').slice(1));
        }

        return args;
    }

    runCommand(data) {
        let args = data.args;

        if (args[0].startsWith('$')) {
            let nativeCommand = this.bot.nativeCommands.get(args[0].substring(1));
            
            if (nativeCommand) {
                nativeCommand(this, data);
            }
        } else {
            this.chatMessage(args.join(' '));
        }
    }

    handleCommand(event) {
        let message = event.data,
            command = this.getCommand(message.split(' ', 1)[0].toLowerCase());
        
        if (command) {
            if (this.isPrivilegedForCommand(event.user, command)) {
                this.runCommand({ command, event, args: this.buildCommandArgs(command, event) });
            } else {
                this.chatMessage(`@${event.user}, you are not allowed to use that.`);
            }
        }
    }

    handleEvent(event) {
        let type = event.type,
            user = event.user;

        // While the JOIN event should have been used to check if a user joined, it doesn't work like that.
        // Twitch batches join/part events and sends them sometimes after a long time.
        // This means that a user can join the channel and send a message long before the join event comes through.
        this.addChatter(user);

        if (type === 'message') {
            if (this.settings.commandsEnabled) {
                this.handleCommand(event);
            }
        } else if (type === 'join') {
            if (user === this.bot.name) {
                this.joined = true;

                // Load up this channel's chatters list.
                // While this requires an HTTP fetch, it is still a lot faster than waiting for the initial JOIN events.
                // See the comment above in handleEvent().
                this.loadChattersList();

                // Check if the channel is live right now.
                this.updateLive();

                // And check if the channel is live continuously forever.
                // Note that this may show wrong results for up to a couple of minutes after the channel changed modes.
                // Twitch. ¯\_(ツ)_/¯
                this.addTimer('$$channelupdatelive', () => this.updateLive(), 20000)

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

    loadChattersList() {
        this.bot.twitchAPI.fetchChatters(this.name)
            .then((json) => {
                let chatters = json.chatters;

                for (let mod of chatters.moderators) {
                    this.addChatter(mod);
                    this.mods.add(mod);
                }

                for (let viewer of chatters.viewers) {
                    this.addChatter(viewer);
                }
            });
    }

    updateLive() {
        if (!this.isHosting) {
            this.bot.twitchAPI.fetchStream(this.name)
                .then((json) => {
                    // Again, because the fetch might have happened before getting the host event.
                    if (json && !this.isHosting) {
                        let isLive = this.isLive;

                        if (json.stream) {
                            this.isLive = true;

                            if (!isLive) {
                                this.emit('live', this, json.stream);
                            }
                        } else {
                            this.isLive = false;

                            if (isLive) {
                                this.emit('live', this);
                            }
                        }
                    }
                })
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
        let newUser = Object.assign({}, this.settings.userDecl);

        newUser.name = name;

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
