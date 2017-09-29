// args: 'command'-autocomplete' <command> <permitted> <response>
// args: 'interval'-autocomplete' <name> <interval> <response>
module.exports = {
    name: 'add',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} 'command'-autocomplete <name> <permitted> <response>.`);
            channel.chatMessage(`@${user}, usage: ${command.name} 'interval'-autocomplete <name> <timeout> <response>.`);
            channel.chatMessage(`adds a new command or interval.`);
            return;
        }

        let arg1 = args[1].toLowerCase();

        if ('command'.startsWith(arg1)) {
            if (args.length < 5) {
                channel.chatMessage(`@${user}, usage: ${command.name} 'command'-autocomplete <name> <permitted> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (channel.getCommand(arg2)) {
                channel.chatMessage(`@${user}, that command name exists already.`);
                return;
            }

            let arg3 = args[3].toLowerCase(),
                permitted = [];
            
            if ('all'.startsWith(arg3)) {
                permitted[0] = "all";
            } else if ('mod'.startsWith(arg3)) {
                permitted[0] = "mod";
            } else {
                channel.chatMessage(`@${user}, '${arg3}' is not a valid permission`);
                return;
            }

            let arg4ToEnd = args.slice(4).join(' ');

            channel.addCommand(arg2, permitted, arg4ToEnd);

            channel.chatMessage(`@${user}, done.`);
        } else if ('interval'.startsWith(arg1)) {
            if (args.length < 5) {
                channel.chatMessage(`@${user}, usage: ${command.name} 'interval'-autocomplete <name> <timeout> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (channel.getInterval(arg2)) {
                channel.chatMessage(`@${user}, that interval name exists already.`);
                return;
            }

            let arg3 = args[3],
                timeout = parseInt(arg3);

            if (isNaN(timeout)) {
                channel.chatMessage(`@${user}, ${arg3} is not a number.`);
                return;
            }

            if (timeout < 0) {
                channel.chatMessage(`@${user}, the interval must be positive.`);
                return;
            }

            let arg4ToEnd = args.slice(4).join(' ');

            channel.addInterval(arg2, timeout, arg4ToEnd);

            channel.chatMessage(`@${user}, done.`);
        } else {
            channel.chatMessage(`@${user}, usage: ${command.name} <'command'-autocomplete'> <name> <permitted> <response>.`);
            channel.chatMessage(`@${user}, usage: ${command.name} <'interval'-autocomplete'> <name> <timeout> <response>.`);
            channel.chatMessage(`adds a new command or interval.`);
            return;
        }
    }
};
