// args: <user>
module.exports = {
  name: 'whois',

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      channel.message(`@${user.name}, usage: ${command.name} <user>`);
      return;
    }

    let arg0 = args[0];
    let target = channel.users.get(arg0, true);

    if (!target) {
      channel.message(`@${user.name}, I don't know who '${arg0}' is.`);
      return;
    }

    if (user.name === target.name) {
      channel.message(`@${user.name}, you are special.`);
      return;
    }

    let privLevel = channel.getUserPrivLevel(target.name);

    if (privLevel === 0) {
      channel.message(`@${target.name} is a chatter.`);
    } else if (privLevel === 1) {
      channel.message(`@${target.name} is a moderator.`);
    } else if (privLevel === 2) {
      channel.message(`@${target.name} is the streamer.`);
    } else if (privLevel === 3) {
      channel.message(`@${target.name} is the owner.`);
    }
  },
};
