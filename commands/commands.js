// add <name> <permitted> <response>
// edit <name> <response>
// remove <name>
// list
// inspect <name>
module.exports = {
  name: 'commands',

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      channel.message(`@${user.name}, usage: ${command.name} <operation> ...`);
      channel.message(`@${user.name}, possible operations: add, edit, remove, list, inspect.`);
      return;
    }

    let op = args[0].toLowerCase();

    if (op === 'add') {
      if (args.length < 4) {
        channel.message(`@${user.name}, usage: ${command.name} add <name> <permitted> <response>`);
        return;
      }

      let commandName = args[1].toLowerCase();

      if (channel.commands.get(commandName)) {
        channel.message(`@${user.name}, that command name exists already.`);
        return;
      }

      let arg2 = args[2].toLowerCase();
      let permitted = [];
      let privLevel = channel.getUserPrivLevel(user.name);

      if (arg2 === 'all') {
        permitted[0] = 'all';
      } else if (arg2 === 'mod') {
        if (privLevel > 0) {
          permitted[0] = 'mod';
        } else {
          channel.message(`@${user.name}, you do not have permissions to use '${arg2}'`);
          return;
        }
      } else if (arg2 === 'streamer') {
        if (privLevel > 1) {
          permitted[0] = 'streamer';
        } else {
          channel.message(`@${user.name}, you do not have permissions to use '${arg2}'`);
          return;
        }
      } else if (arg2 === 'owner') {
        if (privLevel > 2) {
          permitted[0] = 'owner';
        } else {
          channel.message(`@${user.name}, you do not have permissions to use '${arg2}'`);
          return;
        }
      } else {
        let target = channel.users.get(arg2, true);

        if (!target) {
          channel.message(`@${user.name}, I don't know who '${arg2}' is.`);
          return;
        }

        permitted[0] = target.name;
      }

      channel.commands.add(commandName, permitted, args.slice(3).join(' '));

      channel.message(`@${user.name}, done.`);
    } else if (op === 'edit') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} edit <name> <response>.`);
        return;
      }

      let arg1 = args[1].toLowerCase();
      let result = channel.commands.get(arg1, true);

      if (!result) {
        channel.message(`@${user.name}, that command does not exist.`);
        return;
      }

      result.response = args.slice(2).join(' ');

      channel.message(`@${user.name}, done.`);
    } else if (op === 'remove') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} remove <name>`);
        return;
      }

      let arg1 = args[1].toLowerCase();

      if (!channel.commands.get(arg1, true)) {
        channel.message(`@${user.name}, that command does not exist.`);
        return;
      }

      channel.commands.remove(arg1);

      channel.message(`@${user.name}, done.`);
    } else if (op === 'inspect') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} remove <name>`);
        return;
      }

      let arg1 = args[1];
      let command = channel.commands.get(arg1.toLowerCase(), true);

      if (!command) {
        channel.message(`@${user.name}, that command does not exist.`);
        return;
      }

      channel.message(`@${user.name} ${command.response}`);
    } else if (op === 'list') {
      let privAll = [];
      let privMod = [];
      let privStreamer = [];
      let privOwner = [];
      let privSpecific = [];

      for (let command of [...Object.values(channel.bot.commands.commands), ...Object.values(channel.commands.commands)]) {
        let token = channel.getPrivToken(user.name, command);

        if (token === 'all') {
          privAll.push(command.name);
        } else if (token === 'mod') {
          privMod.push(command.name);
        } else if (token === 'streamer') {
          privStreamer.push(command.name);
        } else if (token === 'owner') {
          privOwner.push(command.name);
        } else if (token !== '') {
          privSpecific.push(command.name);
        }
      }

      privAll = privAll.sort();
      privMod = privMod.sort();
      privStreamer = privStreamer.sort();
      privOwner = privOwner.sort();
      privSpecific = privSpecific.sort();

      let commands = [];

      if (privAll.length) {
        commands.push(privAll.join(', '));
      }

      if (privMod.length) {
        commands.push(privMod.join(' (mod), ') + ' (mod)');
      }

      if (privStreamer.length) {
        commands.push(privStreamer.join(' (streamer), ') + ' (streamer)');
      }

      if (privOwner.length) {
        commands.push(privOwner.join(' (owner), ') + ' (owner)');
      }

      if (privSpecific.length) {
        commands.push(privSpecific.join(' (specific), ') + ' (specific)');
      }

      channel.message(`@${user.name}, ${commands.join(', ')}.`);
    } else {
      channel.message(`@${user.name}, what is "${op}"?`);
    }
  },
};
