const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const events = require('events');

const manual_start = require('../../settings.json');

const logger = require('../log.js').logger('mongodEXE');

const mongodEXE = function(settings) {

    events.call(this);
    mongodEXE.prototype.__proto__ = events.prototype;

    const self = this;

    var child = undefined;

    const mongodb_path = path.join(process.cwd(),'mongodb');

    const config_path = path.join(mongodb_path,'bin','config','mongod.config');
    const local_path = path.join(mongodb_path,'local');
    const log_path = path.join(mongodb_path,'logs','mongod.log');
    const log_dir = path.join(mongodb_path,'logs');

    const config_str = `--config "${config_path}"`;

    var running = false;

    var ready = {
        config: false,
        dir: false
    };

    function dispatch(event,...args) {
        self.emit(event,...args);
    }

    this.makeConfig = () => {

        const config = `systemLog:
    verbosity: 3
    quiet: false
    destination: file
    path: "${log_path.replace(/\\/g,'/')}"
    logRotate: rename
    timeStampFormat: iso8601-local
storage:
    dbPath: "${local_path.replace(/\\/g,'/')}"
net:
    bindIp: ${settings.local.ip}
    port: ${settings.local.port}
    maxIncomingConnections: 5`

        //logger(`config:\n${config}`);

        try {
            fs.writeFileSync(config_path,config);
            logger('config file ready');
            ready.config = true;
        } catch(err) {
            logger('error when writing mongod config, error:',err.message);
            ready.config = false;
        }
    }

    this.init = () => {
        logger('checking mongod directories');
        var error_caught = undefined;
        try {
            var status = fs.statSync(local_path);
        } catch(err) {
            if(err.code === 'ENOENT') {
                fs.mkdirSync(local_path);
            } else {
                logger('error when checking local directory, error:',err.message);
                error_caught = err;
            }
        }

        try {
            var status = fs.statSync(log_dir);
        } catch(err) {
            if(err.code === 'ENOENT') {
                fs.mkdirSync(log_dir);
            } else {
                logger('error when checking log directory, error:',err.message);
                error_caught = err;
            }
        }

        if(error_caught) {
            logger('an error was caught when checking directories');
            ready.dir = false;
        } else {
            logger('init complete');
            ready.dir = true;
        }
    }

    this.isRunning = () => {
        return running;
    }

    this.start = () => {
        logger('starting mongod');
        if(ready.config && ready.dir) {
            child = exec(`${path.join(mongodb_path,'bin','mongod.exe')} ${config_str}`,(error,stdout,stderr) => {
                if(error) {
                    logger('error:',error);
                    logger('stderr:',stderr);
                    dispatch('error',error);
                } else {
                    logger('stdout:',stdout);
                }
                running = false;
                dispatch('mongod exiting');
            });

            child.on('message',(message) => {
                logger(`mongod message: ${message}`);
                dispatch('message',message);
            });

            child.on('error',(error) => {
                logger(`error: ${error.message}`);
                dispatch('error',error);
            });

            child.on('exit',(code,signal) => {
                logger(`mongod exiting\n    code: ${code}\n    signal: ${signal}`);
                running = false;
                dispatch('exiting',{code,signal});
            });

            child.on('close',(code,signal) => {
                logger(`mongod closing\n    code: ${code}\n    signal: ${signal}`);
                running = false;
                dispatch('closing',{code,signal});
            });

            running = true;
            logger('mongod has started, pid:',child.pid);
            dispatch('ready');
        } else {
            var is_config = (!ready.config) ? 'config file is not ready' : 'config is ready';
            var is_dir = (!ready.dir) ? 'directories are not ready' : 'directories are ready';
            logger(`${is_config}, ${is_dir}`);
        }
    }

    this.stop = () => {
        child.kill();
        let kill = spawn('TASKKILL',['/IM','mongod.exe','/F']);
        logger('ending mongod process, pid:',child.pid);
        kill.on('message',(message) => {
            logger('kill message:',message);
        });

        kill.on('error',(code,signal) => {
            logger('kill error\n    code:',code,'\n    signal:',signal);
            dispatch('error',{code,signal});
        });

        kill.on('close',(message) => {
            logger('kill closing');
            dispatch('killed');
        });
    }
}

module.exports = mongodEXE;

//logger('cmd arguments')
process.argv.forEach((val,index) => {
    //logger(`[${index}]${val}`);
    if(val === 'run_db') {
        var exe = new mongodEXE(manual_start);
        exe.makeConfig();
        exe.init();
        exe.start();
    }
});
