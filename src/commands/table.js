// args: <command> <table_name> <...>
// args: new <table_name>
// args: remove <table_name>
// args: add <table_name> args
// args: get <table_name> <number>
// args: random
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

        if ('list'.startsWith(tableCmd)) {
            channel.chatMessage(`@${user}, ${Object.keys(tables).join(', ')}`);
            return;
        }

        if (args.length < 3) {
            return;
        }

        let tableName = args[2].toLowerCase();

        if ('new'.startsWith(tableCmd)) {
            if (tables[tableName]) {
                channel.chatMessage(`@${user}, that table exists already.`);
                return;
            } else {
                tables[tableName] = [];
                channel.chatMessage(`@${user}, added table "${tableName}".`);
                return;
            }
        } else if ('remove'.startsWith(tableCmd)) {
            let table = tables[tableName];
            
            if (table) {
                delete tables[tableName];

                channel.chatMessage(`@${user}, removed table "${tableName}".`);
                return;
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
                return;
            }
        } else if ('add'.startsWith(tableCmd)) {
            let table = tables[tableName];

            if (table) {
                let index = table.push(`"${args.slice(3).join(' ')}" ~ ${user}`);

                channel.chatMessage(`@${user}, added to "${tableName}" at index ${index}.`);
                return;
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
                return;
            }
        } else if ('get'.startsWith(tableCmd)) {
            if (args.length < 4) {
                return;
            }

            let index = parseInt(args[3]);

            if (isNaN(index)) {
                channel.chatMessage(`@${user}, '${index}' is not a number.`);
                return;
            }

            // 1-based for them non-programmers.
            index -= 1;

            let table = tables[tableName];

            if (table) {
                if (index < 0 || index > table.length - 1) {
                    channel.chatMessage(`@${user}, index ${index} not in range [1, ${table.length}].`);
                    return;
                }

                channel.chatMessage(`@${user}, ${table[index]} (${index})`);
                return;
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
                return;
            }
        } else if ('random'.startsWith(tableCmd)) {
            let table = tables[tableName];

            if (table) {
                let index = Math.floor(Math.random() * table.length),
                    entry = table[index];

                channel.chatMessage(`@${user}, ${entry} (${index + 1})`);
                return;
            } else {
                channel.chatMessage(`@${user}, table "${tableName}" does not exist.`);
                return;
            }
        }
    }
};
