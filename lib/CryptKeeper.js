const crypto = require('crypto');
const util = require('util');

const CryptKeeper = function CryptKeeper() {

    const ALGORITHUM = 'aes256';
    const ENCODING = 'utf-8';
    const BASE = 'base64';

    this.createKey = (str_one,str_two) => {
        const key = str_one+str_two;
        const cipher = crypto.createCipher(ALGORITHUM,key);
        var crypt = cipher.update(key,ENCODING,BASE);
        crypt += cipher.final(BASE);
        return crypt;
    }

    this.encryptPassword = (str,key) => {
        const cipher = crypto.createCipher(ALGORITHUM,key);
        var crypt = cipher.update(str,ENCODING,BASE);
        crypt += cipher.final(BASE);
        return crypt;
    }

    this.encryptProfile = (file_data,key) => {
        try {
            var buffer = Buffer.from(file_data,ENCODING);
            const cipher = crypto.createCipher(ALGORITHUM,key);
            var encrypt_buffer = Buffer.concat([cipher.update(buffer),cipher.final()]);
            return encrypt_buffer;
        } catch(e) {
            console.log(e);
        }
    }

    this.decrptyProfile = (file_buffer,key) => {
        try {
            var buffer = new Buffer(file_buffer);
            const decipher = crypto.createDecipher(ALGORITHUM,key);
            var decrypt_buffer = Buffer.concat([decipher.update(buffer),decipher.final()]);
            return decrypt_buffer.toString(ENCODING);
        } catch(e) {
            console.log(e);
        }
    }
}

module.exports = new CryptKeeper();
