module.exports = {
    name: 'hours',

    eachUser(user) {
        user.seconds = 0;
    },

    handler(channel, command, event, args) {
        let user = channel.users.get(event.user),
            userName = user.displayName || user.name;

        channel.message(`@${userName}, ${Math.floor(user.seconds / 360) / 10} hours.`);
    }
};
