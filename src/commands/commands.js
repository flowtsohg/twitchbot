// args:
module.exports = {
    name: 'commands',
    handler: function (channel, data) {
        let userName = data.event.user,
            commands = {
                all: [],
                mod: [],
                streamer: [],
                owner: [],
                specific: []
            };

        for (let command of [...Object.values(channel.bot.commands), ...Object.values(channel.commands)]) {
            let token = channel.getPriviliegeToken(userName, command);

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

        channel.chatMessage(`@${userName}, ${cmds.join(', ')}.`);
    }
};
