// args:
module.exports = {
    name: 'commands',
    handler: function (channel, data) {
        let userName = data.event.user,
            commands = [];

        for (let command of Object.values(channel.bot.commands)) {
            if (channel.isPrivilegedForCommand(userName, command)) {
                commands.push(command.name);
            }
        }

        for (let command of Object.values(channel.commands)) {
            if (channel.isPrivilegedForCommand(userName, command)) {
                commands.push(command.name);
            }
        }

        channel.chatMessage(`@${userName}, ${commands.join(', ')}.`);
    }
};
