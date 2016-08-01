
const ManagerError = function ManagerError() {

    function makeErrorObj(name,message,extra) {

        return {
            name: name,
            message: message,
            extra: extra,
        }

    }

    this.gen = (message,extra) => {

        return makeErrorObj('unknown',message,extra);

    }

    this.load = (message,extra) => {

        return makeErrorObj('load-failed',message,extra);

    }

    this.save = (message,extra) => {

        return makeErrorObj('save-failed',message,extra);

    }

    this.insert = (message,extra) => {

        return makeErrorObj('insert-faield',message,extra);

    }

    this.update = (message,extra) => {

        return makeErrorObj('update-failed',message,extra);

    }

    this.remove = (message,extra) => {

        return makeErrorObj('remove-failed',message,extra);

    }

    this.find = (message,extra) => {

        return makeErrorObj('not-found',message,extra);

    }

    this.deny = (message,extra) => {

        return makeErrorObj('deny',message,extra);

    }

}

module.exports = new ManagerError();
