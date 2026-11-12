
const Sequelize = require('sequelize');

// Main Database
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

// Moderation Database
const moderation = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'moderation.sqlite',
});

// Databases used.
const logging = moderation.define('logging', {
    startChannel: {
        type: Sequelize.STRING,
    },
    endChannel: {
        type: Sequelize.STRING,
    },
});

const blacklist = moderation.define('blacklist', {
    user: {
        type: Sequelize.STRING,
    },
    channel: {
        type: Sequelize.STRING,
    },
});

const optOut = sequelize.define('optout', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const blacklistServer = sequelize.define('blacklistServer', {
    serverId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

module.exports = {
    sequelize,
    moderation,
    logging,
    blacklist,
    optOut,
    blacklistServer,

    async execute() {
        await blacklistServer.sync();
        await logging.sync();
        await blacklist.sync();
        await optOut.sync();
    },
};
