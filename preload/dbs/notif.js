const Sequelize = require('sequelize');

// NotifyDB
const notifyDB = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'notify.sqlite',
});

// Dev Notify Schema
// This schema defines notifications from the developer.
const devNotify = notifyDB.define('devNotify', {
    type: {
        type: Sequelize.STRING, // type of the notification?
    },
    content: {
        type: Sequelize.STRING, // description of the notif
    },
    title: {
        type: Sequelize.STRING, // the title
    },
    date: {
        type: Sequelize.DOUBLE, // when the notif was read
    },
});

// User Notify Schema
// This schema defines what happens when a user gets notified.
const userNotify = notifyDB.define('userNotify', {
    userId: {
        type: Sequelize.STRING, // User ID ()
    },
    date: {
        type: Sequelize.DOUBLE, // when the user read the notif
    },
});

// Bot Notify Schema
// This schema defines how the bots 
const botNotify = notifyDB.define('botNotify', {
    userId: {
        type: Sequelize.STRING, // User ID ()
    },
    date: {
        type: Sequelize.DOUBLE, // when the bot sent the notif
    },
    type: {
        type: Sequelize.STRING, // type of the notification?
    },
    content: {
        type: Sequelize.STRING, // description of the notif
    },
    title: {
        type: Sequelize.STRING, // the title
    },
});

module.exports = {
    devNotify,
    userNotify,
    botNotify,
    notifyDB,
    async execute() { // Re-sync API
        await devNotify.sync();
        await userNotify.sync({force: true});
        await botNotify.sync();
    }
}

