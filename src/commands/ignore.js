// args: <user> <duration>
module.exports = {
    name: 'ignore',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 3) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user> <duration>`);
            channel.chatMessage(`@${user}, ignore the given user for the given duration of seconds. To unignore, set to 0.`);
            return;
        }

        let arg1 = args[1],
            arg2 = args[2],
            realTarget = channel.getUser(arg1.toLowerCase(), true);

        if (!realTarget) {
            channel.chatMessage(`@${user}, I don't know who '${arg1}' is.`);
            return;
        }

        if (user === realTarget.name) {
            channel.chatMessage(`@${user}, nope.`);
            return;
        }

        let duration = parseInt(arg2.toLowerCase());

        if (isNaN(duration)) {
            channel.chatMessage(`@${user}, '${arg2}' is not a number.`);
            return;
        }

        if (duration < 0) {
            channel.chatMessage(`@${user}, nope.`);
            return;
        }

        channel.ignore(realTarget.name, duration * 1000);

        channel.chatMessage(`@${user}, done.`);
    }
};
