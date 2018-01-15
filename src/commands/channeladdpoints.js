module.exports = {
    name: 'channeladdpoints',
    handler: function (channel, data) {
        let arg0 = data.args[0],
            amount = parseInt(arg0);

        if (isNaN(amount)) {
            channel.message(`Error at ${data.command.name}: "${arg0}" is not a number.`);
            return;
        }

        for (let chatter of channel.chatters.values()) {
            chatter.points += amount;
        }
    }
};
