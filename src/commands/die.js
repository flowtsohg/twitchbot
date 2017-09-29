// args:
module.exports = {
    name: 'die',
    handler: function (channel, data) {
        channel.chatMessage(`@${data.event.user}, ok :(`);
        channel.bot.rawMessage('DIE');
    }
};
