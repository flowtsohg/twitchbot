// args:
module.exports = {
    name: 'mute',
    handler: function (channel, data) {
        channel.muted = true;
    }
};
