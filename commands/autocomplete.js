// <user>
module.exports = {
  name: 'autocomplete',

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      channel.message(`@${user.name}, usage: ${command.name} <user>`);
      channel.message(`@${user.name}, takes a partial name of a user, and tries to autocomplete it.`);
      return;
    }

    let arg0 = args[0];
    let target = channel.users.get(arg0, true);

    if (target) {
      channel.message(`@${user.name}, I see "${arg0}" as ${target.name}.`);
    } else {
      channel.message(`@${user.name}, I don't know who "${arg0}" is.`);
    }
  },
};
