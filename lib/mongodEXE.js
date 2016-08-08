const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const events = require('events');

const logging = require('./log.js');

const settings = require('../settings.json');

const logger = logging.logger('mongod.exe');

const mongodEXE = function() {

    events.call(this);
    mongodEXE.prototype.__proto__ = events.prototype;

    const self = this;

    var child = undefined;

    const mongodb_path = path.join(process.cwd(),'mongodb');

    const config_path = path.join(mongodb_path,'bin','config','mongod.config');
    const local_path = path.join(mongodb_path,'local');
    const log_path = path.join(mongodb_path,'logs','mongod.log');

    const config_str = `--config "${path.join(mongodb_path,'bin','config','mongod.config')}"`;

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

        logger(`config:\n${config}`);

        fs.writeFile(config_path,config,(err) => {
            if(err) {
                logger('error when writing mongod config, error:',err.message);
                dispatch('config','error');
            } else {
                logger('config file ready');
                ready.config = true;
                dispatch('config','ready');
            }
        });
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
            var status = fs.statSync(log_path);
        } catch(err) {
            if(err.code === 'ENOENT') {
                fs.mkdirSync(log_path);
            } else {
                logger('error when checking log directory, error:',err.message);
                error_caught = err;
            }
        }

        if(error_caught) {
            logger('an error was caught when checking directories');
            dispatch('itit','error');
        } else {
            logger('init complete');
            ready.dir = true;
            dispatch('init','ready');
        }
    }

    this.start = () => {
        logger('starting mongod');
        if(ready.config && ready.dir) {
            child = exec(`${path.join(mongodb_path,'bin','mongod.exe')} ${config_str}`,(error,stdout,stderr) => {
                if(error) {
                    logger('error:',error);
                    dispatch('process','error',error);
                }
                logger('running mongod');
                logger(stdout);
                logger(stderr);
                running = true;
                dispatch('process','ready');
            });
            child.on('message',(message) => {
                logger(`message: ${message}`);
                dispatch('process','message',message);
            });

            child.on('error',(error) => {
                logger(`error: ${error.message}`);
                dispatch('process','error',error);
            });

            child.on('exit',(code,signal) => {
                logger(`mongod exiting\n    code: ${code}\n    signal: ${signal}`);
                running = false;
                dispatch('process','exiting',{code,signal});
            });

            child.on('close',(code,signal) => {
                logger(`mongod closing\n    code: ${code}\n    signal: ${signal}`);
                running = false;
                dispatch('process','closing',{code,signal});
            });
        } else {
            var is_config = (!ready.config) ? 'config file is not ready' : 'config is ready';
            var is_dir = (!ready.dir) ? 'directories are not ready' : 'directories are ready';
            logger(`${is_config}, ${is_dir}`);
        }
    }

    this.stop = () => {
        logger('ending mongod process');
        child.kill();
    }
}

module.exports = new mongodEXE();

//logger('cmd arguments')
process.argv.forEach((val,index) => {
    //logger(`[${index}]${val}`);
    if(val === 'run_db') {
        var exe = new mongodEXE();
        var config_ready = false;
        var dir_ready = false;
        exe.on('config',(type,data) => {
            if(type === 'ready') {
                config_ready = true;
                if(config_ready && dir_ready) {
                    exe.start();
                }
            }
            if(type === 'error') {
                //logger('error:',data.message);
            }
        });
        exe.on('init',(type,data) => {
            if(type === 'ready') {
                dir_ready = true;
                if(config_ready && dir_ready) {
                    exe.start();
                }
            } else {
                //logger('error:',err.message);
            }
        });
        exe.on('process',(type,data) => {
            //logger(`type: ${type}, data:`,data);
        });
        exe.init();
        exe.makeConfig();
    }
});
