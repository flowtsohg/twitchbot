// args: <1st place multiplier> <2nd place multiplier> <amount>
module.exports = {
    name: 'pull',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;

        if (args.length < 4) {
            // The two first arguments are assumed to be defined in the command.
            channel.chatMessage(`@${user}, usage: ${command.name} <amount>`);
            return;
        }

        let arg1 = args[1].toLowerCase(),
            amount1 = parseFloat(arg1),
            arg2 = args[2].toLowerCase(),
            amount2 = parseFloat(arg2),
            arg3 = args[3].toLowerCase(),
            amount3 = parseInt(arg3)

        if (isNaN(amount1)) {
            channel.chatMessage(`@${user}, '${arg1}' is not a number.`);
            return;
        }

        if (isNaN(amount2)) {
            channel.chatMessage(`@${user}, '${arg2}' is not a number.`);
            return;
        }

        let realUser = channel.getUser(user);

        if (arg3 === 'all') {
            amount3 = realUser.points;
        } else {
            amount3 = parseInt(arg3);

            if (isNaN(amount3)) {
                channel.chatMessage(`@${user}, '${arg3}' is not a number or 'all'.`);
                return;
            }
        }

        if (amount3 < 1) {
            channel.chatMessage(`@${user} you must pull with atleast 1 ${channel.settings.pointsNameSingle}.`);
            return;
        }

        if (amount3 > realUser.points) {
            channel.chatMessage(`@${user} you do not have ${amount3} ${(amount3 === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural}`);
            return;
        }

        realUser.points -= amount3;

        let slots = ['FeelsBadMan', 'FeelsGoodMan', 'FeelsAmazingMan', 'RarePepe', 'PedoBear', 'StinkyCheese', 'Hecks'],
            results = [Math.floor(Math.random() * slots.length), Math.floor(Math.random() * slots.length), Math.floor(Math.random() * slots.length)],
            points;
        
        channel.chatMessage(`${slots[results[0]]} | ${slots[results[1]]} | ${slots[results[2]]}`);
        
        // 3
        if (results[0] === results[1] && results[0] === results[2]) {
            points = Math.floor(amount3 * amount1);

            realUser.points += points;

            channel.chatMessage(`@${user} won ${points} ${(points === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural} and now has ${realUser.points}.`);
        // 2
        } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
            points = Math.floor(amount3 * amount2);
            
            realUser.points += points;

            channel.chatMessage(`@${user} won ${points} ${(points === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural} and now has ${realUser.points}.`);
        // 1
        } else {
            if (realUser.points === 0) {
                channel.chatMessage(`@${user} lost ${amount3} ${(amount3 === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural} and has none left.`);
            } else {
                channel.chatMessage(`@${user} lost ${amount3} ${(amount3 === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural} and has ${realUser.points} left.`);
            }
        }
    }
};
