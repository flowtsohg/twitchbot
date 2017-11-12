// args: <user-autocomplete>
module.exports = {
    name: 'spy',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user>`);
            channel.chatMessage(`@${user}, spies the amount of ${channel.settings.pointsNamePlural} the given user has.`);
            return;
        }

        let name = args[1],
            target = channel.getUser(name.toLowerCase(), true);

        if (target) {
            let amount = target.points,
                singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

            if (user === target.name) {
                channel.chatMessage(`@${user}, you have ${amount} ${singleOrPlural}.`);
            } else {
                channel.chatMessage(`@${user}, @${target.name} has ${amount} ${singleOrPlural}.`);
            }
        } else {
            channel.chatMessage(`@${user}, I don't know who '${name}' is.`);
        }
    }
};
