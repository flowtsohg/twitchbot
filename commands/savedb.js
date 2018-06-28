module.exports = {
    name: 'savedb',

    handler(channel, data) {
        channel.bot.db.save();
    }
};
