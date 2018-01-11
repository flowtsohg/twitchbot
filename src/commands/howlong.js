let tmi = require('../tmi');

// args:
module.exports = {
    name: 'howlong',
    handler: function (channel, data) {
        let user = data.event.user;

        if (channel.name === user) {
            channel.message(`@${user} is following ${user} since birth.`);
            return;
        }

        tmi.api.getUserFollow(channel.bot.clientid, channel.name, user)
            .catch((reason) => {
                channel.message(`@${user} is not following ${channel.name}.`);
            })
            .then((json) => {
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

                channel.message(`@${user} has been following ${channel.name} for ${parts.join(', ')}.`);
            })
    }
};
