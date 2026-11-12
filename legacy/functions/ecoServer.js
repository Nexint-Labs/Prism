// THIS RELIES ON THE NEXINT API
// NEXINT API IS AUTHENTICATION ONLY
const {getEcoBal, setEcoBal, changeEcoBal} = require("#functions/mc/ecoServer")

module.exports = {
    getEcoBal,
    setEcoBal,
    changeEcoBal, // ✅ EXPORTED METHOD
};