module.exports = {
    name: 'channeladdseconds',

    handler(channel, command, event, args) {
        let arg0 = args[0],
            amount = parseInt(arg0);

        if (isNaN(amount)) {
            channel.message(`Error at ${command.name}: "${arg0}" is not a number.`);
            return;
        }

        for (let chatter of channel.users.chatters.values()) {
            chatter.seconds += amount;
        }
    }
};
