// args: <user-autocomplete>
module.exports = {
    name: 'autocomplete',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user>`);
            channel.chatMessage(`@${user}, takes a partial name of a user, and tries to autocomplete it.`);
            return;
        }

        let name = args[1],
            target = channel.getUser(name.toLowerCase(), true);

        if (target) {
            channel.chatMessage(`@${user}, I see '${name}' as '${target.name}'.`);
        } else {
            channel.chatMessage(`@${user}, I don't know who '${name}' is.`);
        }
    }
};
