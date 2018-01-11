class Timer  {
    constructor(handler, timeout) {
        this.handler = handler;
        this.timeout = timeout;
        this.interval = 0;
    }

    start() {
        this.interval = setInterval(() => this.handler(this), this.timeout);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            
            this.interval = 0;
        }
    }

    setTimeout(timeout) {
        this.timeout = timeout;

        this.stop();
        this.start();
    }
}

module.exports = Timer;
