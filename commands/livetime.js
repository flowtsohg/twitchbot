let formatDate = require('../common/formatdate');

module.exports = {
  name: 'livetime',

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (channel.isLive) {
      channel.message(`@${user.name}, live for ${formatDate('{hh} hours, {mm} minutes, {ss} seconds', (new Date(Date.now() - channel.wentLiveOn)))}`);
    } else {
      channel.message(`@${user.name}, the channel is not live.`);
    }
  },
};
