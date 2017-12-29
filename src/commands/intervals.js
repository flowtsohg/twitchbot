// args: add <name> <timeout> <response>
// args: edit <name> <response>
// args: remove <name>
// args: list
module.exports = {
    name: 'intervals',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} add <name> <timeout> <response>`);
            channel.chatMessage(`@${user}, usage: ${command.name} edit <name> <response>`);
            channel.chatMessage(`@${user}, usage: ${command.name} remove <name>`);
            channel.chatMessage(`@${user}, usage: ${command.name} list`);
            return;
        }

        let arg1 = args[1],
        op = arg1.toLowerCase();

        if (op === 'add') {
            if (args.length < 5) {
                channel.chatMessage(`@${user}, usage: ${command.name} add <name> <timeout> <response>`);
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
        } else if (op === 'edit') {
            if (args.length < 4) {
                channel.chatMessage(`@${user}, usage: ${command.name} edit <name> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                result = channel.getInterval(arg2);

            if (!result) {
                channel.chatMessage(`@${user}, that interval does not exist.`);
                return;
            }

            let arg3ToEnd = args.slice(3).join(' ');

            result.response = arg3ToEnd;

            channel.chatMessage(`@${user}, done.`);
        } else if (op === 'remove') {
            if (args.length < 3) {
                channel.chatMessage(`@${user}, usage: ${command.name} remove <name>`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (!channel.getInterval(arg2)) {
                channel.chatMessage(`@${user}, that interval does not exist.`);
            }

            channel.removeInterval(arg2);

            channel.chatMessage(`@${user}, done.`);
        } else if (op === 'list') {
            let intervals = [];
    
            for (let interval of Object.values(channel.intervals)) {
                intervals.push(`${interval.name} (${interval.timeout})`);
            }
    
            channel.chatMessage(`@${data.event.user}, ${intervals.join(', ')}.`);
        } else {
            channel.chatMessage(`@${user}, what is "${arg1}"?`);
        }
    }
};