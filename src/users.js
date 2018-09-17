let EventEmitter = require('events');

module.exports = class Users extends EventEmitter {
  /**
   * @param {DB} db
   */
  constructor(db) {
    super();

    this.users = db.users;
    this.chatters = new Map();
    this.mods = new Set();
  }

  /**
   * @param {string} displayName
   */
  add(displayName) {
    // All Twitch names are lower case.
    let name = displayName.toLowerCase();

    // If this user is a chatter, there is no need to do anything.
    let chatters = this.chatters;
    let chatter = chatters.get(name);

    if (chatter) {
      // Update the display name if needed.
      if (displayName !== name) {
        chatter.name = displayName;
      }

      return;
    }

    // If this user is in the DB, add it to the chatters.
    let users = this.users;
    let user = users[name];

    if (user) {
      chatters.set(name, user);
      return;
    } else {
      // Otherwise this is a new user, so create it, add it to the DB, and add it to the chatters.
      user = {name};

      // Allows commands to setup per-user data.
      // See Channel.eachUser().
      this.emit('new', user);

      users[name] = user;
      chatters.set(name, user);
    }

    // Update the display name if needed.
    if (displayName !== name) {
      user.name = displayName;
    }

    this.emit('added', user);
  }

  /**
   * @param {string} name
   * @param {boolean} mod
   */
  setMod(name, mod) {
    // All Twitch names are lower case.
    name = name.toLowerCase();

    if (mod) {
      this.mods.add(name);
    } else {
      this.mods.delete(name);
    }
  }

  /**
   * @param {string} name
   * @param {boolean} autocomplete
   * @return {?object}
   */
  get(name, autocomplete) {
    // All Twitch names are lower case.
    name = name.toLowerCase();

    // Allow to refer to users with the Twitch @user notation.
    if (name[0] === '@') {
      name = name.substring(1);
    }

    // If this is an active chatter, return it.
    let chatters = this.chatters;
    let chatter = chatters.get(name);

    if (chatter) {
      return chatter;
    }

    // Otherwise, if autocomplete is true, look for this name in the chatters.
    if (autocomplete) {
      for (let chatter of chatters.keys()) {
        if (chatter.startsWith(name)) {
          return chatters.get(chatter);
        }
      }
    }

    // Or maybe it's a user that is in the DB but not chatting right now.
    let users = this.users;
    let user = users[name];

    if (user) {
      return user;
    }

    // Autocomplete all users in the DB and look for that pesky user!
    if (autocomplete) {
      for (let user of Object.keys(users)) {
        if (user.startsWith(name)) {
          return users[user];
        }
      }
    }

    // Give up.
    return null;
  }

  /**
   * @param {string} name
   */
  remove(name) {
    // All Twitch names are lower case.
    name = name.toLowerCase();

    // Deletes this user from the chatters, the DB is not affected.
    this.chatters.delete(name);
  }
};
