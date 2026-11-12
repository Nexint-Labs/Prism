
const Sequelize = require('sequelize');

// Fun Database
const fundb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'fundb.sqlite',
});

// Databases used.
const action = fundb.define('action', {
    userId: {
        type: Sequelize.STRING,
    },
    actionId: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

// The below DBs are going to be axed soon.
const hugs = fundb.define('hugs', {
    userId: {
        type: Sequelize.STRING,
    },
    huggedId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const pat = fundb.define('pat', {
    userId: {
        type: Sequelize.STRING,
    },
    pattedId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const hello = fundb.define('hello', {
    userId: {
        type: Sequelize.STRING,
    },
    helloId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const boop = fundb.define('boop', {
    userId: {
        type: Sequelize.STRING,
    },
    boopId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const poke = fundb.define('poke', {
    userId: {
        type: Sequelize.STRING,
    },
    pokeId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const punch = fundb.define('punch', {
    userId: {
        type: Sequelize.STRING,
    },
    punchId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const notify = fundb.define('notify', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const kill = fundb.define('kill', {
    userId: {
        type: Sequelize.STRING,
    },
    killId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

module.exports = {
    fundb,
    action,
    hugs,
    pat,
    hello,
    boop,
    poke,
    punch,
    notify,
    kill,

    async execute() {
        await hugs.sync();
        await pat.sync();
        await hello.sync();
        await boop.sync();
        await notify.sync();
        await poke.sync();
        await punch.sync();
        await kill.sync();
        await action.sync();

        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Fun DBs loaded!`);
    },
};
