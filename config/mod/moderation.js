module.exports = {
    

    // Moderation stuff
    spamLog: 4, // how many messages before logging
    spamDelete: 6, // how many messages before deleting
    spamWarn: 7, // how many messages before warning (trying to DM) - set all values except for dedlay to 2147483647 to effectively disable
    spamDelay: 2, // how many seconds before resetting this amount
    muteWarnCount: 3, // how many warns before getting muted
    muteBanCount: 3, // how many bans before getting muted

    // Custom Auto-warns
    spamWarnReason: "Spamming", // custom auto-warn reason
}