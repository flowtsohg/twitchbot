let EventEmitter = require('events');
let Connection = require('./connection');
let Channel = require('./channel');
let nativeCommands = require('./commands/');
let Logger = require('./logger');
let DB = require('./db');

class Bot extends EventEmitter {
    constructor(name, oauth, clientid) {
        super();

        this.logger = new Logger('./logs');

        this.db = new DB('./data', { commands: {}, channels: {} });
        this.db.on('saved', () => this.log('Saved the database'));

        this.connection = new Connection(name, oauth);
        this.connection.on('connecting', () => this.log('Trying to connect...'));
        this.connection.on('connected', () => this.log('Connected'));
        this.connection.on('reconnecting', (timeout) => this.log(`An error occured, trying to reconnect in ${timeout / 1000} seconds`));
        this.connection.on('received', (data) => this.received(data));
        this.connection.on('sent', (data) => this.sent(data));
        
        this.clientid = clientid;

        this.channels = new Map();
        this.nativeCommands = new Map();

        for (let command of nativeCommands) {
            this.nativeCommands.set(command.name, command.handler);
        }
    }

    log(message) {
        this.logger.log(message);
    }

    connect() {
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
                        settings: { commandsEnabled: false },
                        commands: {},
                        intervals: {},
                        users: {}
                    };

                    channels[name] = db;
                }

                channel = new Channel(this, name, db);

                this.channels.set(name, channel);

                this.connection.join(name);
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

    received(event) {
        this.log(`< ${event.line}`);

        if (event.channel) {
            let channel = this.channels.get(event.channel);
            if (channel) {
                channel.handleEvent(event);
            }
        } else if (event.type === 'connected') {
            // If there are already channels, e.g. in case the bot reconnected, rejoin them.
            for (let channel of this.channels.values()) {
                this.connection.join(channel.name);
            }
        }

        this.emit(event.type, this, event);
    }

    addCommand(name, permitted, response) {
        this.db.db.commands[name] = { name, permitted, response };
    }

    removeCommand(name) {
        delete this.db.db.commands[name];
    }

    getCommand(name) {
        return this.db.db.commands[name];
    }
}

module.exports = Bot;
