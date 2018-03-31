module.exports = class Timer {
    constructor(handler, timeout) {
        this.handler = handler;
        this.timeout = timeout;
        this.interval = 0;
    }

    start() {
        if (!this.interval) {
            this.interval = setInterval(() => this.handler(this), this.timeout);
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);

            this.interval = 0;
        }
    }

    setTimeout(timeout) {
        this.timeout = timeout;

        if (this.interval) {
            this.stop();
            this.start();
        }
    }
};
