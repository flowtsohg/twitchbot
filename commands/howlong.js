let twitchApi = require('../src/twitchapi');

module.exports = {
  name: 'howlong',

  handler(channel, command, event, args) {
    let user;

    if (args.length) {
      user = channel.users.get(args[0]);
    } else {
      user = channel.users.get(event.user);
    }

    if (channel.name === user.name.toLowerCase()) {
      channel.message(`@${user.name} is following #${channel.name} since birth.`);
      return;
    }

    twitchApi.getUserFollow(channel.bot.clientid, channel.name, user.name)
      .catch((reason) => {
        channel.message(`@${user.name} is not following #${channel.name}.`);
      })
      .then((json) => {
        if (json.status === 404) {
          channel.message(`@${user.name} is not following #${channel.name}.`);
        } else {
          let followDate = new Date(json.created_at);
          let d = new Date(Date.now() - followDate);
          let years = d.getUTCFullYear() - 1970;
          let monthes = d.getUTCMonth();
          let days = d.getUTCDate();
          let hours = d.getUTCHours();
          let minutes = d.getUTCMinutes();
          let parts = [];

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

          channel.message(`@${user.name} has been following #${channel.name} for ${parts.join(', ')}.`);
        }
      });
  },
};
