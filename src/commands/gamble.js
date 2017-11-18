// args: <amount|all>
module.exports = {
    name: 'gamble',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 2) {
            channel.chatMessage(`@${user}, usage: ${command.name} <amount>`);
            channel.chatMessage(`@${user}, gambles the given amount. The amount can be 'all' to go all in.`);
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
            channel.chatMessage(`@${user}, you must gamble 1 or more memes.`)
            return;
        }

        let singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        if (amount > realUser.points) {
            channel.chatMessage(`@${user}, you do not have ${amount} ${singleOrPlural}.`);
            return;
        }

        realUser.points -= amount;

        let rand = Math.floor(Math.random() * 100) + 1;

        if (rand < 61) {
            if (realUser.points === 0) {
                channel.chatMessage(`@${user} lost ${amount} ${singleOrPlural} and has none left (${rand}).`);
            } else {
                channel.chatMessage(`@${user} lost ${amount} ${singleOrPlural} and has ${realUser.points} left (${rand}).`);
            }
        } else if (rand < 99) {
            realUser.points += amount * 2;

            channel.chatMessage(`@${user} won ${amount * 2} ${singleOrPlural} and now has ${realUser.points} (${rand}).`);
        } else {
            realUser.points += amount * 3;

            channel.chatMessage(`@${user} won ${amount * 3} ${singleOrPlural} and now has ${realUser.points} (${rand}).`);
        }
    }
};
