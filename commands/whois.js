// args: <user>
module.exports = {
    name: 'whois',

    handler(channel, command, event, args) {
        let user = channel.users.get(event.user),
            userName = user.displayName || user.name;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} <user>`);
            return;
        }

        let arg0 = args[0],
            target = channel.users.get(arg0, true);

        if (!target) {
            channel.message(`@${userName}, I don't know who '${arg0}' is.`);
            return;
        }

        if (user.name === target.name) {
            channel.message(`@${userName}, you are special.`);
            return;
        }

        let privLevel = channel.getUserPrivLevel(target.name),
            targetName = target.displayName || target.name;

        console.log(target)

        if (privLevel === 0) {
            channel.message(`@${targetName} is a chatter.`);
        } else if (privLevel === 1) {
            channel.message(`@${targetName} is a moderator.`);
        } else if (privLevel === 2) {
            channel.message(`@${targetName} is the streamer.`);
        } else if (privLevel === 3) {
            channel.message(`@${targetName} is the owner.`);
        }
    }
};
