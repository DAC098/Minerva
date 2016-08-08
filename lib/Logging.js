const fs = require('fs');
const path = require('path');
const util = require('util');

const Logging = function Logging(directory,options = {}) {

    const self = this;

    const to_console = options.to_console;

    const to_file = options.to_file;

    const start = process.hrtime();

    var file_name = '';

    try {
        var status = fs.statSync(directory);
    } catch(err) {
        if(err.code === 'ENOENT') {
            fs.mkdir(directory,(err) => {
                if(err) {
                    console.log('error when making directory for logs, error',err.message);
                }
            });
        }
    }

    function setFileName() {
        file_name = path.join(directory,`minerva_log_${self.today()}.log`);
    }

    function pad(num,places = 1) {
        var calc_array = [10,100,1000];
        var rtn = `${num}`;
        var count = 1
        for(const number of calc_array) {
            if(num < number) {
                rtn = `0${rtn}`;
            }
            if(count === places) {
                return rtn;
            }
            ++count;
        }
    }

    this.currentTime = () => {
        var date = new Date();
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(),2)}-${date.getTimezoneOffset()}`
    }

    this.today = () => {
        var date = new Date();
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    this.now = () => {
        var now = process.hrtime(start)
        var ms = Math.floor(now[1] / 1000000);
        var sec = now[0] % 60;
        var min = Math.floor(now[0] / 60 % 60);
        var hr = Math.floor(now[0] / 60 / 60 % 60);
        return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms,2)}`;
    }

    this.toConsole = () => {
        return to_console;
    }

    this.toFile = () => {
        return to_file;
    }

    this.logToFile = (array) => {
        var data = '';
        for(const value of array) {
            var type = typeof value;
            if(type === 'string' || type === 'number' || type === 'boolean') {
                data += `${value} `;
            }
            if(value instanceof Array || value instanceof Object) {
                data += `${util.inspect(value)} `;
            }
        }
        fs.appendFile(file_name,`${data}\n`,(err) => {
            if(err) {
                console.log('error when writing log file, error',err.message);
            }
        });
    }

    this.logger = function(prefix) {
        return function logger(...args) {
            var parent = self;
            var name = prefix;
            if(parent.toConsole()) {
                console.log.apply(null,[`[${parent.now()}-${name}]:`,...args]);
            }
            if(parent.toFile()) {
                parent.logToFile([`[${parent.today()}T${parent.currentTime()}-${name}]:`,...args]);
            }
        }
    }

    setFileName();
}

module.exports = Logging;
