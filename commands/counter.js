/**
 * @param {Array<string>} args
 * @param {string} value
 * @return {string}
 */
function buildResponse(args, value) {
  return args.join(' ').replace(/\$value/g, '' + value);
}

// create <name>
// delete <name>
// add <name> <amount> <response>
// list
module.exports = {
  name: 'counter',

  eachChannel(channel) {
    let db = channel.db;

    if (!db.counters) {
      db.counters = {};
    }
  },

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      channel.message(`@${user.name}, usage: ${command.name} <operation> ...`);
      channel.message(`@${user.name}, possible operations: create, delete, add, list.`);
      return;
    }

    let op = args[0].toLowerCase();
    let counters = channel.db.counters;

    if (op === 'list') {
      let keys = Object.keys(counters);

      if (keys.length) {
        channel.message(`@${user.name}, ${keys.join(', ')}.`);
      } else {
        channel.message(`@${user.name}, there are no counters.`);
      }

      return;
    }

    if (op === 'create') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} create <name>`);
        return;
      }

      let counterName = args[1].toLowerCase();

      if (counters[counterName]) {
        channel.message(`@${user.name}, that counter exists already.`);
      } else {
        counters[counterName] = {value: 0};

        channel.message(`@${user.name}, created counter "${counterName}".`);
      }
    } else if (op === 'delete') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} delete <name>`);
        return;
      }

      let counterName = args[1].toLowerCase();

      if (counters[counterName]) {
        delete counters[counterName];

        channel.message(`@${user.name}, deleted counter "${counterName}".`);
      } else {
        channel.message(`@${user.name}, counter "${counterName}" does not exist.`);
      }
    } else if (op === 'add') {
      if (args.length < 4) {
        channel.message(`@${user.name}, usage: ${command.name} add <name> <amount> <response>`);
        channel.message(`@${user.name}, use $value to inject the counter value.`);
        return;
      }

      let counterName = args[1].toLowerCase();
      let counter = counters[counterName];

      if (counter) {
        let arg2 = args[2];
        let amount = parseInt(arg2.toLowerCase());

        if (isNaN(amount)) {
          channel.message(`@${user.name}, "${arg2}" is not a number.`);
          return;
        }

        counter.value += amount;

        channel.message(`@${user.name}, ${buildResponse(args.slice(3), counter.value)}`);
      } else {
        channel.message(`@${user.name}, counter "${counterName}" does not exist.`);
      }
    } else {
      channel.message(`@${user.name}, what is "${op}"?`);
    }
  },
};
