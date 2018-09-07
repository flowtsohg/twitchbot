module.exports = {
    name: 'die',

    handler(channel, command, event, args) {
        channel.bot.disconnect();
    }
};
