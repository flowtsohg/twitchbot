let formatDate = require('../common/formatdate');

module.exports = {
    name: 'livetime',

    handler(channel, data) {
        let userName = data.event.user;

        if (channel.isLive) {
            let d = new Date(Date.now() - channel.wentLiveOn);

            channel.message(`@${userName}, live for ${formatDate('{hh} hours, {mm} minutes, {ss} seconds', d)}`);
        } else {
            channel.message(`@${userName}, the channel is not live.`);
        }
    }
};
