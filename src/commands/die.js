module.exports = {
    name: 'die',
    
    handler(channel, data) {
        channel.bot.disconnect();
    }
};
