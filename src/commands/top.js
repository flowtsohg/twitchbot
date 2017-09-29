// args:
module.exports = {
    name: 'top',
    handler: function (channel, data) {
        let users = Object.values(channel.users).slice();

        users.sort((a, b) => b.points - a.points);

        let top = users.slice(0, 5);

        channel.chatMessage(`@${data.event.user}, top 5 ${channel.settings.pointsHoldersNamePlural}: ${top.map((a) => `${a.name} (${a.points})`).join(', ')}.`)
    }
};
