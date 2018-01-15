module.exports = {
    name: 'iflive',
    handler: function (channel, data) {
        if (channel.isLive) {
            // Remove the $iflive argument.
            data.args.shift();
            
            // Run whatever came after it.
            channel.runCommand(data);
        }
    }
};
