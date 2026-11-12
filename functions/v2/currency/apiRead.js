// NexAPI currency client.
// All currency operations are handled by NexAPI.
// Never fall back to local SQLite.

const { postAPI } = require('#functions/v2/api/fetch');

async function request(endpoint, body) {
    const response = await postAPI(
        `/currency/${endpoint}`,
        { ...body }
    );

    if (!response || response.error !== false) {
        throw new Error(
            `NexAPI currency/${endpoint}: ${
                response?.desc ||
                response?.message ||
                'REQUEST_FAILED'
            }`
        );
    }

    return response.result;
}

function member(user) {
    if (!user?.id || !user?.username) {
        throw new Error('INVALID_USER');
    }

    return {
        userId: user.id,
        username: user.username,
    };
}

const balanceCheck = (user) => {
    return request('balanceCheck', member(user));
};

const bankCheck = (user) => {
    return request('bankCheck', member(user));
};

const convNameToID = (name) => {
    return request('convNameToID', {
        name,
    });
};

const queryMulti = (
    user,
    name,
    multiplier,
    findName,
    expire
) => {
    return request('queryMulti', {
        ...member(user),
        name,
        multiplier,
        findName,
        expire,
    });
};

const updateMulti = (user) => {
    return request('updateMulti', member(user));
};

module.exports = {
    request,
    member,
    balanceCheck,
    bankCheck,
    convNameToID,
    queryMulti,
    updateMulti,
};