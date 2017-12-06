// Counters
// args: create <name> <response>
// args: delete <name>
// args: list

// Values
// args: add <counter> <amount>
module.exports = {
    name: 'counter',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;
        
        if (args.length < 2) {
            return;
        }

        let cmd = args[1].toLowerCase();

        if (!channel.db.counters) {
            channel.db.counters = {};
        }

        let counters = channel.db.counters;

        if (cmd === 'list') {
            let keys = Object.keys(counters);

            if (keys.length) {
                channel.chatMessage(`@${user}, ${Object.keys(counters).join(', ')}`);
            } else {
                channel.chatMessage(`@${user}, there are no counters.`);
            }
            
            return;
        }

        if (args.length < 3) {
            return;
        }

        let counterName = args[2].toLowerCase();

        if (cmd === 'create') {
            if (counters[counterName]) {
                channel.chatMessage(`@${user}, that counter exists already.`);
            } else {
                if (args.length < 4) {
                    return;
                }

                counters[counterName] = { value: 0, response: args.slice(3).join(' ') };

                channel.chatMessage(`@${user}, created counter "${counterName}".`);
            }
        } else if (cmd === 'delete') {
            if (counters[counterName]) {
                delete counters[counterName];

                channel.chatMessage(`@${user}, deleted counter "${counterName}".`);
            } else {
                channel.chatMessage(`@${user}, counter "${counterName}" does not exist.`);
            }
        } else if (cmd === 'add') {
            let counter = counters[counterName];

            if (counter) {
                if (args.length < 4) {
                    return;
                }

                let arg3 = args[3],
                    amount = parseInt(arg3.toLowerCase());
    
                if (isNaN(amount)) {
                    channel.chatMessage(`@${user}, '${arg1}' is not a number.`);
                    return;
                }

                counter.value += amount;

                channel.chatMessage(`@${user}, ${counter.response.replace(/\$value/g, '' + counter.value)}`);
            } else {
                channel.chatMessage(`@${user}, counter "${counterName}" does not exist.`);
            }
        }
    }
};
