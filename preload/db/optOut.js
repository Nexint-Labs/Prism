
const Sequelize = require('sequelize');

// Types of opt out
// This is a seperate database since people may want to opt out
const optOutDb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'databases/opt-out.sqlite',
});

// Opt-out Database
const optOut = optOutDb.define('optOut', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

module.exports = {
    optOut,
    optOutDb,

    async execute() {
        await optOut.sync();
    },
    async close(){
        await optOutDb.close();
    }
};
