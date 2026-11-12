const Sequelize = require('sequelize');

const sekaidb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'sekai.sqlite',
});

const vote = sekaidb.define('vote', {
    userId: Sequelize.STRING,
    name: Sequelize.STRING,
    value: Sequelize.DOUBLE,
    registerDate: Sequelize.STRING,
    lastUsed: Sequelize.STRING,
});

module.exports = {
    sekaidb,
    vote,

    async execute() {
        await vote.sync();
    }
};
