// add <user|all> <amount>
// get <user>
// donate <user> <target|all> <amount|all>
// gamble <amount|all>
// pull <N-slots> <M-options> <multiplier1> <multiplier2> ... <multiplierN-1> <option1> <option2> ... <optionM> <amount|all>
// eat <amount|all>
// eaten <user>
// top <count> <points|eaten>
module.exports = {
    name: 'points',

    eachUser(user) {
        user.points = 10;
        user.eaten = 0;
    },
    
    handler(channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;
        
        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} <op> ...`);
            channel.message(`@${userName}, available ops are: add, get, donate, gamble, pull, eat, eaten, top.`);
            return;
        }

        let op = args[0].toLowerCase();

        let nameSingle = channel.settings.pointsNameSingle || 'point',
            namePlural = channel.settings.pointsNamePlural || 'points';

        if (op === 'add') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} add <user> <amount>`);
                channel.message(`@${userName}, add the given amount of ${namePlural} to the given user. Add to 'all' to add to all current chat viewers.`);
                return;
            }
    
            let arg2 = args[2],
                amount = parseInt(arg2);

            if (isNaN(amount)) {
                channel.message(`@${userName}, "${arg2}" is not a number.`);
                return;
            }

            if (amount  === 0) {
                channel.message(`@${userName}, did nothing.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            let arg1 = args[1],
                lowerArg1 = arg1.toLowerCase();
    
            if (lowerArg1 !== 'all') {
                let target = channel.users.get(lowerArg1, true);
    
                if (!target) {
                    channel.message(`@${userName}, I don't know who "${arg1}" is.`);
                    return;
                }

                target.points += amount;
                
                channel.message(`@${userName}, added ${amount} ${singleOrPlural} to @${target.name}.`);
            } else {
                for (let chatter of channel.users.chatters.values()) {
                    chatter.points += amount;
                }
    
                channel.message(`@${userName}, added ${amount} ${singleOrPlural} to all chatters.`);
            }
        } else if (op === 'get') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} <user>`);
                channel.message(`@${userName}, get the amount of ${namePlural} the given user has.`);
                return;
            }

            let arg1 = args[1],
                target = channel.users.get(arg1, true);

            if (!target) {
                channel.message(`@${userName}, I don't know who "${arg1}" is.`);
                return;
            }

            let amount = target.points,
                singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (userName === target.name) {
                channel.message(`@${userName}, you have ${amount} ${singleOrPlural}.`);
            } else {
                channel.message(`@${target.name} has ${amount} ${singleOrPlural}.`);
            }
        } else if (op === 'donate') {
            if (args.length < 3) {
                channel.message(`@${user}, usage: ${command.name} <user> <amount>`);
                channel.message(`@${user}, donate to the given user the given amount. The amount can be "all" to donate everything.`);
                return;
            }

            let user = channel.users.get(userName),
                targetName = args[1],
                target = channel.users.get(targetName, true);

            if (!target) {
                channel.message(`@${userName}, I don't know who "${targetName}" is.`);
                return;
            }

            if (userName === target.name) {
                channel.message(`@${userName}, nope.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                amount;

            if (arg2 === 'all') {
                amount = user.points;
            } else {
                amount = parseInt(arg2);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${arg2}" is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, nope.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > user.points) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
            } else {
                user.points -= amount;
                target.points += amount;

                channel.message(`@${userName} donated ${amount} ${singleOrPlural} to @${target.name}.`);
            }
        } else if (op === 'gamble') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, gambles the given amount of ${namePlural}. The amount can be "all" to go all in.`);
                return;
            }

            let user = channel.users.get(userName),
                arg1 = args[1].toLowerCase(),
                amount = 0;

            if (arg1 === 'all') {
                amount = user.points;
            } else {
                amount = parseInt(arg1);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${arg1}" is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must gamble 1 or more ${namePlural}.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > user.points) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
                return;
            }

            user.points -= amount;

            let rand = Math.floor(Math.random() * 100) + 1;

            if (rand < 61) {
                if (user.points === 0) {
                    channel.message(`@${userName} lost ${amount} ${singleOrPlural} and has none left (${rand}).`);
                } else {
                    channel.message(`@${userName} lost ${amount} ${singleOrPlural} and has ${user.points} left (${rand}).`);
                }
            } else if (rand < 99) {
                user.points += amount * 2;

                channel.message(`@${userName} won ${amount * 2} ${singleOrPlural} and now has ${user.points} (${rand}).`);
            } else {
                user.points += amount * 3;

                channel.message(`@${userName} won ${amount * 3} ${singleOrPlural} and now has ${user.points} (${rand}).`);
            }
        } else if (op === 'pull') {
            // pull <N-slots> <M-options> <multiplier1> <multiplier2> ... <multiplierN> <option1> <option2> ... <optionM> <amount|all>
            if (args.length < 6) {
                return;
            }

            let slotCount = parseInt(args[1]),
                optionCount = parseInt(args[2]);

            // If all of the arguments are there except for the amount, assume the rest are in the command.
            // This means the user didn't add the amount, and thus should get a response.
            // Since the arguments are assumed to be in the command, don't report them, since they mean nothing to the casual user.
            if (args.length === 3 + slotCount - 1 + optionCount) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, pulls the slot machine with the given amount of ${namePlural}. The amount can be "all" to go all in.`);
                return;
            }

            let multipliers = [];

            for (let i = 0; i < slotCount - 1; i++) {
                let value = parseFloat(args[3 + i]);

                if (isNaN(value)) {
                    channel.message(`@${userName}, "${args[3 + i]}" is not a number.`);
                    return;
                }

                multipliers[i] = value;
            }

            let options = [];

            for (let i = 0; i < optionCount; i++) {
                options[i] = args[3 + slotCount - 1 + i];
            }

            let amountArg = args[3 + slotCount - 1 + optionCount].toLowerCase(),
                amount;

            let user = channel.users.get(userName);

            if (amountArg === 'all') {
                amount = user.points;
            } else {
                amount = parseInt(amountArg);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${amountArg}" is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName} you must pull with atleast 1 ${namePlural}.`);
                return;
            }

            if (amount > user.points) {
                channel.message(`@${userName} you do not have ${amount} ${(amount === 1) ? nameSingle : namePlural}.`);
                return;
            }

            user.points -= amount;
            
            let results = [];

            for (let i = 0; i < slotCount; i++) {
                results[i] = options[Math.floor(Math.random() * optionCount)];
            }

            let map = {};

            for (let result of results) {
                map[result] = (map[result] || 0) + 1;
            }

            let multiplier = 0;

            for (let references of Object.values(map)) {
                if (references > 1) {
                    multiplier += multipliers[references - 2];
                }
            }

            channel.message(results.join(' | '));

            if (multiplier > 0) {
                let points = Math.floor(amount * multiplier);
                
                user.points += points;

                channel.message(`@${userName} won ${points} ${namePlural} and now has ${user.points}.`);
            } else {
                if (user.points === 0) {
                    channel.message(`@${userName} lost ${amount} ${(amount === 1) ? nameSingle : namePlural} and has none left.`);
                } else {
                    channel.message(`@${userName} lost ${amount} ${(amount === 1) ? nameSingle : namePlural} and has ${user.points} left.`);
                }
            }
        } else if (op === 'eat') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, eats the given amount of ${namePlural}. The amount can be "all" to eat everything.`);
                return;
            }

            let user = channel.users.get(userName),
                arg1 = args[1].toLowerCase(),
                amount;

            if (arg1 === 'all') {
                amount = user.points;
            } else {
                amount = parseInt(arg1);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${arg1}" is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must eat 1 or more ${namePlural}.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > user.points) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
                return;
            }

            user.points -= amount;
            user.eaten += amount;

            channel.message(`@${userName} ate ${amount} ${singleOrPlural}. Yummy.`);
        } else if (op === 'eaten') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} <user>`);
                channel.message(`@${userName}, get the amount of ${namePlural} the given user has eaten.`);
                return;
            }

            let args1 = args[1],
                target = channel.users.get(args1, true);

            if (!target) {
                channel.message(`@${userName}, I don't know who "${args1}" is.`);
                return;
            }

            let amount = target.eaten,
                singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (userName === target.name) {
                channel.message(`@${userName}, you have eaten ${amount} ${singleOrPlural}.`);
            } else {
                channel.message(`@${target.name} has eaten ${amount} ${singleOrPlural}.`);
            }
        } else if (op === 'top') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} <count> <points|eaten>`);
                channel.message(`@${userName}, list the top count chatters, sorting based on ${namePlural} or eaten ${namePlural}.`);
                return;
            }

            let arg1 = args[1].toLowerCase(),
                amount = parseInt(arg1);

            if (isNaN(amount)) {
                channel.message(`@${userName}, "${arg1}" is not a number.`);
                return;
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must list at least 1 chatter.`)
                return;
            }

            let users = Object.values(channel.users.users).slice();

            let arg2 = args[2].toLowerCase();

            if (arg2 === 'points') {
                let top = users.sort((a, b) => b.points - a.points).slice(0, amount).filter((user) => user.points > 0);

                channel.message(`@${userName}, top ${amount} ${channel.settings.pointsHoldersNamePlural || 'chatters'}: ${top.map((a) => `${a.name} (${a.points})`).join(', ')}.`)
            } else if (arg2 === 'eaten') {
                let top = users.sort((a, b) => b.eaten - a.eaten).slice(0, amount).filter((user) => user.eaten > 0);

                channel.message(`@${userName}, top ${amount} eaters: ${top.map((a) => `${a.name} (${a.eaten})`).join(', ')}.`)
            } else {
                channel.message(`@${userName}, unknown sort mode "${arg2}".`)
                return;
            }
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
