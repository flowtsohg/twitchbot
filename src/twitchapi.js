let fetch = require('node-fetch');

/**
 * @param {string} url
 * @param {object} options
 * @return {Promise<?object>}
 */
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

/**
 * @param {string} clientid
 * @param {string} url
 * @return {Promise<?object>}
 */
async function get(clientid, url) {
  return await jsonFetch(url, {headers: {'Client-ID': clientid, 'Accept': 'application/vnd.twitchtv.v5+json'}});
}

/**
 * @param {string} clientid
 * @param {Array<string>} userNames
 * @return {Promise<?object>}
 */
async function getUsers(clientid, userNames) {
  let userObjects = await get(clientid, `https://api.twitch.tv/kraken/users/?login=${userNames.join(',')}`);

  if (userObjects) {
    return userObjects.users;
  }
}

/**
 * @param {string} clientid
 * @param {string} channelName
 * @return {Promise<?object>}
 */
async function getChannel(clientid, channelName) {
  let users = await getUsers(clientid, [channelName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://api.twitch.tv/kraken/channels/${users[0]._id}`);
  }
}

/**
 * @param {string} clientid
 * @param {string} channelName
 * @return {Promise<?object>}
 */
async function getHosts(clientid, channelName) {
  let users = await getUsers(clientid, [channelName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://tmi.twitch.tv/hosts?include_logins=1&target=${users[0]._id}`);
  }
}

/**
 * @param {string} clientid
 * @param {string} channelName
 * @return {Promise<?object>}
 */
async function getHost(clientid, channelName) {
  let users = await getUsers(clientid, [channelName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://tmi.twitch.tv/hosts?include_logins=1&host=${users[0]._id}`);
  }
}

/**
 * @param {string} clientid
 * @param {string} streamName
 * @return {Promise<?object>}
 */
async function getStream(clientid, streamName) {
  let users = await getUsers(clientid, [streamName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://api.twitch.tv/kraken/streams/${users[0]._id}`);
  }
}

/**
 * @param {string} clientid
 * @param {string} streamName
 * @param {string} userName
 * @return {Promise<?object>}
 */
async function getUserFollow(clientid, streamName, userName) {
  let users = await getUsers(clientid, [streamName, userName]);

  if (users && users.length === 2) {
    return await get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/follows/channels/${users[0]._id}`);
  }
}

/**
 * Requires permissions.
 *
 * @param {string} clientid
 * @param {string} streamName
 * @param {string} userName
 * @return {Promise<?object>}
 */
async function getUserSubscription(clientid, streamName, userName) {
  let users = await getUsers(clientid, [streamName, userName]);

  if (users && users.length === 2) {
    return await get(clientid, `https://api.twitch.tv/kraken/users/${users[1]._id}/subscriptions/${users[0]._id}`);
  }
}

/**
 * Requires permissions.
 *
 * @param {string} clientid
 * @param {string} userName
 * @return {Promise<?object>}
 */
async function getUserEmotes(clientid, userName) {
  let users = await getUsers(clientid, [userName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://api.twitch.tv/kraken/users/${users[0]._id}/emotes`);
  }
}

/**
 * @param {string} clientid
 * @param {string} channelName
 * @return {Promise<?object>}
 */
async function getRecentMessages(clientid, channelName) {
  let users = await getUsers(clientid, [channelName]);

  if (users && users.length === 1) {
    return await get(clientid, `https://tmi.twitch.tv/api/rooms/${users[0]._id}/recent_messages`);
  }
}

/**
 * @param {string} streamName
 * @return {Promise<?object>}
 */
async function getChatters(streamName) {
  return await jsonFetch(`https://tmi.twitch.tv/group/user/${streamName}/chatters`);
}

module.exports = {
  get,
  getUsers,
  getChannel,
  getHosts,
  getHost,
  getStream,
  getUserFollow,
  getUserSubscription,
  getUserEmotes,
  getRecentMessages,
  getChatters,
};
