const {blacklistServer} = require("#preload/dbs/databases");

const blacklistServerCheck = async function (id) {
    const blacklisted = await blacklistServer.findOne({
        where: {
            serverId: id
        }
    });
    if (blacklisted === null) {
        return false;
    }
    return true;
}

const blacklistServerAdd = async function (id) {
    let [blacklisted, created] = await blacklistServer.findOrCreate({
        where: {
            serverId: id
        }
    })
    return created
}

const blacklistServerRemove = async function (id) {
    const rowCount = await blacklistServer.destroy({ where: { serverId: id } })
    if (!rowCount) {
        return false;
    }
    return true;
}

module.exports = {
    blacklistServerCheck,
    blacklistServerAdd,
    blacklistServerRemove
};