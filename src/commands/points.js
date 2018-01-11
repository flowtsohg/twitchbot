// Commands
// args: add <user|all> <amount>
// args: get <user>
// args: donate <user> <target|all> <amount|all>
// args: gamble <amount|all>
// args: pull <N-slots> <M-options>  <multiplier1> <multiplier2> ... <multiplierN-1> <option1> <option2> ... <optionM> <amount|all>
// args: eat <amount|all>
// args: eaten <user>
// args: top <count> <points|eaten>
module.exports = {
    name: 'points',
    handler: function (channel, data) {
        let command = data.command,
            userName = data.event.user,
            args = data.args;
        
        if (args.length < 2) {
            channel.message(`@${userName}, usage: ${command.name} <command> <...>`);
            channel.message(`@${userName}, available commands are "add" "get" "donate" "gamble" "pull" "eat" "eaten" "top"`);
            return;
        }

        let cmd = args[1].toLowerCase();

        let nameSingle = channel.settings.pointsNameSingle || 'point',
            namePlural = channel.settings.pointsNamePlural || 'points';

        if (cmd === 'add') {
            if (args.length < 4) {
                channel.message(`@${userName}, usage: ${command.name} <user> <amount>`);
                channel.message(`@${userName}, add the given amount of ${namePlural} to the given user. Add to 'all' to add to all current chat viewers.`);
                return;
            }
    
            let arg2 = args[2],
                lowerArg2 = arg2.toLowerCase(),
                target;
    
            if (arg2 !== 'all') {
                target = channel.getUser(arg2.toLowerCase(), true);
    
                if (!target) {
                    channel.message(`@${userName}, I don't know who '${arg2}' is.`);
                    return;
                }
            }
    
            let arg3 = args[3],
                amount = parseInt(arg3);
    
            if (isNaN(amount)) {
                channel.message(`@${userName}, '${arg3}' is not a number.`);
                return;
            }
    
            if (amount  === 0) {
                channel.message(`@${userName}, did nothing.`)
                return;
            }
    
            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;
    
            if (lowerArg2 === 'all') {
                for (let chatter of channel.chatters.values()) {
                    chatter.points = (chatter.points || 0) + amount;
                }
    
                channel.message(`@${userName}, added ${amount} ${singleOrPlural} to all chatters.`);
            } else {
                target.points = (target.points || 0) + amount;
    
                channel.message(`@${userName}, added ${amount} ${singleOrPlural} to @${target.name}.`);
            }
        } else if (cmd === 'get') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} <user>`);
                channel.message(`@${userName}, get the amount of ${namePlural} the given user has.`);
                return;
            }

            let targetName = args[2].toLowerCase(),
                target = channel.getUser(targetName, true);

            if (!target) {
                channel.message(`@${userName}, I don't know who "${targetName}" is.`);
                return;
            }

            let amount = target.points || 0,
                singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (userName === targetName) {
                channel.message(`@${userName}, you have ${amount} ${singleOrPlural}.`);
            } else {
                channel.message(`@${target.name} has ${amount} ${singleOrPlural}.`);
            }
        } else if (cmd === 'donate') {
            if (args.length < 4) {
                channel.message(`@${user}, usage: ${command.name} <user> <amount>`);
                channel.message(`@${user}, donate to the given user the given amount. The amount can be "all" to donate everything.`);
                return;
            }

            let user = channel.getUser(userName),
                targetName = args[2],
                target = channel.getUser(targetName.toLowerCase(), true);

            if (!target) {
                channel.message(`@${userName}, I don't know who '${targetName}' is.`);
                return;
            }

            if (userName === target.name) {
                channel.message(`@${userName}, nope.`);
                return;
            }

            let arg3 = args[3].toLowerCase(),
                amount;

            if (arg3 === 'all') {
                amount = user.points || 0;
            } else {
                amount = parseInt(arg3);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, '${arg3}' is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, nope.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > (user.points || 0)) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
            } else {
                user.points = (user.points || 0) - amount;
                target.points = (target.points || 0) + amount;

                channel.message(`@${userName} donated ${amount} ${singleOrPlural} to @${target.name}.`);
            }
        } else if (cmd === 'gamble') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, gambles the given amount of ${namePlural}. The amount can be "all" to go all in.`);
                return;
            }

            let user = channel.getUser(userName),
                arg2 = args[2].toLowerCase(),
                amount = 0;

            if (arg2 === 'all') {
                amount = user.points || 0;
            } else {
                amount = parseInt(arg2);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, '${arg2}' is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must gamble 1 or more ${namePlural}.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > (user.points || 0)) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
                return;
            }

            user.points = (user.points || 0) - amount;

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
                realUser.points += amount * 3;

                channel.message(`@${userName} won ${amount * 3} ${singleOrPlural} and now has ${user.points} (${rand}).`);
            }
        } else if (cmd === 'pull') {
            if (args.length < 7) {
                return;
            }

            let slotCount = parseInt(args[2]),
                optionCount = parseInt(args[3]);

            // If all of the arguments are there except for the amount, assume the rest are in the command.
            // This means the user didn't add the amount, and thus should get a response.
            // Since the arguments are assumed to be in the command, don't report them, since they mean nothing to the casual user.
            if (args.length === 5 + slotCount - 1 + optionCount - 1) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, pulls the slot machine with the given amount of ${namePlural}. The amount can be "all" to go all in.`);
                return;
            }

            if (args.length < 5 + slotCount - 1 + optionCount) {
                return;
            }

            let multipliers = [];

            for (let i = 0; i < slotCount - 1; i++) {
                multipliers[i] = parseFloat(args[4 + i]);
            }

            let options = [];

            for (let i = 0; i < optionCount; i++) {
                options[i] = args[4 + slotCount - 1 + i];
            }

            let amountArg = args[4 + slotCount - 1 + optionCount].toLowerCase(),
                amount;

            let user = channel.getUser(userName);

            if (amountArg === 'all') {
                amount = user.points || 0;
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

            if (amount > (user.points || 0)) {
                channel.message(`@${userName} you do not have ${amount} ${(amount === 1) ? nameSingle : namePlural}.`);
                return;
            }

            user.points = (user.points || 0) - amount;
            
            let results = [];

            for (let i = 0; i < slotCount; i++) {
                results[i] = options[Math.floor(Math.random() * slotCount)];
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
        } else if (cmd === 'eat') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} <amount>`);
                channel.message(`@${userName}, eats the given amount of ${namePlural}. The amount can be "all" to eat everything.`);
                return;
            }

            let user = channel.getUser(userName),
                arg2 = args[2].toLowerCase(),
                amount;

            if (arg2 === 'all') {
                amount = user.points || 0;
            } else {
                amount = parseInt(arg2);

                if (isNaN(amount)) {
                    channel.message(`@${userName}, "${arg2}" is not a number or "all".`);
                    return;
                }
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must eat 1 or more ${namePlural}.`)
                return;
            }

            let singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (amount > (user.points || 0)) {
                channel.message(`@${userName}, you do not have ${amount} ${singleOrPlural}.`);
                return;
            }

            user.points = (user.points || 0) - amount;
            user.eaten = (user.eaten || 0) + amount;

            channel.message(`@${userName} ate ${amount} ${singleOrPlural}. Yummy.`);
        } else if (cmd === 'eaten') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} <user>`);
                channel.message(`@${userName}, get the amount of ${namePlural} the given user has eaten.`);
                return;
            }

            let targetName = args[2].toLowerCase(),
                target = channel.getUser(targetName, true);

            if (!target) {
                channel.message(`@${userName}, I don't know who "${targetName}" is.`);
                return;
            }

            let amount = target.eaten || 0,
                singleOrPlural = (amount === 1) ? nameSingle : namePlural;

            if (userName === targetName) {
                channel.message(`@${userName}, you have eaten ${amount} ${singleOrPlural}.`);
            } else {
                channel.message(`@${target.name} has eaten ${amount} ${singleOrPlural}.`);
            }
        } else if (cmd === 'top') {
            if (args.length < 4) {
                channel.message(`@${userName}, usage: ${command.name} <count> <points|eaten>`);
                channel.message(`@${userName}, list the top count chatters, sorting based on ${namePlural} or eaten ${namePlural}.`);
                return;
            }

            let arg2 = args[2].toLowerCase(),
                amount = parseInt(arg2);

            if (isNaN(amount)) {
                channel.message(`@${userName}, "${arg2}" is not a number.`);
                return;
            }

            if (amount < 1) {
                channel.message(`@${userName}, you must list at least 1 chatter.`)
                return;
            }

            let users = Object.values(channel.users).slice();

            let arg3 = args[3].toLowerCase();

            if (arg3 === 'points') {
                users.sort((a, b) => (b.points || 0) - (a.points || 0));

                channel.message(`@${userName}, top ${amount} ${channel.settings.pointsHoldersNamePlural || 'chatters'}: ${users.slice(0, amount).map((a) => `${a.name} (${a.points || 0})`).join(', ')}.`)
            } else if (arg3 === 'eaten') {
                users.sort((a, b) => (b.eaten || 0) - (a.eaten || 0));

                channel.message(`@${userName}, top ${amount} eaters: ${users.slice(0, amount).map((a) => `${a.name} (${a.eaten || 0})`).join(', ')}.`)
            } else {
                channel.message(`@${userName}, unknown sort mode "${arg3}".`)
                return;
            }
        }
    }
};
