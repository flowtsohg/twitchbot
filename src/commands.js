class Commands {
    constructor(db, parent) {
        this.commands = db.commands;
        this.aliases = db.aliases;
        this.parent = parent;
    }

    add(name, permitted, response) {
        this.commands[name] = { name, permitted, response };
    }

    remove(name) {
        delete this.commands[name];
    }

    alias(name, target) {
        this.aliases[name] = { name, target };
    }

    unalias(name) {
        delete this.aliases[name];
    }

    get(name, rejectAliases) {
        if (!rejectAliases) {
            let alias = this.aliases[name];

            if (alias) {
                name = alias.target;
            }
        }

        let command;

        if (this.parent) {
            command = this.parent.get(name);
        }

        return command || this.commands[name];
    }
}

module.exports = Commands;
