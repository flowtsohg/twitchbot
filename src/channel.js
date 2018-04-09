let EventEmitter = require('events');
let Timer = require('./timer');
let twitchApi = require('./twitchapi');
let Commands = require('./commands');
let Intervals = require('./intervals');
let Users = require('./users');

module.exports = class Channel extends EventEmitter {
    constructor(bot, name, db) {
        super();

        this.bot = bot;
        this.name = name.toLowerCase();
        this.db = db;
        this.settings = db.settings;

        this.joined = false;

        this.muted = false;

        // Live status.
        this.isLive = false;

        // Outgoing hosts.
        this.isHosting = false;
        this.hostTarget = '';

        // Incoming hosts.
        this.isHosted = false;
        this.hosts = new Set();

        // bot.commands is used as the parent of this commands object.
        // This adds automatic lookup of global commands when no channel specific commands are matched.
        this.commands = new Commands(db, bot.commands);

        // The channel's message queue.
        this.queue = [];

        // The last time a command ran.
        this.lastCommandTime = 0;

        this.intervals = new Intervals(db);
        this.intervals.on('fired', (interval) => this.runCommand({ command: interval, args: this.buildCommandArgs(interval) }));

        this.users = new Users(db);
        this.users.on('added', (user) => this.eachUser(user));

        this.updater = new Timer(() => this.update(), 30000);
    }

    // Called for each new user.
    // This allows commands to add specific data they want to each user.
    // For example, the points command sets the points field of each user.
    eachUser(user) {
        for (let command of this.bot.nativeCommands.values()) {
            if (typeof command.eachUser === 'function') {
                command.eachUser(user);
            }
        }
    }

    // Called automatically.
    join() {
        this.joined = true;

        this.updater.start();
        this.update();

        this.intervals.start();

        // Load up this channel's chatters list.
        // While this requires an HTTP fetch, it is still a lot faster than waiting for the initial JOIN events.
        // See the comment below in handleEvent().
        this.loadChattersList();
    }

    part() {
        this.joined = false;

        this.updater.stop();
        this.intervals.stop();

        this.emit('parted');
    }

    disconnected() {
        this.joined = false;

        this.updater.stop();
        this.intervals.stop();
    }

    message(message) {
        if (!this.muted) {
            this.queue.push(message);
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
        } else if (this.users.mods.has(userName)) {
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
                if (this.users.mods.has(userName)) {
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
                let arg = args[i];

                // Replace $argN with the Nth event argument.
                let match = arg.match(/\$arg(\d+)/);

                if (match) {
                    let index = parseInt(match[1], 10),
                        eventArg = eventArgs[index];

                    if (eventArg) {
                        args[i] = eventArg;

                        elementsToRemove.push(index)
                    }
                }

                // Handle interpolations.
                switch (arg) {
                    case '$user':
                        args[i] = event.user;
                        break;

                    case '$streamer':
                        args[i] = this.name;
                        break;

                    case '$owner':
                        args[i] = this.bot.connection.name;
                        break;

                    case '$hosttarget':
                        args[i] = this.hostTarget;
                        break;
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
                command.handler(this, data);

                return;
            }
        }

        this.message(args.join(' '));
    }

    handleCommand(event) {
        let message = event.data,
            command = this.commands.get(message.split(' ', 1)[0].toLowerCase());

        if (command) {
            let t = Date.now();

            // If the time since the last command is bigger than the commands delay, run the command.
            if (t - this.lastCommandTime > this.settings.commandsDelay) {
                this.lastCommandTime = t;

                // But only run it if the user is allowed to.
                if (this.isPrivForCommand(event.user, command)) {
                    this.runCommand({ command, event, args: this.buildCommandArgs(command, event) });
                } else {
                    this.message(`@${event.user}, you are not allowed to use that.`);
                }
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
            this.users.add(user);

            // Another place to get mod status.
            if (tags.mod === '1') {
                this.users.setMod(user, true);
            }
        }

        if (type === 'message') {
            if (this.settings.commandsEnabled) {
                this.handleCommand(event);
            }
        } else if (type === 'part') {
            this.users.remove(user);
        } else if (type === 'mode') {
            if (event.mode === '+') {
                this.users.setMod(user, true);
            } else {
                this.users.setMod(user, false);
            }
        } else if (type === 'names') {
            // Handle the names list, even though it's not really needed due to the chatters list being obtained via HTTP above in join().
            for (let name of event.data.split(' ')) {
                this.users.add(name);
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

                    this.emit('live');
                }
            }
        }

        this.emit(type, event);
    }

    async loadChattersList() {
        this.log('Trying to get chatters list...');

        let json = await twitchApi.getChatters(this.name);

        if (json) {
            let chatters = json.chatters,
                users = this.users;

            this.log(`Got chatters list with ${chatters.moderators.length} mods and ${chatters.viewers.length} viewers.`);

            for (let mod of chatters.moderators) {
                users.add(mod);
                users.setMod(mod, true);
            }

            for (let viewer of chatters.viewers) {
                users.add(viewer);
            }
        }
    }

    async update() {
        // Check if the channel is live or not.
        // Note that this may be delayed a lot, depending on Twitch.
        if (!this.isHosting) {
            let json = await twitchApi.getStream(this.bot.clientid, this.name);

            // Check if hosting again, because the fetch might have happened before getting the host event.
            if (json && !this.isHosting) {
                let isLive = !!json.stream;

                if (isLive !== this.isLive) {
                    this.isLive = isLive;

                    // Clear hosts when the channel goes offline.
                    if (!isLive) {
                        this.isHosted = false;
                        this.hosts.clear();
                    }

                    // If live the stream object is given, otherwise it will be undefined.
                    this.emit('live', json.stream)
                }
            }
        }

        // If the channel is live, check if someone is hosting it, and update the hosts.
        if (this.isLive) {
            let json = await twitchApi.getHosts(this.bot.clientid, this.name);

            if (json && json.hosts.length) {
                let hosts = new Set();

                for (let host of json.hosts) {
                    hosts.add(host.host_login);
                }

                // Remove hosts that are no longer hosting.
                for (let host of this.hosts) {
                    if (!hosts.has(host)) {
                        this.hosts.delete(host);

                        this.emit('hosted', host, false);
                    }
                }

                // Add new hosts.
                for (let host of hosts) {
                    if (!this.hosts.has(host)) {
                        this.hosts.add(host);

                        this.emit('hosted', host, true);
                    }
                }

                this.isHosted = this.hosts.length > 0;
            }
        }
    }
};
