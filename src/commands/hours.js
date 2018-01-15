module.exports = {
    name: 'hours',
    handler: function (channel, data) {
        let userName = data.event.user,
            user = channel.getUser(userName);

        channel.message(`@${userName}, ${Math.floor(user.seconds / 360) / 10} hours.`);
    }
};
