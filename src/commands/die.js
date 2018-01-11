// args:
module.exports = {
    name: 'die',
    handler: function (channel, data) {
        channel.bot.disconnect();
    }
};
