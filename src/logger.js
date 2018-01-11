let fs = require('fs');

class Logger  {
    constructor(folder) {
        this.folder = folder;
        this.file = `${this.getTimeStamp()}.txt`;
        this.path = `${folder}/${this.file}`;
        this.logToConsole = true;
        this.logToFile = true;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    }

    log(message) {
        let data = `[${this.getTimeStamp()}] ${message}`;
		
		if (this.logToFile) {
			fs.appendFileSync(this.path, `${data}\r\n`);
		}
		
		if (this.logToConsole) {
			console.log(data);
		}
    }

    getTimeStamp() {
        let d = new Date();
        
        return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()} ${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.${d.getMilliseconds()}`;
    }
}

module.exports = Logger;
