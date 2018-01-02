let EventEmitter = require('events');
let net = require('net');
let readline = require('readline');
let fs = require('fs');
let Timer = require('./timer');
let Channel = require('./channel');
let nativeCommands = require('./commands/');

let PRIVMSG_RE = /^:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #(\w+) :(.+)/,
    WHISPER_RE = /^:(\w+)!\w+@\w+\.tmi\.twitch\.tv WHISPER #(\w+) :(.+)/,
    JOIN_PART_RE = /^:(\w+)!\w+@\w+\.tmi\.twitch\.tv (JOIN|PART) #(\w+)/,
    MODE_RE = /:jtv MODE #(\w+) (\+|\-)o (\w+)/,
    HOSTTARGET_RE = /^:tmi\.twitch\.tv HOSTTARGET #(\w+) :(\w+|-) (\d+|-)/,
    NAMES_LIST_RE = /^:\w+\.tmi\.twitch\.tv 353 (\w+) = #(\w+) :(.+)/,
    CONNECTED_RE = /^:tmi\.twitch\.tv 376 (\w+) :>/;

class Bot extends EventEmitter {
    constructor() {
        super();

        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }

        let db;

        if (fs.existsSync('./data/db.json')) {
            db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
        } else {
            db = { commands: {}, channels: {} };
        }

        if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
        }

        this.db = db;
        this.logFile = `logs/${this.getTimeStamp()}.txt`;
        this.logIO = true;
		this.logToConsole = true;
		this.logToFile = true;
        this.socket = new net.Socket();
        this.rl = readline.createInterface({ input: this.socket });
        this.connected = false;
        this.connectedEvent = false;
        this.name = '';
        this.oauth = '';
        this.clientid = '';
        this.channels = new Map();
        this.commands = db.commands;
        this.nativeCommands = new Map();
        this.queue = [];
        
        this.rl.on('line', (line) => this.onLine(line));
        this.socket.on('error', (e) => this.onError(e));
		this.socket.on('close', (e) => this.onClose(e));
		this.socket.on('timeout', (e) => this.onTimeout(e));
		this.socket.setEncoding('utf8');
        this.socket.setKeepAlive(true);

        for (let command of nativeCommands) {
            this.nativeCommands.set(command.name, command.handler);
        }

        this.timers = new Map();

        this.lastLineTime = 0;

        this.reconnectTimeout = 5000;
    }

    setMessageRate(value) {
        let timer = this.timers.get('$$handleonemessage');

        if (timer) {
            timer.setTimeout(1000 / (Math.min(value, 100) / 30));

            return true;
        }

        return false;
    }

    setSyncRate(value) {
        let timer = this.timers.get('$$savedb');

        if (timer) {
            timer.setTimeout(value * 1000);

            return true;
        }

        return false;
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

    saveDB() {
        this.log('Saving the database');

        // First copy the DB.
        // This is intentionally done with a syncronous read-write.
        // If the database is being saved and there is an unexpected shutdown, all of the data can be lost.
        // These operations do not affect the original file.
        // Therefore, if something happens, the original file should still be intact.
        // If something happens after this operation, the backup file could be used.
        fs.writeFileSync('./data/db-backup.json', fs.readFileSync('./data/db.json', 'utf8'));

        fs.writeFileSync('./data/db.json', JSON.stringify(this.db));
    }

    connect(name, oauth, clientid) {
        this.name = name;
        this.oauth = oauth;
        this.clientid = clientid;

        this.reconnect();
    }

    reconnect() {
        this.connecting = true;
        this.connected = false;

        this.log('Trying to connect...');

        this.socket.connect(6667, 'irc.twitch.tv', () => {
            // If more than one reconnect is attempted before success, this will be called multiple times.
            // The first time will set connected to true, and the following calls should be ignored.
            if (!this.connected) {
                this.log('Connected');

                this.connecting = false;
                this.connected = true;

                this.sendLine(`PASS ${this.oauth}`);
                this.sendLine(`NICK ${this.name}`);
                this.sendLine('CAP REQ :twitch.tv/membership');
                this.sendLine('CAP REQ :twitch.tv/commands');
            }
        });
    }

    onError(e) {
        this.log(`An error occured, trying to reconnect in ${this.reconnectTimeout / 1000} seconds`);

        setTimeout(() => this.reconnect(), this.reconnectTimeout);
    }

    onClose(e) {
		//console.log('Close', e);
	}
	
	onTimeout(e) {
		console.log('Timeout', e);
	}

    disconnect() {
        this.connected = false;

        this.socket.destroy();

        this.stopTimers();

        for (let channel of this.channels.values()) {
            channel.part();
        }

        this.saveDB();

        this.emit('disconnected', this);
    }

    joinChannel(name) {
        // All names must be lower case.
        name = name.toLowerCase();

        if (this.connected) {
            let channel = this.channels.get(name);

            if (!channel) {
                let channels = this.db.channels,
                    db = channels[name];

                if (!db) {
                    db = {
                        name,
                        settings: { commandsEnabled: false, userDecl: {} },
                        commands: {},
                        intervals: {},
                        users: {},
                        ignored: {}
                    };

                    channels[name] = db;
                }

                channel = new Channel(this, name, db);

                this.channels.set(name, channel);

                channel.join();
            }

            return channel;
        }
    }

    partChannel(name) {
        let channel = this.channels.get(name);

        if (channel) {
            this.channels.delete(name);

            channel.part();

            return true;
        }

        return false;
    }

    getTimeStamp() {
        let d = new Date();
        
        return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()} ${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.${d.getMilliseconds()}`;
    }

    log(message) {
        let data = `[${this.getTimeStamp()}] ${message}`;
		
		if (this.logToFile) {
			fs.appendFileSync(this.logFile, `${data}\r\n`);
		}
		
		if (this.logToConsole) {
			console.log(data);
		}
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
        return this.commands[name];
    }

    sendLine(line) {
        this.socket.write(`${line}\r\n`);

        if (this.logIO) {
            this.log(`> ${line}`);
        }
    }

    rawMessage(message) {
        this.queue.push(message);
    }

    whisperMessage(target, message) {
        this.queue.push(`PRIVMSG #jtv :/w ${target} ${message}`);
    }

    onLine(line) {
        this.lastLineTime = Date.now();

        if (this.logIO) {
            this.log(`< ${line}`);
        }

        let event = this.parseLine(line);
        if (event) {
            this.handleEvent(event)
        }
    }
	
    parseLine(line) {
        let match;

        if (line === 'PING :tmi.twitch.tv') {
            return { type: 'ping' };
        }

        if (line === ':tmi.twitch.tv CAP * ACK :twitch.tv/membership') {
            return { type: 'membership' };
        }

        if (line === ':tmi.twitch.tv CAP * ACK :twitch.tv/commands') {
            return { type: 'commands' }
        }

        match = line.match(PRIVMSG_RE);
        if (match) {
            return { type: 'message', user: match[1], channel: match[2], data: match[3] };
        }

        match = line.match(WHISPER_RE);
        if (match) {
            return { type: 'whisper', user: match[1], target: match[2], data: match[3] };
        }

        match = line.match(JOIN_PART_RE);
        if (match) {
            return { type: match[2].toLowerCase(), user: match[1], channel: match[3] };
        }

        match = line.match(MODE_RE);
        if (match) {
            return { type: 'mode', channel: match[1], user: match[3], mode: match[2] };
        }

        match = line.match(NAMES_LIST_RE);
        if (match) {
            return { type: 'names', channel: match[2], user: match[1], data: match[3] };
        }

        match = line.match(HOSTTARGET_RE);
        if (match) {
            return { type: 'host', channel: match[1], user: match[1], target: match[2], viewers: match[3] };
        }

        match = line.match(CONNECTED_RE);
        if (match) {
            return { type: 'connected', user: match[1] };
        }
    }

    handleEvent(event) {
        let type = event.type;

        if (type === 'message' || type === 'join' || type === 'part' || type === 'mode' || type === 'names' || type === 'host') {
            let channel = this.channels.get(event.channel);
            if (channel) {
                channel.handleEvent(event);
            }
        } else if (type === 'ping') {
            this.rawMessage('PONG :tmi.twitch.tv');
        } else if (type === 'connected') {
            // The connected event from Twitch can happen more than once, e.g. in case the bot reconnected.
            // Therefore, only add the timers if this is the first time.
            if (!this.connectedEvent) {
                this.connectedEvent = true;

                // Handle incoming messages.
                this.addTimer('$$handleonemessage', () => this.handleOneMessage(), 1000 / (20 / 30));

                // Save the database.
                this.addTimer('$$savedb', () => this.saveDB(), 30000);
                
                // Sometimes, for no apparent reason, Twitch will stop communicating with the bot.
                // This checks if more than 6 minutes passed since the last message (Twitch sends a PING every ~5 minutes).
                // If more time passed, it is assumed a reconnect is needed.
                this.addTimer('$$checkconnection', () => this.checkConnection(), 5000);
            }

            // If there are already channels, e.g. in case the bot reconnected, rejoin them.
            for (let channel of this.channels.values()) {
                channel.join();
            }
        }

        this.emit(type, this, event);
    }

    checkConnection() {
        // Did 6 minutes pass since the last message?
        if (Date.now() - this.lastLineTime > 360000) {
            this.log('The bot seems to have disconnected for some reason. Trying to reconnect.');
            this.reconnect();

        }
    }

    handleOneMessage() {
        let queue = this.queue;

        if (queue.length > 0) {
            let line = queue.shift();

            if (line === 'DIE') {
                this.disconnect();
            } else {
                this.sendLine(line);
            }
        }
    }
}

module.exports = Bot;
