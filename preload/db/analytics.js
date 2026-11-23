const Sequelize = require('sequelize');

// Analytics module
// This tracks analytics across NexAPI lol
const analytics = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: null,
	// SQLite only
	storage: 'databases/analytics.sqlite',
});

// blacklist lol
const blacklist = analytics.define('blacklist', {
	user: {
		type: Sequelize.STRING,
	},
	userid: {
		type: Sequelize.STRING,
		unique: true,
	},
	timeStamp: {
		type: Sequelize.STRING,
	},
});

// blacklist lol
const advert = analytics.define('advert', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
});

// Databases used.
const usage = analytics.define('commands', {
    type: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
});

const userinfo = analytics.define('userinfo', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    registerDate: {
        type: Sequelize.STRING,
    },
    lastUsed: {
        type: Sequelize.STRING,
    },
});

const cmdDate = analytics.define('cmddate', {
    type: {
        type: Sequelize.STRING,
    },
    date: {
        type: Sequelize.STRING,
    },
});

module.exports = {
    blacklist,
	advert,
	usage,
	userinfo,
	cmdDate,
    analytics,
    async execute(){
        blacklist.sync();
		advert.sync();
		userinfo.sync();
		usage.sync();
		cmdDate.sync();
    },
    async close(){
        await analytics.close();
    }
}