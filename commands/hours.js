module.exports = {
    name: 'hours',

    eachUser(user) {
        user.seconds = 0;
    },

    handler(channel, data) {
        let user = channel.users.get(data.event.user),
            userName = user.displayName || user.name;

        channel.message(`@${userName}, ${Math.floor(user.seconds / 360) / 10} hours.`);
    }
};
