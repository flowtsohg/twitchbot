// args: <'command'-autocomplete'> <command>
// args: <'interval'-autocomplete'> <name>
module.exports = {
    name: 'remove',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} 'command'-autocomplete <name>.`);
            channel.chatMessage(`@${user}, usage: ${command.name} 'interval'-autocomplete <name>.`);
            channel.chatMessage(`removes a command or an interval.`);
            return;
        }

        let arg1 = args[1].toLowerCase();

        if ('command'.startsWith(arg1)) {
            if (args.length < 3) {
                channel.chatMessage(`@${user}, usage: ${command.name} 'command'-autocomplete <name>.`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (!channel.getCommand(arg2)) {
                channel.chatMessage(`@${user}, that command does not exist.`);
            }

            channel.removeCommand(arg2);

            channel.chatMessage(`@${user}, done.`);
        } else if ('interval'.startsWith(arg1)) {
            if (args.length < 3) {
                channel.chatMessage(`@${user}, usage: ${command.name} 'interval'-autocomplete <name>.`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (!channel.getInterval(arg2)) {
                channel.chatMessage(`@${user}, that interval does not exist.`);
            }

            channel.removeInterval(arg2);

            channel.chatMessage(`@${user}, done.`);
        } else {
            channel.chatMessage(`@${user}, usage: ${command.name} 'command'-autocomplete <name>.`);
            channel.chatMessage(`@${user}, usage: ${command.name} 'interval'-autocomplete <name>.`);
            channel.chatMessage(`removes a command or an interval.`);
            return;
        }
    }
};
