// args: <amount|all>
module.exports = {
    name: 'eat',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} <amount>`);
            channel.chatMessage(`@${user}, eats the given amount of ${channel.settings.pointsNamePlural}. The amount can be 'all' to eat everything.`);
            return;
        }

        let realUser = channel.getUser(user),
            arg1 = args[1].toLowerCase(),
            amount = 0;

        if (arg1 === 'all') {
            amount = realUser.points;
        } else {
            amount = parseInt(arg1);

            if (isNaN(amount)) {
                channel.chatMessage(`@${user}, '${arg1}' is not a number or 'all'.`);
                return;
            }
        }

        if (amount < 1) {
            channel.chatMessage(`@${user}, you must eat 1 or more ${channel.settings.pointsNamePlural}.`)
            return;
        }

        let singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        if (amount > realUser.points) {
            channel.chatMessage(`@${user}, you do not have ${amount} ${singleOrPlural}.`);
            return;
        }

        realUser.points -= amount;
        realUser.eaten += amount;

        channel.chatMessage(`@${user} ate ${amount} ${singleOrPlural}.`);
    }
};
