module.exports = {
  name: 'channeladd',

  handler(channel, command, event, args) {
    let attribute = args[0].toLowerCase();
    let value = parseInt(args[1]);

    for (let chatter of channel.users.chatters.values()) {
      chatter[attribute] += value;
    }
  },
};
