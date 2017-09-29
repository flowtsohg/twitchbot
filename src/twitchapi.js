let fetch = require('node-fetch');

class TwitchAPI  {
    constructor(oauth) {
        this.oauth = oauth;
    }

    fetch(url) {
        return fetch(url, { headers: { 'Client-ID': this.oauth, 'Accept': 'application/vnd.twitchtv.v5+json' } })
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

    fetchUserObjects(userNames) {
        return this.fetch(`https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`)
            .then((usersObject) => {
                if (usersObject) {
                    return usersObject.users;
                }

                return [];
            });
    }

    fetchStreamObject(streamName) {
        return this.fetchUserObjects([streamName])
            .then((users) => {
                if (users.length === 1) {
                    return this.fetch(`https://api.twitch.tv/kraken/streams/${users[0]._id}`);
                }
            });
    }

    fetchUserFollowObject(streamName, userName) {
        return this.fetchUserObjects([streamName, userName])
            .then((users) => {
                if (users.length === 2) {
                    return this.fetch(`https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
                }
            });
    }

    // Whoops, need an actual client ID for this one, no cheating.
    fetchUserSubscriptionObject(streamName, userName) {
        return this.fetchUserObjects([streamName, userName])
            .then((users) => {
                if (users.length === 2) {
                    return this.fetch(`https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
                }
            });
    }
    
    fetchUserEmotesObject(userName) {
        return this.fetchUserObjects([userName])
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
