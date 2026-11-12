class NexAPIError extends Error {
    constructor(api, options = {}) {
        super(`Could not connect to Nex API: ${api}`, options);
        this.name = "NexAPIError";
    }
}

module.exports = {
    NexAPIError
};