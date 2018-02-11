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

    addAlias(name, target) {
        this.aliases[name] = { name, target };
    }

    removeAlias(name) {
        delete this.aliases[name];
    }

    get(name) {
        let alias = this.aliases[name];

        if (alias) {
            name = alias.target;
        }

        let command;

        if (this.parent) {
            command = this.parent.get(name);
        }

        return command || this.commands[name];
    }
}

module.exports = Commands;
