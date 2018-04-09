let EventEmitter = require('events');
let Connection = require('./connection');
let Channel = require('./channel');
let nativeCommands = require('./commands/');
let Logger = require('./logger');
let DB = require('./db');
let Commands = require('./commands');

module.exports = class Bot extends EventEmitter {
    constructor(name, oauth, clientid) {
        super();

        this.logger = new Logger('./logs');

        this.db = new DB('./data', { commands: {}, aliases: {}, channels: {} });
        this.db.on('saved', () => this.log('Saved the database'));

        this.commands = new Commands(this.db.db);

        this.connection = new Connection(name, oauth);
        this.connection.on('connecting', () => this.log('Connecting...'));
        this.connection.on('connected', () => this.connected());
        this.connection.on('reconnecting', (timeout, reason) => this.reconnecting(timeout, reason));
        this.connection.on('received', (data) => this.received(data));
        this.connection.on('sent', (data) => this.sent(data));
        this.connection.on('idle', () => this.sendBatch());
        this.connection.on('joined', (channel) => this.joinedChannel(channel));

        // Needed for Twitch API calls.
        this.clientid = clientid;

        this.channels = new Map();

        this.nativeCommands = new Map();

        for (let command of nativeCommands) {
            this.nativeCommands.set(command.name, command);
        }
    }

    // Called for each new channel.
    // This allows commands to add specific data they want to each channel.
    // For example, the table command sets the tables field.
    eachChannel(channel) {
        for (let command of this.nativeCommands.values()) {
            if (typeof command.eachChannel === 'function') {
                command.eachChannel(channel);
            }
        }
    }

    log(message) {
        this.logger.log(message);
    }

    connect() {
        this.db.connect();
        this.connection.connect();
    }

    disconnect() {
        this.connection.disconnect();

        for (let channel of this.channels.values()) {
            channel.part();
        }

        this.db.disconnect();

        this.emit('disconnected', this);
    }

    join(name) {
        // All names must be lower case.
        name = name.toLowerCase();

        if (this.connection.connected) {
            let channel = this.channels.get(name);

            if (!channel) {
                let channels = this.db.db.channels,
                    db = channels[name];

                if (!db) {
                    db = {
                        name,
                        commands: {},
                        aliases: {},
                        intervals: {},
                        users: {},
                        settings: {
                            // Commands are disabled by default.
                            commandsEnabled: false,
                            // A default delay between accepting commands.
                            commandsDelay: 500
                        }
                    };

                    channels[name] = db;
                }

                channel = new Channel(this, name, db);

                this.channels.set(name, channel);

                this.eachChannel(channel.db);

                this.connection.join(name);

                this.log(`Joining #${name}...`);
            }

            return channel;
        }
    }

    part(name) {
        let channel = this.channels.get(name);

        if (channel) {
            this.channels.delete(name);

            this.connection.part(name);

            channel.part();

            return true;
        }

        return false;
    }

    raw(message) {
        this.connection.raw(message);
    }

    message(channel, message) {
        this.connection.message(channel, message);
    }

    whisper(target, message) {
        this.connection.whisper(target, message);
    }

    sent(data) {
        this.log(`> ${data}`);
    }

    // Called when Twitch sends a successful connection.
    connected() {
        this.log('Connected');

        // If there are any channels, rejoin them.
        // This will happen if the bot reconnects for any reason.
        for (let channel of this.channels.values()) {
            this.log(`Rejoining #${channel.name}...`);

            this.connection.join(channel.name);
        }
    }

    reconnecting(timeout, reason) {
        this.log(`Reconnecting in ${timeout / 1000} seconds. Reason: ${reason}`);

        for (let channel of this.channels.values()) {
            channel.disconnected();
        }
    }

    joinedChannel(channel) {
        this.log(`Joined #${channel}`);

        this.channels.get(channel).join();
    }

    received(event) {
        this.log(`< ${event.line}`);

        if (event.channel) {
            let channel = this.channels.get(event.channel);

            if (channel) {
                channel.handleEvent(event);
            }
        }

        this.emit(event.type, this, event);
    }

    sendBatch() {
        // Grab one message from each channel and forward it to the connection.
        for (let [name, channel] of this.channels) {
            if (channel.queue.length) {
                this.connection.message(name, channel.queue.shift());
            }
        }
    }
};
