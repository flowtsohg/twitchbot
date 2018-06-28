// <user>
module.exports = {
    name: 'autocomplete',

    handler(channel, data) {
        let user = channel.users.get(data.event.user),
            userName = user.displayName || user.name,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${data.command.name} <user>`);
            channel.message(`@${userName}, takes a partial name of a user, and tries to autocomplete it.`);
            return;
        }

        let targetName = args[0],
            target = channel.users.get(targetName, true);

        if (target) {
            channel.message(`@${userName}, I see "${targetName}" as ${target.displayName || target.name}.`);
        } else {
            channel.message(`@${userName}, I don't know who "${targetName}" is.`);
        }
    }
};
