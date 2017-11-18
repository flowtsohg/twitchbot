// args: <user>
module.exports = {
    name: 'whois',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user>`);
            return;
        }

        let realUser = channel.getUser(user),
            arg1 = args[1],
            realTarget = channel.getUser(arg1.toLowerCase(), true),
            amount = 0;

        if (!realTarget) {
            channel.chatMessage(`@${user}, I don't know who '${arg1}' is.`);
            return;
        }

        if (user === realTarget.name) {
            channel.chatMessage(`@${user}, you are special.`);
            return;
        }

        let privLevel = channel.getUserPrivLevel(realTarget.name);

        if (privLevel === 0) {
            channel.chatMessage(`@${realTarget.name} is a chatter.`);
        } else if (privLevel === 1) {
            channel.chatMessage(`@${realTarget.name} is a moderator.`);
        } else if (privLevel === 2) {
            channel.chatMessage(`@${realTarget.name} is the streamer.`);
        } else if (privLevel === 3) {
            channel.chatMessage(`@${realTarget.name} is the owner.`);
        }
    }
};
