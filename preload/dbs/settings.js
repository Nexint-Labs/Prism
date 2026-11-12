const Sequelize = require('sequelize');

// NotifyDB
const settingDB = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'settings.sqlite',
});

// Dev Notify Schema
// This schema defines settings.
const settings = settingDB.define('settings', {
    type: {
        type: Sequelize.STRING, // Setting Type (for categorization)
    },
    content: {
        type: Sequelize.STRING, // Default Settings
    },
    title: {
        type: Sequelize.STRING, // Default Title
    },
    date: {
        type: Sequelize.DOUBLE, // when the notif was read
    },
});

// User Notify Schema
// This schema defines user manual setting overrides.
const userSettings = settingDB.define('userNotify', {
    userId: {
        type: Sequelize.STRING, // User ID (use this to find the ID)
    },
    title: {
        type: Sequelize.STRING, // Title of setting override
    },
    date: {
        type: Sequelize.DOUBLE, // when the user read the notif
    },
});

module.exports = {
    settings,
    userSettings,
    settingDB,
    async execute() { // Re-sync API
        await settings.sync({force: true});
        await userSettings.sync({force: true});
    }
}

