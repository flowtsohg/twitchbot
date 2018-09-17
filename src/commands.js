module.exports = class Commands {
  /**
   * @param {object} db
   * @param {Commands} parent
   */
  constructor(db, parent) {
    this.commands = db.commands;
    this.aliases = db.aliases;
    this.parent = parent;
  }

  /**
   * @param {string} name
   * @param {Array<string>} permitted
   * @param {string} response
   */
  add(name, permitted, response) {
    if (!this.commands[name]) {
      this.commands[name] = {name, permitted, response};
    }
  }

  /**
   * @param {string} name
   */
  remove(name) {
    delete this.commands[name];
  }

  /**
   * @param {string} name
   * @param {string} target
   */
  alias(name, target) {
    this.aliases[name] = {name, target};
  }

  /**
   * @param {string} name
   */
  unalias(name) {
    delete this.aliases[name];
  }

  /**
   * @param {string} name
   * @param {boolean} rejectAliases
   * @return {object}
   */
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
};
