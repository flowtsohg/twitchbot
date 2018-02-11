let EventEmitter = require('events');
let Timer = require('./timer');

class Intervals extends EventEmitter {
    constructor(db) {
        super();

        this.intervals = db.intervals;
        this.timers = new Map();

        for (let interval of Object.values(db.intervals)) {
            this.addTimer(interval);
        }
    }

    add(name, timeout, response) {
        let intervals = this.intervals;

        if (!intervals[name]) {
            let interval = {
                name,
                timeout,
                response
            };

            intervals[name] = interval;

            this.addTimer(interval);
        }

        let interval = intervals[name];

        interval.timeout = timeout;
        interval.response = response;
    }

    remove(name) {
        delete this.intervals[name];

        this.removeTimer(name);
    }

    get(name) {
        return this.intervals[name];
    }

    stop() {
        for (let timer of this.timers) {
            timer.stop();
        }
    }

    addTimer(interval) {
        let timers = this.timers;

        if (!timers.has(interval.name)) {
            let timer = new Timer(() => this.emit('fired', interval), interval.timeout * 1000)
        
            timer.start();

            timers.set(interval.name, timer);

            return true;
        }

        return false;
    }

    removeTimer(name) {
        let timers = this.timers,
            timer = timers.get(name);

        if (timer) {
            timer.stop();
        }

        return timers.delete(name);
    }
}

module.exports = Intervals;
