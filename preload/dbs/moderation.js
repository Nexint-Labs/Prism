
const Sequelize = require('sequelize');

// Moderation Database
const modv2 = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'modv2.sqlite',
});

const moderation = modv2.define('moderation', {
    guildId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['guildId', 'category'],
        },
    ],
});

// Database of joined messages.
const joinMessage = modv2.define('join', {
    channelId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    guildId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
    },
});

// Database of leave messages.
const leaveMessage = modv2.define('leave', {
    channelId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    guildId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
    },
});

// Database of modlog channels.
const modChannels = modv2.define('modchannels', {
    guildId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['guildId', 'category'],
        },
    ],
});

// Moderation case DB
const moderationCases = modv2.define("moderationCases", {
    guildId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    caseId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    targetId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    moderatorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    reason: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    liftedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    liftedBy: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    indexes: [{
        unique: true,
        fields: ["guildId", "caseId"]
    }]
});

const moderationCounters = modv2.define("moderationCounters", {
    guildId: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    lastCaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

const chatRevive = modv2.define('chatRevive', {
    guildId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
    },
    channelId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    roleId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    cooldownSeconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3600,
    },
    lastRevivedAt: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
    },
});


module.exports = {
    // Database instances
    modv2,

    // Models
    moderation,
    joinMessage,
    leaveMessage,
    modChannels,
    moderationCases,
    moderationCounters,
    chatRevive,

    async execute() {
        await moderation.sync();
        await joinMessage.sync();
        await leaveMessage.sync();
        await modChannels.sync();
        await moderationCases.sync();
        await moderationCounters.sync();
        await chatRevive.sync();
    },
};
