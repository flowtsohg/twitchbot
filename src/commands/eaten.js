// args:
module.exports = {
    name: 'eaten',
    handler: function (channel, data) {
        let user = data.event.user,
            realUser = channel.getUser(user),
            amount = realUser.eaten,
            singleOrPlural = (amount === 1) ? channel.settings.pointsNameSingle : channel.settings.pointsNamePlural;

        channel.chatMessage(`@${user}, you have eaten ${amount} ${singleOrPlural}.`);
    }
};
