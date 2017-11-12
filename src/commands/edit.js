// args: <'command'-autocomplete'> <command> <permitted> <response>
// args: <'interval'-autocomplete'> <name> <interval> <response>
module.exports = {
    name: 'edit',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} command <name> <permitted> <response>`);
            channel.chatMessage(`@${user}, usage: ${command.name} interval <name> <timeout> <response>`);
            channel.chatMessage(`@${user}, edits an existing command or interval.`);
            return;
        }

        let arg1 = args[1].toLowerCase();

        if ('command'.startsWith(arg1)) {
            if (args.length < 5) {
                channel.chatMessage(`@${user}, usage: ${command.name} command <name> <permitted> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                result = channel.getCommand(arg2);

            if (!result) {
                channel.chatMessage(`@${user}, that command does not exist.`);
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

            result.permitted = permitted;
            result.response = arg4ToEnd;

            channel.chatMessage(`@${user}, done.`);
        } else if ('interval'.startsWith(arg1)) {
            if (args.length < 5) {
                channel.chatMessage(`@${user}, usage: ${command.name} interval <name> <timeout> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                result = channel.getInterval(arg2);

            if (!result) {
                channel.chatMessage(`@${user}, that interval does not exist.`);
                return;
            }

            let arg3 = args[3],
                interval = parseInt(arg3);

            if (isNaN(interval)) {
                channel.chatMessage(`@${user}, ${arg3} is not a number.`);
                return;
            }

            if (interval < 0) {
                channel.chatMessage(`@${user}, the interval must be positive.`);
                return;
            }

            let arg4ToEnd = args.slice(4).join(' ');

            result.timeout = interval;
            result.response = arg4ToEnd;

            channel.chatMessage(`@${user}, done.`);
        } else {
            channel.chatMessage(`@${user}, usage: ${command.name} command <name> <permitted> <response>.`);
            channel.chatMessage(`@${user}, usage: ${command.name} interval <name> <timeout> <response>.`);
            channel.chatMessage(`@${user}, edits an existing command or interval.`);
            return;
        }
    }
};
