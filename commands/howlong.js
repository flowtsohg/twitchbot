let twitchApi = require('../src/twitchapi');

module.exports = {
    name: 'howlong',

    handler(channel, command, event, args) {
        let user = channel.users.get(event.user),
            userName = user.displayName || user.name,
            targetName = userName;

        if (args.length) {
            targetName = args[0];
        }

        if (channel.name === targetName.toLowerCase()) {
            channel.message(`@${targetName} is following #${channel.name} since birth.`);
            return;
        }

        twitchApi.getUserFollow(channel.bot.clientid, channel.name, targetName)
            .catch((reason) => {
                channel.message(`@${targetName} is not following #${channel.name}.`);
            })
            .then((json) => {
                if (json.status === 404) {
                    channel.message(`@${targetName} is not following #${channel.name}.`);
                } else {
                    let followDate = new Date(json.created_at),
                        d = new Date(Date.now() - followDate);

                    let years = d.getUTCFullYear() - 1970,
                        monthes = d.getUTCMonth(),
                        days = d.getUTCDate(),
                        hours = d.getUTCHours(),
                        minutes = d.getUTCMinutes(),
                        parts = [];

                    if (years > 0) {
                        parts.push(`${years} years`);
                    }

                    if (monthes > 0) {
                        parts.push(`${monthes} months`);
                    }

                    if (days > 0) {
                        parts.push(`${days} days`);
                    }

                    if (hours > 0) {
                        parts.push(`${hours} hours`);
                    }

                    if (minutes > 0) {
                        parts.push(`${minutes} minutes`);
                    }

                    channel.message(`@${targetName} has been following #${channel.name} for ${parts.join(', ')}.`);
                }
            })
    }
};
