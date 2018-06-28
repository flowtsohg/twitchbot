module.exports = {
    name: 'eval',

    handler(channel, data) {
        try {
            channel.message(eval(`(${data.args.join(' ')})`));
        } catch (e) {
            channel.message(`Failed: ${e}`);
        }
    }
};
