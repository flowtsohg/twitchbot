// Table
// args: create <name>
// args: delete <name>
// args: list

// Rows
// args: add <table> <...>
// args: remove <table> <index>
// args: get <table> <index>
// args: rand <table>
module.exports = {
    name: 'table',
    handler: function (channel, data) {
        let command = data.command,
            user = data.event.user,
            args = data.args;
        
        if (args.length < 2) {
            return;
        }

        let tableCmd = args[1].toLowerCase();

        if (!channel.db.tables) {
            channel.db.tables = {};
        }

        let tables = channel.db.tables;

        if (tableCmd === 'list') {
            let keys = Object.keys(tables);

            if (keys.length) {
                channel.chatMessage(`@${user}, ${Object.keys(tables).join(', ')}`);
            } else {
                channel.chatMessage(`@${user}, there are no tables.`);
            }
            
            return;
        }

        if (args.length < 3) {
            return;
        }

        let tableName = args[2].toLowerCase();

        if (tableCmd === 'create') {
            if (tables[tableName]) {
                channel.chatMessage(`@${user}, that table exists already.`);
            } else {
                tables[tableName] = { index: 1, rows: {} };

                channel.chatMessage(`@${user}, created table "${tableName}".`);
            }
        } else if (tableCmd === 'delete') {
            if (tables[tableName]) {
                delete tables[tableName];

                channel.chatMessage(`@${user}, deleted table "${tableName}".`);
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
            }
        } else if (tableCmd === 'add') {
            let table = tables[tableName];

            if (table) {
                if (args.length < 4) {
                    return;
                }

                let index = table.index;

                table.rows[table.index++] = `"${args.slice(3).join(' ')}" ~ ${user}`;

                channel.chatMessage(`@${user}, added to "${tableName}" at index ${index}.`);
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
            }
        } else if (tableCmd === 'remove') {
            let table = tables[tableName];

            if (table) {
                if (args.length < 4) {
                    return;
                }

                let index = parseInt(args[3]);
                
                if (isNaN(index)) {
                    channel.chatMessage(`@${user}, "${index}" is not a number.`);
                    return;
                }

                let rows = table.rows,
                    row = rows[index];

                if (row) {
                    delete rows[index];

                    channel.chatMessage(`@${user}, removed ${index} from "${tableName}".`);
                } else {
                    channel.chatMessage(`@${user}, "${tableName}" does not have ${index}.`);
                }
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
            }
        } else if (tableCmd === 'get') {
            if (args.length < 4) {
                return;
            }

            let index = parseInt(args[3]);

            if (isNaN(index)) {
                channel.chatMessage(`@${user}, "${index}" is not a number.`);
                return;
            }

            let table = tables[tableName];

            if (table) {
                let rows = table.rows,
                    keys = Object.keys(rows);

                if (keys.length) {
                    let row = rows[index];
                    
                    if (row) {
                        channel.chatMessage(`@${user}, ${row} (${index})`);
                    } else {
                        channel.chatMessage(`@${user}, there is no ${index} in "${tableName}".`);
                    }
                } else {
                    channel.chatMessage(`@${user}, "${tableName}" is empty.`);
                }
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
            }
        } else if (tableCmd === 'rand') {
            let table = tables[tableName];

            if (table) {
                let rows = table.rows,
                    keys = Object.keys(rows);

                if (keys.length) {
                    let index = Math.floor(Math.random() * keys.length),
                        key = keys[index];

                    channel.chatMessage(`@${user}, ${rows[key]} (${key})`);
                } else {
                    channel.chatMessage(`@${user}, "${tableName}" is empty.`);
                }

                return;
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
            }
        }
    }
};
