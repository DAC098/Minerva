const crypto = require('crypto');
const util = require('util');

const CryptKeeper = function CryptKeeper() {

    const ALGORITHUM = 'aes256';
    const HASH = 'sha512';
    const ENCODING = 'utf-8';
    const BASE = 'base64';

    this.getSalt = () => {
        var buffer = crypto.randomBytes(256);
        var rtn = buffer.toString(BASE);
        return rtn;
    }

    this.getHash = (string,salt) => {
        var hash = crypto.createHmac(HASH,salt);
        hash.update(string);
        var rtn = hash.digest(BASE);
        return rtn;
    }

    this.encryptProfile = (file_data,key) => {
        try {
            var buffer = Buffer.from(JSON.stringify(file_data),ENCODING);
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
            return JSON.parse(decrypt_buffer.toString(ENCODING));
        } catch(e) {
            console.log(e);
        }
    }
}

module.exports = new CryptKeeper();
