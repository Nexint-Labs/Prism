const { readline } = require("#index");

module.exports = {

    async close() {
        await readline.close();
    }
}