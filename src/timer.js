class Timer  {
    constructor(name, handler, timeout) {
        this.name = name;
        this.handler = handler;
        this.timeout = timeout;
        this.intervalID = 0;

        this.start();
    }

    start() {
        this.intervalID = setInterval(() => this.handler(this), this.timeout);
    }

    stop() {
        clearInterval(this.intervalID);

        this.intervalID = 0;
    }

    setTimeout(timeout) {
        this.timeout = timeout;

        if (this.intervalID) {
            this.stop();
            this.start();
        }
    }
}

module.exports = Timer;
