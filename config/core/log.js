const { date } = require("#functions/core/date");

module.exports = {
    logDir: "logs",
    logFormat: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
}