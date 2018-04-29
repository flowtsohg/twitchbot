function buildResponse(args, value) {
    return args.join(' ').replace(/\$value/g, '' + value);
}

// create <name>
// delete <name>
// add <name> <user>
// end <name> <response>
// list
module.exports = {
    name: 'giveaway',

    eachChannel(channel) {
        if (!channel.giveaways) {
            channel.giveaways = {};
        }
    },

    handler(channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} create <name>`);
            channel.message(`@${userName}, usage: ${command.name} delete <name>`);
            channel.message(`@${userName}, usage: ${command.name} add <name> <user>`);
            channel.message(`@${userName}, usage: ${command.name} end <name> <response>`);
            channel.message(`@${userName}, usage: ${command.name} list`);
            return;
        }

        let op = args[0].toLowerCase(),
            giveaways = channel.db.giveaways;

        if (op === 'list') {
            let keys = Object.keys(giveaways);

            if (keys.length) {
                channel.message(`@${userName}, ${keys.join(', ')}.`);
            } else {
                channel.message(`@${userName}, there are no giveaways.`);
            }

            return;
        }

        if (op === 'create') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} create <name>`);
                return;
            }

            let giveawayName = args[1].toLowerCase();

            if (giveaways[giveawayName]) {
                channel.message(`@${userName}, that giveaway exists already.`);
            } else {
                giveaways[giveawayName] = { users: [] };

                channel.message(`@${userName}, created giveaway "${giveawayName}".`);
            }
        } else if (op === 'delete') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} delete <name>`);
                return;
            }

            let giveawayName = args[1].toLowerCase();

            if (giveaways[giveawayName]) {
                delete giveaways[giveawayName];

                channel.message(`@${userName}, deleted giveaway "${giveawayName}".`);
            } else {
                channel.message(`@${userName}, giveaway "${giveawayName}" does not exist.`);
            }
        } else if (op === 'add') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} add <name> <user>`);
                return;
            }

            let giveawayName = args[1].toLowerCase(),
                giveaway = giveaways[giveawayName];

            if (giveaway) {
                let arg2 = args[2].toLowerCase();

                if (!giveaway.users.includes(userName)) {
                    giveaway.users.push(userName);
                }
            } else {
                channel.message(`@${userName}, giveaway "${giveawayName}" does not exist.`);
            }
        } else if (op === 'end') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} end <name> <response>`);
                channel.message(`@${userName}, use $value to inject the winner.`);
                return;
            }

            let giveawayName = args[1].toLowerCase(),
                giveaway = giveaways[giveawayName];

            if (giveaway) {
                let arg2 = args.slice(2).join(' ');

                let users = giveaway.users;

                let winner = users[Math.floor(Math.random() * users.length)];

                delete giveaways[giveawayName];   
                
                channel.message(arg2.replace(/\$value/g, winner));
                return;
            } else {
                channel.message(`@${userName}, giveaway "${giveawayName}" does not exist.`);
            }
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
