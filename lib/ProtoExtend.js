//function runExtend() {

if(!Array.prototype.insert) {

    Array.prototype.insert = function insert(value,position) {
        //console.log('starting insert');
        position = (position) ? position : 0;
        var len = this.length;
        if(typeof position === "function") {
            //console.log('running findIndex');
            var num = this.findIndex(position);
            position = (num >= 0) ? num : len;
        }
        if(num >= len + 1) {
            return false;
        }
/*
        console.log(`running insert
    position: ${position}
    len: ${len}
    len / 2: ${Math.round(len / 2)}
    forward?: ${position < (len / 2)}\n`);
*/
        if(position < (Math.round(len / 2))) {
            for(var c = 0; c < len; ++c) {
                //console.log(`----c: ${c}`);
                if(c === 0) {
                    //console.log("----shifting array");
                    this.unshift(value);
                }
                if(c === position) {
                    //console.log("----position reached");
                    return true;
                }
                var temp = this[c];
                this[c] = this[c + 1];
                this[c + 1] = temp;
            }
        } else {
            for(var c = len; c >= 0; --c) {
                //console.log(`----c: ${c}`);
                if(c === len) {
                    //console.log("----pushing array");
                    this.push(value);
                }
                //console.log(`----array current:`,this);
                if(c === position) {
                    return true;
                }
                var temp = this[c];
                this[c] = this[c - 1];
                this[c - 1] = temp;
            }
        }
    }

}

if(!Array.prototype.remove) {
    Array.prototype.remove = function remove(position) {
        position = (position) ? position : 0;
        var len = this.length;
        if(typeof position === 'function') {
            var num = this.findIndex(position);
            if(!(num >= 0)) {
                return false;
            }
            position = num;
        }
        if(position >= len) {
            return false;
        }
        /*
        console.log(`running insertValue
    position: ${position}
    len / 2: ${Math.round(len / 2)}
    forward?: ${position < (len / 2)}\n`);
        */
        if(position < (Math.round(len / 2))) {
            for(var c = position; c >= 0; --c) {
                //console.log(`----c: ${c}`);
                //console.log(`----array: ${array}`);
                if(c === 0) {
                    //console.log("----poping array");
                    this.shift()
                    return true;
                }
                var temp = this[c];
                this[c] = this[c - 1];
                this[c - 1] = temp;
            }
        } else {
            for(var c = position; c < len; ++c) {
                //console.log(`----c: ${c}`);
                //console.log(`----array: ${array}`);
                if(c === len - 1) {
                    //console.log("----shifting array");
                    this.pop();
                    return true;
                }
                var temp = this[c];
                this[c] = this[c + 1];
                this[c + 1] = temp;
            }
        }
        return false;
    }
}
/*
var t_array = [1,2,3];
console.log("testing insert");
console.log("t_array:",t_array);
t_array.insert(5,1);
console.log("t_array:",t_array);
t_array.insert(12,2);
console.log("t_array:",t_array);
t_array.insert(25,2);
console.log("t_array:",t_array);
t_array.insert(2,4);
console.log("t_array:",t_array);
t_array.insert(35,0);
console.log("t_array:",t_array);
t_array.insert(99,t_array.length);
console.log("t_array:",t_array);

console.log("\ntesting remove");
console.log("t_array:",t_array);
t_array.remove(3);
console.log("t_array:",t_array);
t_array.remove(4);
console.log("t_array:",t_array);
t_array.remove(4);
console.log("t_array:",t_array);
*/
const insertValue = (array,value,position) => {
    position = (position) ? position : 0;
    var len = array.length;
    //console.log("running insertValue");
    //console.log(`--position: ${position}`);
    //console.log(`--len / 2: ${Math.round(len / 2)}`);
    //console.log(`--forward?: ${position < (len / 2)}`);
    if(position < (Math.round(len / 2))) {
        for(var c = 0; c < len; ++c) {
            //console.log(`----c: ${c}`);
            if(c === 0) {
                //console.log("----shifting array");
                array.unshift(value);
            }
            if(c === position) {
                //console.log("----position reached");
                return array;
            }
            var temp = array[c];
            array[c] = array[c + 1];
            array[c + 1] = temp;
        }
    } else {
        for(var c = len; c >= 0; --c) {
            //console.log(`----c: ${c}`);
            if(c === len) {
                //console.log("----pushing array");
                array.push(value);
            }
            //console.log(`----array current: ${array}`);
            if(c === position) {
                return array;
            }
            var temp = array[c];
            array[c] = array[c - 1];
            array[c - 1] = temp;
        }
    }
}

const removeValue = (array,position) => {
    position = (position) ? position : 0;
    var len = array.length;
    //console.log("running removeValue");
    //console.log(`--position: ${position}`);
    //console.log(`--len / 2: ${Math.round(len / 2)}`);
    //console.log(`--forward?: ${position < (len / 2)}`);
    if(position < (Math.round(len / 2))) {
        for(var c = position; c >= 0; --c) {
            //console.log(`----c: ${c}`);
            //console.log(`----array: ${array}`);
            if(c === 0) {
                //console.log("----poping array");
                array.shift()
                return array
            }
            var temp = array[c];
            array[c] = array[c - 1];
            array[c - 1] = temp;
        }
    } else {
        for(var c = position; c < len; ++c) {
            //console.log(`----c: ${c}`);
            //console.log(`----array: ${array}`);
            if(c === len - 1) {
                //console.log("----shifting array");
                array.pop();
                return array;
            }
            var temp = array[c];
            array[c] = array[c + 1];
            array[c + 1] = temp;
        }
    }
}

//module.exports = run;
