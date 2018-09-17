/**
 * @param {Array<string>} args
 * @param {string} value
 * @param {number} index
 * @return {string}
 */
function buildResponse(args, value, index) {
  return args.join(' ').replace(/\$value/g, '' + value).replace(/\$index/g, '' + index);
}

// create <name>
// delete <name>
// add <name> <value>
// remove <name> <index>
// get <name> <index> <response>
// rand <name> <response>
// list
module.exports = {
  name: 'table',

  eachChannel(channel) {
    if (!channel.tables) {
      channel.tables = {};
    }
  },

  handler(channel, command, event, args) {
    let user = channel.users.get(event.user);

    if (args.length < 1) {
      channel.message(`@${user.name}, usage: ${command.name} <operation> ...`);
      channel.message(`@${user.name}, possible operations are: create, delete, add, remove, get, rand, list.`);
      return;
    }

    let op = args[0].toLowerCase();

    let tables = channel.db.tables;

    if (op === 'list') {
      let keys = Object.keys(tables);

      if (keys.length) {
        channel.message(`@${user.name}, ${keys.join(', ')}`);
      } else {
        channel.message(`@${user.name}, there are no tables.`);
      }

      return;
    }

    if (op === 'create') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} create <name>`);
        return;
      }

      let tableName = args[1].toLowerCase();

      if (tables[tableName]) {
        channel.message(`@${user.name}, that table exists already.`);
      } else {
        tables[tableName] = {index: 1, rows: {}};

        channel.message(`@${user.name}, created table "${tableName}".`);
      }
    } else if (op === 'delete') {
      if (args.length < 2) {
        channel.message(`@${user.name}, usage: ${command.name} delete <name>`);
        return;
      }

      let tableName = args[1].toLowerCase();

      if (tables[tableName]) {
        delete tables[tableName];

        channel.message(`@${user.name}, deleted table "${tableName}".`);
      } else {
        channel.message(`@${user.name}, table "${tableName}" does not exist.`);
      }
    } else if (op === 'add') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} add <name> <value>`);
        return;
      }

      let tableName = args[1].toLowerCase();
      let table = tables[tableName];

      if (table) {
        let index = table.index;

        table.rows[table.index++] = args.slice(2).join(' ');

        channel.message(`@${user.name}, added to "${tableName}" at index ${index}.`);
      } else {
        channel.message(`@${user.name}, table "${tableName}" does not exist.`);
      }
    } else if (op === 'remove') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} remove <name> <index>`);
        return;
      }

      let tableName = args[1].toLowerCase();
      let table = tables[tableName];

      if (table) {
        let index = parseInt(args[2]);

        if (isNaN(index)) {
          channel.message(`@${user.name}, "${index}" is not a number.`);
          return;
        }

        let rows = table.rows;
        let row = rows[index];

        if (row) {
          delete rows[index];

          channel.message(`@${user.name}, removed ${index} from "${tableName}".`);
        } else {
          channel.message(`@${user.name}, "${tableName}" does not have ${index}.`);
        }
      } else {
        channel.message(`@${user.name}, table "${tableName}" does not exist.`);
      }
    } else if (op === 'get') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} get <name> <index> <response>`);
        channel.message(`@${user.name}, use $value and $index to inject them in the response.`);
        return;
      }

      let tableName = args[1].toLowerCase();
      let table = tables[tableName];

      if (table) {
        let index = parseInt(args[2]);

        if (isNaN(index)) {
          channel.message(`@${user.name}, "${args[2]}" is not a number.`);
          return;
        }

        let rows = table.rows;
        let keys = Object.keys(rows);

        if (keys.length) {
          let row = rows[index];

          if (row) {
            channel.message(`@${user.name}, ${buildResponse(args.slice(3), row, index)}`);
          } else {
            channel.message(`@${user.name}, there is no ${index} in "${tableName}".`);
          }
        } else {
          channel.message(`@${user.name}, "${tableName}" is empty.`);
        }
      } else {
        channel.message(`@${user.name}, table "${tableName}" does not exist.`);
      }
    } else if (op === 'rand') {
      if (args.length < 3) {
        channel.message(`@${user.name}, usage: ${command.name} rand <name> <response>`);
        channel.message(`@${user.name}, use $value and $index to inject them in the response.`);
        return;
      }

      let tableName = args[1].toLowerCase();
      let table = tables[tableName];

      if (table) {
        let rows = table.rows;
        let keys = Object.keys(rows);

        if (keys.length) {
          let index = Math.floor(Math.random() * keys.length);
          let key = keys[index];

          channel.message(`@${user.name}, ${buildResponse(args.slice(2), rows[key], key)}`);
        } else {
          channel.message(`@${user.name}, "${tableName}" is empty.`);
        }

        return;
      } else {
        channel.message(`@${user.name}, table "${tableName}" does not exist.`);
      }
    } else {
      channel.message(`@${user.name}, what is "${op}"?`);
    }
  },
};
