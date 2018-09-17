let EventEmitter = require('events');
let Timer = require('./timer');

module.exports = class Intervals extends EventEmitter {
  /**
   * @param {object} db
   */
  constructor(db) {
    super();

    this.intervals = db.intervals;
    this.timers = new Map();

    for (let interval of Object.values(db.intervals)) {
      this.addTimer(interval);
    }
  }

  /**
   * @param {string} name
   * @param {number} timeout
   * @param {string} response
   * @return {?Timer}
   */
  add(name, timeout, response) {
    let intervals = this.intervals;

    if (!intervals[name]) {
      let interval = {
        name,
        timeout,
        response,
      };

      intervals[name] = interval;

      return this.addTimer(interval);
    }

    let interval = intervals[name];

    interval.timeout = timeout;
    interval.response = response;

    return null;
  }

  /**
   * @param {string} name
   */
  remove(name) {
    delete this.intervals[name];

    this.removeTimer(name);
  }

  /**
   * @param {string} name
   * @return {object}
   */
  get(name) {
    return this.intervals[name];
  }

  /**
   *
   */
  start() {
    for (let timer of this.timers.values()) {
      timer.start();
    }
  }

  /**
   *
   */
  stop() {
    for (let timer of this.timers.values()) {
      timer.stop();
    }
  }

  /**
   * @param {object} interval
   * @return {?Timer}
   */
  addTimer(interval) {
    let timers = this.timers;

    if (!timers.has(interval.name)) {
      let timer = new Timer(() => this.emit('fired', interval), interval.timeout * 1000);

      timers.set(interval.name, timer);

      return timer;
    }

    return null;
  }

  /**
   * @param {string} name
   * @return {boolean}
   */
  removeTimer(name) {
    let timers = this.timers;
    let timer = timers.get(name);

    if (timer) {
      timer.stop();
    }

    return timers.delete(name);
  }
};
