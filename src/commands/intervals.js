// args:
module.exports = {
    name: 'intervals',
    handler: function (channel, data) {
        let intervals = [];

        for (let interval of Object.values(channel.intervals)) {
            intervals.push(`${interval.name} (${interval.timeout})`);
        }

        channel.chatMessage(`@${data.event.user}, ${intervals.join(', ')}.`);
    }
};
