function buildResponse(args, value) {
    return args.join(' ').replace(/\$value/g, '' + value);
}

// create <name>
// delete <name>
// add <name> <amount> <response>
// list
module.exports = {
    name: 'counter',
    handler: function (channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;
        
        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} create <name>`);
            channel.message(`@${userName}, usage: ${command.name} delete <name>`);
            channel.message(`@${userName}, usage: ${command.name} add <name> <amount> <response>`);
            channel.message(`@${userName}, usage: ${command.name} list`);
            return;
        }

        if (!channel.db.counters) {
            channel.db.counters = {};
        }

        let op = args[0].toLowerCase(),
            counters = channel.db.counters;

        if (op === 'list') {
            let keys = Object.keys(counters);

            if (keys.length) {
                channel.message(`@${userName}, ${Object.keys(counters).join(', ')}.`);
            } else {
                channel.message(`@${userName}, there are no counters.`);
            }
            
            return;
        }

        if (op === 'create') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} create <name>`);
                return;
            }

            let counterName = args[1].toLowerCase();

            if (counters[counterName]) {
                channel.message(`@${userName}, that counter exists already.`);
            } else {
                counters[counterName] = { value: 0 };

                channel.message(`@${userName}, created counter "${counterName}".`);
            }
        } else if (op === 'delete') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} delete <name>`);
                return;
            }

            let counterName = args[1].toLowerCase();

            if (counters[counterName]) {
                delete counters[counterName];

                channel.message(`@${userName}, deleted counter "${counterName}".`);
            } else {
                channel.message(`@${userName}, counter "${counterName}" does not exist.`);
            }
        } else if (op === 'add') {
            if (args.length < 4) {
                channel.message(`@${userName}, usage: ${command.name} add <name> <amount> <response>`);
                channel.message(`@${userName}, use $value to inject the counter value.`);
                return;
            }

            let counterName = args[1].toLowerCase(),
                counter = counters[counterName];

            if (counter) {
                let arg2 = args[2],
                    amount = parseInt(arg2.toLowerCase());
    
                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${arg2}" is not a number.`);
                    return;
                }

                counter.value += amount;

                channel.message(`@${userName}, ${buildResponse(args.slice(3), counter.value)}`);
            } else {
                channel.message(`@${userName}, counter "${counterName}" does not exist.`);
            }
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
