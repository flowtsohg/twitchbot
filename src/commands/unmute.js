// args:
module.exports = {
    name: 'unmute',
    handler: function (channel, data) {
        channel.muted = false;

        channel.chatMessage('Hello again!');
    }
};
