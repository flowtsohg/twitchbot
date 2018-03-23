// <condition> <...>
// if live
// if not live
// if hosting
// if not hosting
module.exports = {
    name: 'if',

    handler(channel, data) {
        let args = data.args;

        if (args.length < 1) {
            return;
        }

        let condition = args.shift();

        // Allow to negate the condition by prefixing it with not.
        if (condition === 'not') {
            if (args.length < 2) {
                return;
            }

            condition += args.shift();
        }

        if (condition === 'live') {
            if (!channel.isLive) {
                return;
            }
        } else if (condition === 'notlive') {
            if (channel.isLive) {
                return;
            }
        } else if (condition === 'hosting') {
            if (!channel.isHosting) {
                return;
            }
        } else if (condition === 'nothosting') {
            if (channel.isHosting) {
                return;
            }
        } else if (condition === 'hosted') {
            if (!channel.isHosted) {
                return;
            }
        } else if (condition === 'nothosted') {
            if (channel.isHosted) {
                return;
            }
        } else {
            return;
        }

        channel.runCommand(data);
    }
};
