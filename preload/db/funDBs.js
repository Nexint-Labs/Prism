
const Sequelize = require('sequelize');

// Fun Database
const fundb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'databases/fundb.sqlite',
});

// Unified action database
const action = fundb.define('action', {
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    actionId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    value: {
        type: Sequelize.INTEGER,
    },
}, {
    indexes: [
        {
            name: 'actions_user_target_type_unique',
            unique: true,
            fields: ['userId', 'actionId', 'type'],
        },
    ],
});
// Opt-out Database
const notify = fundb.define('notify', {
    userId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

module.exports = {
    fundb,
    action,
    notify,

    async execute() {
        await action.sync();
        await notify.sync();
    },
    async close(){
        await fundb.close();
    }
};
