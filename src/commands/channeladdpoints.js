module.exports = {
    name: 'channeladdpoints',
    handler: function (channel, data) {
        let amount = parseInt(data.args[1]);

        if (isNaN(amount)) {
            channel.chatMessage(`Error at ${data.command.name}: '${data.args[1]}' is not a number.`);
            return;
        }

        for (let chatter of channel.chatters.values()) {
            chatter.points += amount;
        }
    }
};
