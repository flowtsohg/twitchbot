let fetch = require('node-fetch');

class TwitchAPI  {
    constructor(clientid) {
        this.clientid = clientid;
    }

    fetch(url) {
        return fetch(url, { headers: { 'Client-ID': this.clientid, 'Accept': 'application/vnd.twitchtv.v5+json' } })
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

    fetchUsers(userNames) {
        return this.fetch(`https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`)
            .then((usersObject) => {
                if (usersObject) {
                    return usersObject.users;
                }

                return [];
            });
    }

    fetchChannel(channelName) {
        return this.fetchUsers([channelName])
            .then((users) => {
                if (users.length === 1) {
                    return this.fetch(`https://api.twitch.tv/kraken/channels/${users[0]._id}`);
                }
            });
    }

    fetchStream(streamName) {
        return this.fetchUsers([streamName])
            .then((users) => {
                if (users.length === 1) {
                    return this.fetch(`https://api.twitch.tv/kraken/streams/${users[0]._id}`);
                }
            });
    }

    fetchUserFollow(streamName, userName) {
        return this.fetchUsers([streamName, userName])
            .then((users) => {
                if (users.length === 2) {
                    return this.fetch(`https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
                }
            });
    }

    fetchUserSubscription(streamName, userName) {
        return this.fetchUsers([streamName, userName])
            .then((users) => {
                if (users.length === 2) {
                    return this.fetch(`https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
                }
            });
    }
    
    fetchUserEmotes(userName) {
        return this.fetchUsers([userName])
            .then((users) => {
                return this.fetch(`https://api.twitch.tv/kraken/users/${users[0]._id}/emotes`);
            });
    }
    
    fetchChatters(streamName) {
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
}

module.exports = TwitchAPI;
