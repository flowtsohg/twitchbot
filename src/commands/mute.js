// args:
module.exports = {
    name: 'mute',
    handler: function (channel, data) {
        console.log(data.args);
        if (data.args.length > 1) {
            channel.muted = true;
        } else {
            channel.muted = false;
            channel.message('Hello again!');
        }
    }
};
