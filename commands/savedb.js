module.exports = {
  name: 'savedb',

  handler(channel, command, event, args) {
    channel.bot.db.save();
  },
};
