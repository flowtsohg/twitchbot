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

    handler(channel, data) {
        let command = data.command,
            user = channel.users.get(data.event.user),
            userName = user.displayName || user.name,
            args = data.args;

        if (args.length < 1) {
            channel.message(`@${userName}, usage: ${command.name} <op> <...>`);
            channel.message(`@${userName}, available ops are: create, delete, add, remove, get, rand, list.`);
            return;
        }

        let op = args[0].toLowerCase();

        let tables = channel.db.tables;

        if (op === 'list') {
            let keys = Object.keys(tables);

            if (keys.length) {
                channel.message(`@${userName}, ${keys.join(', ')}`);
            } else {
                channel.message(`@${userName}, there are no tables.`);
            }

            return;
        }

        if (op === 'create') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} create <name>`);
                return;
            }

            let tableName = args[1].toLowerCase();

            if (tables[tableName]) {
                channel.message(`@${userName}, that table exists already.`);
            } else {
                tables[tableName] = {index: 1, rows: {}};

                channel.message(`@${userName}, created table "${tableName}".`);
            }
        } else if (op === 'delete') {
            if (args.length < 2) {
                channel.message(`@${userName}, usage: ${command.name} delete <name>`);
                return;
            }

            let tableName = args[1].toLowerCase();

            if (tables[tableName]) {
                delete tables[tableName];

                channel.message(`@${userName}, deleted table "${tableName}".`);
            } else {
                channel.message(`@${userName}, table "${tableName}" does not exist.`);
            }
        } else if (op === 'add') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} add <name> <value>`);
                return;
            }

            let tableName = args[1].toLowerCase(),
                table = tables[tableName];

            if (table) {
                let index = table.index;

                table.rows[table.index++] = args.slice(2).join(' ');

                channel.message(`@${userName}, added to "${tableName}" at index ${index}.`);
            } else {
                channel.message(`@${userName}, table "${tableName}" does not exist.`);
            }
        } else if (op === 'remove') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} remove <name> <index>`);
                return;
            }

            let tableName = args[1].toLowerCase(),
                table = tables[tableName];

            if (table) {
                let index = parseInt(args[2]);

                if (isNaN(index)) {
                    channel.message(`@${userName}, "${index}" is not a number.`);
                    return;
                }

                let rows = table.rows,
                    row = rows[index];

                if (row) {
                    delete rows[index];

                    channel.message(`@${userName}, removed ${index} from "${tableName}".`);
                } else {
                    channel.message(`@${userName}, "${tableName}" does not have ${index}.`);
                }
            } else {
                channel.message(`@${userName}, table "${tableName}" does not exist.`);
            }
        } else if (op === 'get') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} get <name> <index> <response>`);
                channel.message(`@${userName}, use $value and $index to inject them in the response.`);
                return;
            }

            let tableName = args[1].toLowerCase(),
                table = tables[tableName];

            if (table) {
                let index = parseInt(args[2]);

                if (isNaN(index)) {
                    channel.message(`@${userName}, "${args[2]}" is not a number.`);
                    return;
                }

                let rows = table.rows,
                    keys = Object.keys(rows);

                if (keys.length) {
                    let row = rows[index];

                    if (row) {
                        channel.message(`@${userName}, ${buildResponse(args.slice(3), row, index)}`);
                    } else {
                        channel.message(`@${userName}, there is no ${index} in "${tableName}".`);
                    }
                } else {
                    channel.message(`@${userName}, "${tableName}" is empty.`);
                }
            } else {
                channel.message(`@${userName}, table "${tableName}" does not exist.`);
            }
        } else if (op === 'rand') {
            if (args.length < 3) {
                channel.message(`@${userName}, usage: ${command.name} rand <name> <response>`);
                channel.message(`@${userName}, use $value and $index to inject them in the response.`);
                return;
            }

            let tableName = args[1].toLowerCase(),
                table = tables[tableName];

            if (table) {
                let rows = table.rows,
                    keys = Object.keys(rows);

                if (keys.length) {
                    let index = Math.floor(Math.random() * keys.length),
                        key = keys[index];

                    channel.message(`@${userName}, ${buildResponse(args.slice(2), rows[key], key)}`);
                } else {
                    channel.message(`@${userName}, "${tableName}" is empty.`);
                }

                return;
            } else {
                channel.message(`@${userName}, table "${tableName}" does not exist.`);
            }
        } else {
            channel.message(`@${userName}, what is "${op}"?`);
        }
    }
};
