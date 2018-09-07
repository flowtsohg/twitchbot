let formatDate = require('../common/formatdate');

module.exports = {
    name: 'livetime',

    handler(channel, command, event, args) {
        let user = channel.users.get(event.user),
            userName = user.displayName || user.name;

        if (channel.isLive) {
            let d = new Date(Date.now() - channel.wentLiveOn);

            channel.message(`@${userName}, live for ${formatDate('{hh} hours, {mm} minutes, {ss} seconds', d)}`);
        } else {
            channel.message(`@${userName}, the channel is not live.`);
        }
    }
};
