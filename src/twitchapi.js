let fetch = require('node-fetch');

async function jsonFetch(url, options) {
    let response;
    
    try {
        response = await fetch(url, options);
    } catch (e) {
        console.log(`Failed to fetch ${url}.`);
        return;
    }

    let json;

    try {
        json = await response.json();
    } catch (e) {
        console.log(`Failed to parse JSON for ${url}.`);
        return;
    }

    return json;
}

async function get(clientid, url) {
    return await jsonFetch(url, { headers: { 'Client-ID': clientid, 'Accept': 'application/vnd.twitchtv.v5+json' } });
}

async function getUsers(clientid, userNames) {
    let userObjects = await get(clientid, `https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`);

    if (userObjects) {
        return userObjects.users;
    }
}

async function getChannel(clientid, channelName) {
    let users = await getUsers(clientid, [channelName]);

    if (users && users.length === 1) {
        return await get(clientid, `https://api.twitch.tv/kraken/channels/${users[0]._id}`);
    }
}

async function getStream(clientid, streamName) {
    let users = await getUsers(clientid, [streamName]);

    if (users && users.length === 1) {
        let streamObject = await get(clientid, `https://api.twitch.tv/kraken/streams/${users[0]._id}`);
    }
}

async function getUserFollow(clientid, streamName, userName) {
    let users = await getUsers(clientid, [streamName, userName]);
    
    if (users && users.length === 2) {
        return await get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
    }
}

// Requires permissions
async function getUserSubscription(clientid, streamName, userName) {
    let users = await getUsers(clientid, [streamName, userName]);
    
    if (users && users.length === 2) {
        return await get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
    }
}

// Requires permissions
async function getUserEmotes(clientid, userName) {
    let users = await getUsers(clientid, [userName]);
    
    if (users && users.length === 1) {
        return await get(clientid, `https://api.twitch.tv/kraken/users/${users[0]._id}/emotes`);
    }
}
    
async function getChatters(streamName) {
    return await jsonFetch(`https://tmi.twitch.tv/group/user/${streamName}/chatters`);
}

module.exports = {
    get,
    getUsers,
    getChannel,
    getStream,
    getUserFollow,
    getUserSubscription,
    getUserEmotes,
    getChatters
};
