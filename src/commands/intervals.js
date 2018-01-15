// args: add <name> <timeout> <response>
// args: edit <name> <response>
// args: remove <name>
// args: list
module.exports = {
    name: 'intervals',
    handler: function (channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} add <name> <timeout> <response>`);
            channel.message(`@${userName}, usage: ${command.name} edit <name> <response>`);
            channel.message(`@${userName}, usage: ${command.name} remove <name>`);
            channel.message(`@${userName}, usage: ${command.name} list`);
            return;
        }

        let op = args[0].toLowerCase();

        if (op === 'add') {
            if (args.length < 4) {
                channel.message(`@${userName}, usage: ${command.name} add <name> <timeout> <response>`);
                return;
            }

            let intervalName = args[1].toLowerCase();
            
            if (channel.getInterval(intervalName)) {
                channel.message(`@${userName}, that interval name exists already.`);
                return;
            }

            let arg2 = args[2],
                timeout = parseInt(arg2);

            if (isNaN(timeout)) {
                channel.message(`@${userName}, "${arg2}" is not a number.`);
                return;
            }

            if (timeout < 0) {
                channel.message(`@${userName}, the interval must be positive.`);
                return;
            }

            channel.addInterval(intervalName, timeout, args.slice(3).join(' '));

            channel.message(`@${userName}, done.`);
        } else if (op === 'edit') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} edit <name> <response>.`);
                return;
            }

            let result = channel.getInterval(args[1].toLowerCase());

            if (!result) {
                channel.message(`@${userName}, that interval does not exist.`);
                return;
            }

            result.response = args.slice(2).join(' ');

            channel.message(`@${userName}, done.`);
        } else if (op === 'remove') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} remove <name>`);
                return;
            }

            let intervalName = args[1].toLowerCase();

            if (!channel.getInterval(intervalName)) {
                channel.message(`@${userName}, that interval does not exist.`);
            }

            channel.removeInterval(intervalName);

            channel.message(`@${userName}, done.`);
        } else if (op === 'list') {
            let intervals = [];
    
            for (let interval of Object.values(channel.intervals)) {
                intervals.push(`${interval.name} (${interval.timeout})`);
            }
    
            channel.message(`@${userName}, ${intervals.join(', ')}.`);
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
