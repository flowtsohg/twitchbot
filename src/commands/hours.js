module.exports = {
    name: 'hours',

    eachUser(user) {
        user.seconds = 0;
    },

    handler(channel, data) {
        let userName = data.event.user,
            user = channel.users.get(userName);

        channel.message(`@${userName}, ${Math.floor(user.seconds / 360) / 10} hours.`);
    }
};
