let EventEmitter = require('events');
let fs = require('fs');
let Timer = require('./timer');

class DB extends EventEmitter {
    constructor(folder, initObject) {
        super();

        this.folder = folder;
        this.path = `${folder}/db.json`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        let db;

        if (fs.existsSync(this.path)) {
            try {
                db = JSON.parse(fs.readFileSync(this.path, 'utf8'));
            } catch (e) {
                throw new Error('Failed to parse the database!');
            }
        }

        if (!db) {
            db = initObject || {};
        }

        this.db = db;
        this.saver = new Timer(() => this.save(), 60000);
    }

    connect() {
        this.saver.start();
    }

    disconnect() {
        this.save();
        
        this.saver.stop();
    }

    setSaveTimeout(timeout) {
        this.saver.setTimeout(timeout);
    }

    save() {
        // First copy the DB.
        // This is intentionally done with a syncronous read-write.
        // If the database is being saved and there is an unexpected shutdown, all of the data can be lost.
        // These operations do not affect the original file.
        // Therefore, if something happens, the original file should still be intact.
        // If something happens after this operation, the backup file could be used.
        fs.writeFileSync(`${this.path}.backup`, fs.readFileSync(this.path, 'utf8'));

        fs.writeFileSync(this.path, JSON.stringify(this.db));

        this.emit('saved');
    }
}

module.exports = DB;
