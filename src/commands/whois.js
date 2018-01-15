// args: <user>
module.exports = {
    name: 'whois',
    handler: function (channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} <user>`);
            return;
        }

        let arg0 = args[0],
            target = channel.getUser(arg0.toLowerCase(), true);

        if (!target) {
            channel.message(`@${userName}, I don't know who '${arg0}' is.`);
            return;
        }

        if (userName === target.name) {
            channel.message(`@${userName}, you are special.`);
            return;
        }

        let privLevel = channel.getUserPrivLevel(target.name);

        if (privLevel === 0) {
            channel.message(`@${target.name} is a chatter.`);
        } else if (privLevel === 1) {
            channel.message(`@${target.name} is a moderator.`);
        } else if (privLevel === 2) {
            channel.message(`@${target.name} is the streamer.`);
        } else if (privLevel === 3) {
            channel.message(`@${target.name} is the owner.`);
        }
    }
};
