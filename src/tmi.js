let EventEmitter = require('events');
let net = require('net');
let readline = require('readline');
let fetch = require('node-fetch');
let Timer = require('./timer');

let PRIVMSG_RE = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #(\w+) :(.+)/,
    WHISPER_RE = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv WHISPER #(\w+) :(.+)/,
    JOIN_PART_RE = /:(\w+)!\w+@\w+\.tmi\.twitch\.tv (JOIN|PART) #(\w+)/,
    MODE_RE = /:jtv MODE #(\w+) (\+|\-)o (\w+)/,
    HOSTTARGET_RE = /:tmi\.twitch\.tv HOSTTARGET #(\w+) :(\w+|-) (\d+|-)/,
    NAMES_LIST_RE = /:\w+\.tmi\.twitch\.tv 353 (\w+) = #(\w+) :(.+)/,
    CONNECTED_RE = /:tmi\.twitch\.tv 376 (\w+) :>/,
    USER_ROOM_STATE_RE = /:tmi\.twitch\.tv (USERSTATE|ROOMSTATE) #(\w+)/;

class Connection extends EventEmitter {
    constructor(name, oauth) {
        super();

        this.name = name;
        this.oauth = oauth;
        
        this.connecting = false;
        this.connected = false;
        this.reconnectTimeout = 5000;

        this.socket = new net.Socket();
        this.socket.setEncoding('utf8');
        this.socket.setKeepAlive(true);
        this.socket.on('error', (e) => this.reconnect(e));

        this.rl = readline.createInterface({ input: this.socket });
        this.rl.on('line', (line) => this.receive(line));

        this.messageTimer = new Timer(() => this.sendOneMessage(), 1000 / (20 / 30));
        this.queue = [];

        // Sometimes Twitch seems to lose connection and stop sending pings or any other messages, without a clear disconnection.
        // This timer sends a ping to Twitch every 5 minutes.
        // If the ping is not answered with a pong within 10 seconds, the connection is assumed to be dead, which will trigger a reconnection.
        this.pingTimer = new Timer(() => this.ping(), 300000);
        this.pongTimeout = null;
    }

    setMessagesPerHalfMinute(value) {
        this.messageTimer.setTimeout(1000 / (Math.max(20, Math.min(value, 100)) / 30));
    }

    sendOneMessage() {
        if (this.queue.length > 0) {
            this.send(this.queue.shift());
        }
    }

    join(channel) {
        this.queue.push(`JOIN #${channel}`)
    }

    part(channelName) {
        this.queue.push(`PART #${channel}`)
    }

    raw(message) {
        this.queue.push(message);
    }

    message(channel, message) {
        this.queue.push(`PRIVMSG #${channel} :${message}`);
    }
    
    whisper(target, message) {
        this.queue.push(`PRIVMSG #jtv :/w ${target} ${message}`);
    }

    ping() {
        this.queue.push('PING');
    }

    pong() {
        this.queue.push('PONG :tmi.twitch.tv');
    }

    receive(line) {
        let data = this.parse(line);

        // Pong the ping.
        if (data.type === 'ping') {
            this.pong();
        }

        if (data.type === 'pong') {
            clearTimeout(this.pongTimeout);
        }

        this.emit('received', data);
    }

    send(data) {
        this.socket.write(`${data}\r\n`);

        if (data === 'PING :tmi.twitch.tv') {
            this.pongTimeout = setTimeout(() => this.reconnect(), 10000);
        }

        this.emit('sent', data);
    }

    connect() {
        this.connecting = true;
        this.connected = false;

        this.pingTimer.stop();

        this.emit('connecting');

        this.socket.connect(6667, 'irc.twitch.tv', () => {
            // If more than one reconnect is attempted before success, this will be called multiple times.
            // The first time will set connected to true, and the following calls should be ignored.
            if (!this.connected) {
                this.connecting = false;
                this.connected = true;

                this.send(`PASS ${this.oauth}`);
                this.send(`NICK ${this.name}`);
                this.send(`CAP REQ :twitch.tv/membership`);
                this.send(`CAP REQ :twitch.tv/commands`);
                this.send(`CAP REQ :twitch.tv/tags`);

                this.pingTimer.start();

                this.emit('connected');
            }
        });
    }

    reconnect(e) {
        this.connected = false;

        this.pingTimer.stop();

        clearTimeout(this.pongTimeout);

        setTimeout(() => this.connect(), this.reconnectTimeout);

        this.emit('reconnecting', this.reconnectTimeout);
    }

    disconnect() {
        this.connecting = false;
        this.connected = false;
        
        this.pingTimer.stop();

        clearTimeout(this.pongTimeout);

        this.socket.destroy();

        this.messageTimer.stop();

        this.emit('disconnected');
    }

    parse(line) {
        let tags = {},
            match;
    
        match = line.match(/^@([^ ]+)/);
        if (match) {
            for (let tag of match[1].split(';')) {
                let [key, value] = tag.split('=');
    
                tags[key] = value;
            }
        }
    
        match = line.match(PRIVMSG_RE);
        if (match) {
            return { line, tags, type: 'message', user: match[1], channel: match[2], data: match[3] };
        }
    
        match = line.match(WHISPER_RE);
        if (match) {
            return { line, tags, type: 'whisper', user: match[1], target: match[2], data: match[3] };
        }
    
        match = line.match(JOIN_PART_RE);
        if (match) {
            return { line, tags, type: match[2].toLowerCase(), user: match[1], channel: match[3] };
        }
    
        match = line.match(MODE_RE);
        if (match) {
            return { line, tags, type: 'mode', channel: match[1], user: match[3], mode: match[2] };
        }

        match = line.match(USER_ROOM_STATE_RE);
        if (match) {
            return { line, tags, type: match[1].toLowerCase(), channel: match[2] };
        }

        if (line.includes('PING :tmi.twitch.tv')) {
            return { line, tags, type: 'ping' };
        }

        if (line.includes('PONG :tmi.twitch.tv')) {
            return { line, tags, type: 'pong' };
        }

        match = line.match(HOSTTARGET_RE);
        if (match) {
            return { line, tags, type: 'host', channel: match[1], user: match[1], target: match[2], viewers: match[3] };
        }

        match = line.match(NAMES_LIST_RE);
        if (match) {
            return { line, tags, type: 'names', channel: match[2], user: match[1], data: match[3] };
        }

        match = line.match(CONNECTED_RE);
        if (match) {
            return { line, tags, type: 'connected', user: match[1] };
        }
    
        if (line.includes(':tmi.twitch.tv CAP * ACK :twitch.tv/membership')) {
            return { line, tags, type: 'membership' };
        }
    
        if (line.includes(':tmi.twitch.tv CAP * ACK :twitch.tv/commands')) {
            return { line, tags, type: 'commands' }
        }
    
        if (line.includes(':tmi.twitch.tv CAP * ACK :twitch.tv/tags')) {
            return { line, tags, type: 'tags' }
        }

        return { line, tags, type: 'other' };
    }
}

function get(clientid, url) {
    return fetch(url, { headers: { 'Client-ID': clientid, 'Accept': 'application/vnd.twitchtv.v5+json' } })
        .catch((reason) => {
            console.log(`Failed to fetch ${url}`);
        })
        .then((response) => {
            return response.json();
        })
        .catch((reason) => {
            console.log(`Failed to parse JSON for ${url}`);
        });
}

function getUsers(clientid, userNames) {
    return get(clientid, `https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`)
        .then((usersObject) => {
            if (usersObject) {
                return usersObject.users;
            }

            return [];
        });
}

function getChannel(clientid, channelName) {
    return getUsers(clientid, [channelName])
        .then((users) => {
            if (users.length === 1) {
                return get(clientid, `https://api.twitch.tv/kraken/channels/${users[0]._id}`);
            }
        });
}

function getStream(clientid, streamName) {
    return getUsers(clientid, [streamName])
        .then((users) => {
            if (users.length === 1) {
                return get(clientid, `https://api.twitch.tv/kraken/streams/${users[0]._id}`);
            }
        });
}

function getUserFollow(clientid, streamName, userName) {
    return getUsers(clientid, [streamName, userName])
        .then((users) => {
            if (users.length === 2) {
                return get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
            }
        });
}

function getUserSubscription(clientid, streamName, userName) {
    return getUsers(clientid, [streamName, userName])
        .then((users) => {
            if (users.length === 2) {
                return get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
            }
        });
}

function getUserEmotes(clientid, userName) {
    return getUsers(qclientid, [userName])
        .then((users) => {
            return get(clientid, `https://api.twitch.tv/kraken/users/${users[0]._id}/emotes`);
        });
}
    
function getChatters(streamName) {
    return fetch(`https://tmi.twitch.tv/group/user/${streamName}/chatters`)
        .catch((reason) => {
            console.log(`Failed to fetch https://tmi.twitch.tv/group/user/${streamName}/chatters`);
        })
        .then((response) => {
            return response.json();
        })
        .catch((reason) => {
            console.log(`Failed to parse JSON for https://tmi.twitch.tv/group/user/${streamName}/chatters`);
        });
}

module.exports = {
    Connection,
    api: {
        get,
        getUsers,
        getChannel,
        getStream,
        getUserFollow,
        getUserSubscription,
        getUserEmotes,
        getChatters
    }
};
