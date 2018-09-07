module.exports = {
    name: 'eval',

    handler(channel, command, event, args) {
        try {
            channel.message(eval(`(${args.join(' ')})`));
        } catch (e) {
            channel.message(`Failed: ${e}`);
        }
    }
};
