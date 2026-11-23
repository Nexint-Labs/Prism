
const Sequelize = require('sequelize');

// Currency Database
const currency = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'databases/currency.sqlite',
});

// Databases used.
const balance = currency.define('balance', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    multiplier: {
        type: Sequelize.DOUBLE,
    },
});

const bank = currency.define('bank', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    maxValue: {
        type: Sequelize.DOUBLE,
    },
});

const miscinfo = currency.define('miscinfo', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
    name: {
        type: Sequelize.STRING,
    },
    exp: {
        type: Sequelize.DOUBLE,
    },
    level: {
        type: Sequelize.DOUBLE,
    },
    nextLevel: {
        type: Sequelize.DOUBLE,
    },
    lastRobbed: {
        type: Sequelize.STRING,
    },
    robbable: {
        type: Sequelize.BOOLEAN,
    },
});

const work = currency.define('work', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
    name: {
        type: Sequelize.STRING,
    },
    jobId: {
        type: Sequelize.INTEGER,
    },
    wage: {
        type: Sequelize.DOUBLE,
    },
    lastWorked: {
        type: Sequelize.DOUBLE,
    },
    workCount: {
        type: Sequelize.INTEGER,
    },
});

const items = currency.define('items', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
}, {
    indexes: [{
        unique: true,
        fields: ["userId", "name"]
    }]
});

// Placeholder alias lol
const itemsdb = items

const multi = currency.define('multi', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    multi: {
        type: Sequelize.DOUBLE,
    },
    expire: {
        type: Sequelize.DOUBLE,
    },
}, {
    indexes: [{
        unique: true,
        fields: ["userId", "name"]
    }]
});

module.exports = {
    currency,
    balance,
    bank,
    miscinfo,
    work,
    items,
    itemsdb,
    multi,

    async execute() {
        await work.sync();
        await balance.sync();
        await bank.sync();
        await miscinfo.sync();
        await items.sync();
        await multi.sync();
    },
    async close(){
        await currency.close();
    }
};
