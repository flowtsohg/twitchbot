// args:
module.exports = {
    name: 'points',
    handler: function (channel, data) {
        let userName = data.event.user,
            user = channel.getUser(userName),
            amount = user.points,
            singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        channel.chatMessage(`@${userName}, you have ${amount} ${singleOrPlural}.`);
    }
};
