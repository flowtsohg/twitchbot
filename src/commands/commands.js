// args: add <name> <permitted> <response>
// args: edit <name> <response>
// args: remove <name>
// args: list
module.exports = {
    name: 'commands',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.message(`@${user}, usage: ${command.name} add <name> <permitted> <response>`);
            channel.message(`@${user}, usage: ${command.name} edit <name> <response>`);
            channel.message(`@${user}, usage: ${command.name} remove <name>`);
            channel.message(`@${user}, usage: ${command.name} list`);
            return;
        }

        let arg1 = args[1],
            op = arg1.toLowerCase();

        if (op === 'add') {
            if (args.length < 5) {
                channel.message(`@${user}, usage: ${command.name} add <name> <permitted> <response>`);
                return;
            }

            let arg2 = args[2].toLowerCase();
            
            if (channel.getCommand(arg2)) {
                channel.message(`@${user}, that command name exists already.`);
                return;
            }

            let arg3 = args[3].toLowerCase(),
                permitted = [],
                privLevel = channel.getUserPrivLevel(user);
            
            if (arg3 === 'all') {
                permitted[0] = 'all';
            } else if (arg3 === 'mod') {
                if (privLevel > 0) {
                    permitted[0] = 'mod';  
                } else {
                    channel.message(`@${user}, you do not have permissions to use '${arg3}'`);
                    return;
                }
            } else if (arg3 === 'streamer') {
                if (privLevel > 1) {
                    permitted[0] = 'streamer';  
                } else {
                    channel.message(`@${user}, you do not have permissions to use '${arg3}'`);
                    return;
                }
            } else if (arg3 === 'owner') {
                if (privLevel > 2) {
                    permitted[0] = 'owner';  
                } else {
                    channel.message(`@${user}, you do not have permissions to use '${arg3}'`); 
                    return;
                }
            } else {
                let target = channel.getUser(arg3.toLowerCase(), true);

                if (!target) {
                    channel.message(`@${user}, I don't know who '${arg3}' is.`);
                    return;
                }

                permitted[0] = target.name;
            }

            let arg4ToEnd = args.slice(4).join(' ');

            channel.addCommand(arg2, permitted, arg4ToEnd);

            channel.message(`@${user}, done.`);
        } else if (op === 'edit') {
            if (args.length < 4) {
                channel.message(`@${user}, usage: ${command.name} edit <name> <response>.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                result = channel.getCommand(arg2);

            if (!result) {
                channel.message(`@${user}, that command does not exist.`);
                return;
            }

            let arg3ToEnd = args.slice(3).join(' ');

            result.response = arg3ToEnd;

            channel.message(`@${user}, done.`);
        } else if (op === 'remove') {
            if (args.length < 3) {
                channel.message(`@${user}, usage: ${command.name} remove <name>`);
                return;
            }

            let arg2 = args[2].toLowerCase();

            if (!channel.getCommand(arg2)) {
                channel.message(`@${user}, that command does not exist.`);
                return;
            }

            channel.removeCommand(arg2);

            channel.message(`@${user}, done.`);
        } else if (op === 'list') {
            let commands = {
                    all: [],
                    mod: [],
                    streamer: [],
                    owner: [],
                    specific: []
                };

            for (let command of [...Object.values(channel.bot.db.db.commands), ...Object.values(channel.db.commands)]) {
                let token = channel.getPrivToken(user, command);

                if (token === 'all') {
                    commands.all.push(command.name);
                } else if (token === 'mod') {
                    commands.mod.push(command.name);
                } else if (token === 'streamer') {
                    commands.streamer.push(command.name);
                } else if (token === 'owner') {
                    commands.owner.push(command.name);
                } else if (token !== '') {
                    commands.specific.push(command.name);
                }
            }

            commands.all = commands.all.sort();
            commands.mod = commands.mod.sort();
            commands.owner = commands.owner.sort();
            commands.streamer = commands.streamer.sort();
            commands.specific = commands.specific.sort();

            let cmds = [];

            if (commands.all.length) {
                cmds.push(commands.all.join(', '));
            }

            if (commands.mod.length) {
                cmds.push(commands.mod.join(' (mod), ') + ' (mod)');
            }

            if (commands.streamer.length) {
                cmds.push(commands.streamer.join(' (streamer), ') + ' (streamer)');
            }

            if (commands.owner.length) {
                cmds.push(commands.owner.join(' (owner), ') + ' (owner)');
            }

            if (commands.specific.length) {
                cmds.push(commands.specific.join(' (specific), ') + ' (specific)');
            }

            channel.message(`@${user}, ${cmds.join(', ')}.`);
        } else {
            channel.message(`@${user}, what is "${arg1}"?`);
        }
    }
};
