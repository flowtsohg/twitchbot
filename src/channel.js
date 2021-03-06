let EventEmitter = require('events');
let Timer = require('./timer');
let twitchApi = require('./twitchapi');
let Commands = require('./commands');
let Intervals = require('./intervals');
let Users = require('./users');

module.exports = class Channel extends EventEmitter {
  /**
   * @param {Bot} bot
   * @param {string} name
   * @param {object} db
   */
  constructor(bot, name, db) {
    super();

    this.bot = bot;
    this.name = name.toLowerCase();
    this.db = db;
    this.settings = db.settings;

    this.joined = false;

    this.muted = false;

    // Live status.
    this.isLive = false;
    this.wentLiveOn = 0;

    // Outgoing hosts.
    this.isHosting = false;
    this.hostTarget = '';

    // Incoming hosts.
    this.isHosted = false;
    this.hosts = new Set();

    // bot.commands is used as the parent of this commands object.
    // This adds automatic lookup of global commands when no channel specific commands are matched.
    this.commands = new Commands(db, bot.commands);

    // The channel's message queue.
    this.queue = [];

    // The last time a command ran.
    this.lastCommandTime = 0;

    this.intervals = new Intervals(db);
    this.intervals.on('fired', (interval) => this.runCommand(interval));

    this.users = new Users(db);
    this.users.on('added', (user) => this.eachUser(user));

    this.updater = new Timer(() => this.update(), 30000);
  }

  /**
   * Called for each new user.
   * This allows commands to add specific data they want to each user.
   * For example, the points command sets the points field of each user.
   *
   * @param {object} user
   */
  eachUser(user) {
    for (let command of this.bot.nativeCommands.values()) {
      if (typeof command.eachUser === 'function') {
        command.eachUser(user);
      }
    }
  }

  /**
   * Called automatically.
   */
  join() {
    this.joined = true;

    this.updater.start();
    this.update();

    this.intervals.start();

    // Load up this channel's chatters list.
    // While this requires an HTTP fetch, it is still a lot faster than waiting for the initial JOIN events.
    // See the comment below in handleEvent().
    this.loadChattersList();
  }

  /**
   *
   */
  part() {
    this.joined = false;

    this.updater.stop();
    this.intervals.stop();

    this.emit('parted', this);
  }

  /**
   *
   */
  disconnected() {
    this.joined = false;

    this.updater.stop();
    this.intervals.stop();
  }

  /**
   * @param {string} message
   */
  message(message) {
    if (!this.muted) {
      this.queue.push(message);
    }
  }

  /**
   * @param {string} message
   */
  log(message) {
    this.bot.log(`#${this.name} ${message}`);
  }

  /**
   * @param {string} userName
   * @return {number}
   */
  getUserPrivLevel(userName) {
    userName = userName.toLowerCase();

    // Owner.
    if (userName === this.bot.connection.name) {
      return 3;
      // Streamer.
    } else if (userName === this.name) {
      return 2;
      // Moderator.
    } else if (this.users.mods.has(userName)) {
      return 1;
    }

    // Normal user.
    return 0;
  }

  /**
   * See if a user matches any of the tokens in a command, and thus is allowed to run it.
   *
   * @param {string} userName
   * @param {object} command
   * @return {string}
   */
  getPrivToken(userName, command) {
    userName = userName.toLowerCase();

    for (let token of command.permitted) {
      if (token === userName) {
        return userName;
      } else if (token === 'owner') {
        if (userName === this.bot.connection.name) {
          return 'owner';
        }
      } else if (token === 'streamer') {
        if (userName === this.name) {
          return 'streamer';
        }
      } else if (token === 'mod') {
        if (this.users.mods.has(userName)) {
          return 'mod';
        }
      } if (token === 'all') {
        return 'all';
      }
    }

    return '';
  }

  /**
   * @param {string} userName
   * @param {object} command
   * @return {boolean}
   */
  isPrivForCommand(userName, command) {
    // See if the user matches one of the privilege tokens.
    // The bot owner is always privileged.
    return !!this.getPrivToken(userName, command) || userName === this.bot.name;
  }

  /**
   * @param {string} data
   * @param {object} event
   * @return {string}
   */
  handleReplacements(data, event) {
    data = data.replace(/\$streamer/g, this.name);
    data = data.replace(/\$owner/g, this.bot.connection.name);

    if (event) {
      // Use the display name when it exists.
      // This perserves capital letters and such.
      data = data.replace(/\$user/g, event.tags['display-name'] || event.user);

      // Arguments must be processed after all other substitutions.
      // This is to allow the arguments themselves to be templates like $user.
      let args = event.data.split(' ').slice(1);

      data = data.replace(/\$arg(\d+)/g, (match, index) => {
        return args[parseInt(index)] || '';
      });

      data = data.replace(/\$args/g, args.join(' '));
    }

    return data.trim();
  }

  /**
   * @param {object} command
   * @param {object} event
   */
  runCommand(command, event) {
    let message = this.handleReplacements(command.response, event);

    if (message.startsWith('$')) {
      let args = message.split(' ');
      let arg0 = args[0];
      let nativeCommand = this.bot.nativeCommands.get(arg0.substring(1));

      if (nativeCommand) {
        // Remove the native command name.
        args.shift();

        // Run the command.
        nativeCommand.handler(this, command, event, args);

        return;
      }
    }

    this.message(message);
  }

  /**
   * @param {object} event
   */
  handleCommand(event) {
    let command = this.commands.get(event.data.split(' ', 1)[0].toLowerCase());

    if (command) {
      let t = Date.now();

      // If the time since the last command is bigger than the commands delay, run the command.
      if (t - this.lastCommandTime > this.settings.commandsDelay) {
        this.lastCommandTime = t;

        // But only run it if the user is allowed to.
        if (this.isPrivForCommand(event.user, command)) {
          this.runCommand(command, event);
        } else {
          this.message(`@${event.user}, you are not allowed to use that.`);
        }
      }
    }
  }

  /**
   * Fake a message recieved from Twitch, for easy local command invocations, or other uses.
   * The message user is the bot owner.
   *
   * @param {string} message
   */
  fakeMessage(message) {
    this.bot.fakeMessage(this.name, message);
  }

  /**
   * @param {object} event
   */
  handleEvent(event) {
    let type = event.type;
    let tags = event.tags;
    let user = tags['display-name'] || event.user;

    // The ROOMSTATE event doesn't contain a user.
    if (user) {
      // While the JOIN event should have been used to check if a user joined, it doesn't work like that.
      // Twitch batches join/part events and sends them sometimes after a long time.
      // This means that a user can join the channel and send a message long before the join event comes through.
      this.users.add(user);

      // Another place to get mod status.
      if (tags.mod === '1') {
        this.users.setMod(user, true);
      }
    }

    if (type === 'message') {
      if (this.settings.commandsEnabled) {
        this.handleCommand(event);
      }
    } else if (type === 'part') {
      this.users.remove(user);
    } else if (type === 'mode') {
      if (event.mode === '+') {
        this.users.setMod(user, true);
      } else {
        this.users.setMod(user, false);
      }
    } else if (type === 'names') {
      // Handle the names list, even though it's not really needed due to the chatters list being obtained via HTTP above in join().
      for (let name of event.data.split(' ')) {
        this.users.add(name);
      }
    } else if (type === 'host') {
      let target = event.target;

      if (target === '-') {
        this.isHosting = false;
        this.hostTarget = '';
      } else {
        this.isHosting = true;
        this.hostTarget = target;

        if (this.isLive) {
          this.isLive = false;

          this.emit('live', this);
        }
      }
    }

    this.emit(type, this, event);
  }

  /**
   *
   */
  async loadChattersList() {
    this.log('Trying to get chatters list...');

    let json = await twitchApi.getChatters(this.name);

    if (json) {
      let chatters = json.chatters;
      let users = this.users;

      this.log(`Got chatters list with ${chatters.moderators.length} mods and ${chatters.viewers.length} viewers.`);

      for (let mod of chatters.moderators) {
        users.add(mod);
        users.setMod(mod, true);
      }

      for (let viewer of chatters.viewers) {
        users.add(viewer);
      }
    }
  }

  /**
   *
   */
  async update() {
    // Check if the channel is live or not.
    // Note that this may be delayed a lot, depending on Twitch.
    if (!this.isHosting) {
      let json = await twitchApi.getStream(this.bot.clientid, this.name);

      // Check if hosting again, because the fetch might have happened before getting the host event.
      if (json && !this.isHosting) {
        let isLive = !!json.stream;

        if (isLive !== this.isLive) {
          this.isLive = isLive;

          // Clear hosts when the channel goes offline.
          if (!isLive) {
            this.isHosted = false;
            this.hosts.clear();
          }

          let stream = json.stream;

          if (stream) {
            this.wentLiveOn = new Date(stream.created_at).getTime();
          } else {
            this.wentLiveOn = 0;
          }

          // If live the stream object is given, otherwise it will be undefined.
          this.emit('live', this, stream);
        }
      }
    }

    // If the channel is live, check if someone is hosting it, and update the hosts.
    if (this.isLive) {
      let json = await twitchApi.getHosts(this.bot.clientid, this.name);

      if (json && json.hosts.length) {
        let hosts = new Set();

        for (let host of json.hosts) {
          hosts.add(host.host_login);
        }

        // Remove hosts that are no longer hosting.
        for (let host of this.hosts) {
          if (!hosts.has(host)) {
            this.hosts.delete(host);

            this.emit('hosted', this, host, false);
          }
        }

        // Add new hosts.
        for (let host of hosts) {
          if (!this.hosts.has(host)) {
            this.hosts.add(host);

            this.emit('hosted', this, host, true);
          }
        }

        this.isHosted = this.hosts.length > 0;
      }
    }
  }
};
