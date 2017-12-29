let fetch = require('node-fetch');

function apiFetch(clientid, url) {
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

function fetchUsers(clientid, userNames) {
    return apiFetch(clientid, `https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`)
        .then((usersObject) => {
            if (usersObject) {
                return usersObject.users;
            }

            return [];
        });
}

function fetchChannel(clientid, channelName) {
    return fetchUsers(clientid, [channelName])
        .then((users) => {
            if (users.length === 1) {
                return apiFetch(clientid, `https://api.twitch.tv/kraken/channels/${users[0]._id}`);
            }
        });
}

function fetchStream(clientid, streamName) {
    return fetchUsers(clientid, [streamName])
        .then((users) => {
            if (users.length === 1) {
                return apiFetch(clientid, `https://api.twitch.tv/kraken/streams/${users[0]._id}`);
            }
        });
}

function fetchUserFollow(clientid, streamName, userName) {
    return fetchUsers(clientid, [streamName, userName])
        .then((users) => {
            if (users.length === 2) {
                return apiFetch(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
            }
        });
}

function fetchUserSubscription(clientid, streamName, userName) {
    return fetchUsers(clientid, [streamName, userName])
        .then((users) => {
            if (users.length === 2) {
                return apiFetch(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
            }
        });
}

function fetchUserEmotes(clientid, userName) {
    return fetchUsers(qclientid, [userName])
        .then((users) => {
            return apiFetch(clientid, `https://api.twitch.tv/kraken/users/${users[0]._id}/emotes`);
        });
}
    
function fetchChatters(streamName) {
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
    apiFetch,
    fetchUsers,
    fetchChannel,
    fetchStream,
    fetchUserFollow,
    fetchUserSubscription,
    fetchUserEmotes,
    fetchChatters
};
