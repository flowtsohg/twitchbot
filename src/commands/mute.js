// [<any>]
module.exports = {
    name: 'mute',
    handler: function (channel, data) {
        if (data.args.length > 0) {
            channel.muted = true;
        } else {
            channel.muted = false;
            channel.message('Hello again!');
        }
    }
};
