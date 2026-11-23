const Sequelize = require('sequelize');

// Marriage DB
const marryDB = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'databases/marry.sqlite',
});

// Proposal Schema
// This identifies a schema for someone whos being proposed.
const propose = marryDB.define('propose', {
    proposeId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    receiveId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    date: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: () => Date.now()
    },
}, {
    indexes: [
        {
            fields: ["receiveId", "date"]
        }
    ]
});

// Marriage proposal
const marriage = marryDB.define('marry', {
    date: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: () => Date.now()
    }
});

// Who's in the marriage?
const marriageMember = marryDB.define('marryMember', {
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    marriageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: marriage,
            key: "id"
        },
        onDelete: "CASCADE"
    }
});

module.exports = {
    marryDB,
    propose,
    marriage,
    marriageMember,
    async execute() {
        await marryDB.authenticate();

        if (marryDB.getDialect() === "sqlite") {
            const rows = await marryDB.query(
                "PRAGMA foreign_keys;",
                { type: Sequelize.QueryTypes.SELECT }
            );

            if (Number(rows[0]?.foreign_keys) !== 1) {
                throw new Error(
                    "SQLite foreign-key enforcement is disabled"
                );
            }
        }

        await marryDB.sync();
    },
    async close(){
        await marryDB.close();
    }
}

