// args: <user-autocomplete> <amount|all>
module.exports = {
    name: 'donate',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 3) {
            channel.chatMessage(`@${user}, usage: ${command.name} <user> <amount>`);
            channel.chatMessage(`@${user}, donate to the given user the given amount. The amount can be 'all' to donate everything.`);
            return;
        }

        let realUser = channel.getUser(user),
            arg1 = args[1],
            arg2 = args[2].toLowerCase(),
            realTarget = channel.getUser(arg1.toLowerCase(), true),
            amount = 0;

        if (!realTarget) {
            channel.chatMessage(`@${user}, I don't know who '${arg1}' is.`);
            return;
        }

        if (user === realTarget.name) {
            channel.chatMessage(`@${user}, nope.`);
            return;
        }

        if (arg2 === 'all') {
            amount = realUser.points;
        } else {
            amount = parseInt(arg2);

            if (isNaN(amount)) {
                channel.chatMessage(`@${user}, '${arg2}' is not a number or 'all'.`);
                return;
            }
        }

        if (amount < 1) {
            channel.chatMessage(`@${user}, donating nothing is not so much a 'donation'.`)
            return;
        }

        let singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        if (amount > realUser.points) {
            channel.chatMessage(`@${user}, you do not have ${amount} ${singleOrPlural}.`);
            return;
        }

        realUser.points -= amount;
        realTarget.points += amount;

        channel.chatMessage(`@${user} donated ${amount} ${singleOrPlural} to @${realTarget.name}.`);
    }
};
