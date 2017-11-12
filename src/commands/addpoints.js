// args: <user-autocomplete> <amount>
module.exports = {
    name: 'addpoints',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 3) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user> <amount>`);
            channel.chatMessage(`@${user}, add the given amount of ${channel.settings.pointsNamePlural} to the given user. Add to 'all' to add to all current chat viewers.`);
            return;
        }

        let arg1 = args[1],
            lowerArg1 = arg1.toLowerCase(),
            realTarget;

        if (arg1 !== 'all') {
            realTarget = channel.getUser(arg1.toLowerCase(), true);

            if (!realTarget) {
                channel.chatMessage(`@${user}, I don't know who '${arg1}' is.`);
                return;
            }
        }

        let arg2 = args[2],
            amount = parseInt(arg2);

        if (isNaN(amount)) {
            channel.chatMessage(`@${user}, '${arg2}' is not a number.`);
            return;
        }

        if (amount  === 0) {
            channel.chatMessage(`@${user}, did nothing.`)
            return;
        }

        let singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        if (lowerArg1 === 'all') {
            for (let chatter of channel.chatters.values()) {
                chatter.points += amount;
            }

            channel.chatMessage(`@${user}, added ${amount} ${singleOrPlural} to all chatters.`);
        } else {
            realTarget.points += amount;

            channel.chatMessage(`@${user}, added ${amount} ${singleOrPlural} to @${realTarget.name}.`);
        }
    }
};
