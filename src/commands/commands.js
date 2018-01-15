// add <name> <permitted> <response>
// edit <name> <response>
// remove <name>
// list
module.exports = {
    name: 'commands',
    handler: function (channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} add <name> <permitted> <response>`);
            channel.message(`@${userName}, usage: ${command.name} edit <name> <response>`);
            channel.message(`@${userName}, usage: ${command.name} remove <name>`);
            channel.message(`@${userName}, usage: ${command.name} list`);
            return;
        }

        let op = args[0].toLowerCase();

        if (op === 'add') {
            if (args.length < 4) {
                channel.message(`@${userName}, usage: ${command.name} add <name> <permitted> <response>`);
                return;
            }

            let commandName = args[1].toLowerCase();
            
            if (channel.getCommand(commandName)) {
                channel.message(`@${userName}, that command name exists already.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                permitted = [],
                privLevel = channel.getUserPrivLevel(userName);
            
            if (arg2 === 'all') {
                permitted[0] = 'all';
            } else if (arg2 === 'mod') {
                if (privLevel > 0) {
                    permitted[0] = 'mod';  
                } else {
                    channel.message(`@${userName}, you do not have permissions to use '${arg2}'`);
                    return;
                }
            } else if (arg2 === 'streamer') {
                if (privLevel > 1) {
                    permitted[0] = 'streamer';  
                } else {
                    channel.message(`@${userName}, you do not have permissions to use '${arg2}'`);
                    return;
                }
            } else if (arg2 === 'owner') {
                if (privLevel > 2) {
                    permitted[0] = 'owner';  
                } else {
                    channel.message(`@${userName}, you do not have permissions to use '${arg2}'`); 
                    return;
                }
            } else {
                let target = channel.getUser(arg2.toLowerCase(), true);

                if (!target) {
                    channel.message(`@${userName}, I don't know who '${arg2}' is.`);
                    return;
                }

                permitted[0] = target.name;
            }

            channel.addCommand(commandName, permitted, args.slice(3).join(' '));

            channel.message(`@${userName}, done.`);
        } else if (op === 'edit') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} edit <name> <response>.`);
                return;
            }

            let arg1 = args[1].toLowerCase(),
                result = channel.getCommand(arg1);

            if (!result) {
                channel.message(`@${userName}, that command does not exist.`);
                return;
            }
            result.response = args.slice(2).join(' ');;

            channel.message(`@${userName}, done.`);
        } else if (op === 'remove') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} remove <name>`);
                return;
            }

            let arg1 = args[1].toLowerCase();

            if (!channel.getCommand(arg1)) {
                channel.message(`@${userName}, that command does not exist.`);
                return;
            }

            channel.removeCommand(arg1);

            channel.message(`@${userName}, done.`);
        } else if (op === 'list') {
            let privAll = [],
                privMod = [],
                privStreamer = [],
                privOwner = [],
                privSpecific = [];

            for (let command of [...Object.values(channel.bot.db.db.commands), ...Object.values(channel.db.commands)]) {
                let token = channel.getPrivToken(userName, command);

                if (token === 'all') {
                    privAll.push(command.name);
                } else if (token === 'mod') {
                    privMod.push(command.name);
                } else if (token === 'streamer') {
                    privStreamer.push(command.name);
                } else if (token === 'owner') {
                    privOwner.push(command.name);
                } else if (token !== '') {
                    privSpecific.push(command.name);
                }
            }

            privAll = privAll.sort();
            privMod = privMod.sort();
            privStreamer = privStreamer.sort();
            privOwner = privOwner.sort();
            privSpecific = privSpecific.sort();

            let commands = [];

            if (privAll.length) {
                commands.push(privAll.join(', '));
            }

            if (privMod.length) {
                commands.push(privMod.join(' (mod), ') + ' (mod)');
            }

            if (privStreamer.length) {
                commands.push(privStreamer.join(' (streamer), ') + ' (streamer)');
            }

            if (privOwner.length) {
                commands.push(privOwner.join(' (owner), ') + ' (owner)');
            }

            if (privSpecific.length) {
                commands.push(privSpecific.join(' (specific), ') + ' (specific)');
            }

            channel.message(`@${userName}, ${commands.join(', ')}.`);
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
