// args: add <name> <timeout> <response>
// args: edit <name> <response>
// args: remove <name>
// args: list
module.exports = {
  name: 'intervals',

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
        channel.message(`@${user.name}, usage: ${command.name} add <name> <timeout> <response>`);
        return;
      }

      let intervalName = args[1].toLowerCase();

      if (channel.intervals.get(intervalName)) {
        channel.message(`@${user.name}, that interval name exists already.`);
        return;
      }

      let arg2 = args[2];
      let timeout = parseInt(arg2);

      if (isNaN(timeout)) {
        channel.message(`@${user.name}, "${arg2}" is not a number.`);
        return;
      }

      if (timeout < 0) {
        channel.message(`@${user.name}, the interval must be positive.`);
        return;
      }

      let timer = channel.intervals.add(intervalName, timeout, args.slice(3).join(' '));

      // Start the timer if the interval was actually added.
      if (timer) {
        timer.start();
      }

      channel.message(`@${user.name}, done.`);
    } else if (op === 'edit') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} edit <name> <response>.`);
        return;
      }

      let result = channel.intervals.get(args[1].toLowerCase());

      if (!result) {
        channel.message(`@${user.name}, that interval does not exist.`);
        return;
      }

      result.response = args.slice(2).join(' ');

      channel.message(`@${user.name}, done.`);
    } else if (op === 'remove') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} remove <name>`);
        return;
      }

      let intervalName = args[1].toLowerCase();

      if (!channel.intervals.get(intervalName)) {
        channel.message(`@${user.name}, that interval does not exist.`);
        return;
      }

      channel.intervals.remove(intervalName);

      channel.message(`@${user.name}, done.`);
    } else if (op === 'inspect') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} inspect <name>`);
        return;
      }

      let arg1 = args[1];
      let interval = channel.intervals.get(arg1.toLowerCase());

      if (!interval) {
        channel.message(`@${user.name}, that interval does not exist.`);
        return;
      }

      channel.message(`@${user.name} ${interval.response}`);
    } else if (op === 'list') {
      let intervals = [];

      for (let interval of Object.values(channel.intervals.intervals)) {
        intervals.push(`${interval.name} (${interval.timeout})`);
      }

      channel.message(`@${user.name}, ${intervals.join(', ')}.`);
    } else {
      channel.message(`@${user.name}, what is "${op}"?`);
    }
  },
};
