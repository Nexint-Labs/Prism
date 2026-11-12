const { getAPI } = require('#functions/v2/api/fetch');
const { delay, advertChance } = require('#config/api/NexAPI');

let adverts = null;
let date = Math.floor(Date.now() / 1000);

/**
 * Advertisement API (v2)
 * Advertise soemthing.
 * @param {String} description 
 * @returns {Promise<string | null>}
 */
const getAdvert = async function (description) {
    let advertisement = "";

    // cached advertisement data
    // this limits the API requests to MAX once every 5 minutes
    // if not connected to the nexint API, it just doesnt show ads
    if ((adverts === null || Math.floor(Date.now() / 1000) > Number(date) + delay)) {

        // Connect to my advertisement API
        const connect = await getAPI("/advert");
        if (connect.error) {

            // Null if error.
            return null;

        }
        adverts = connect.content;
        date = Math.floor(Date.now() / 1000);
    }

    // Chance of advertisement
    // Right now, there's a 10% chance of an advert popping up across MikuBot.
    // Appears on the OSS ver btw
    // This ONLY appears, if the chance is hit, the dev mode is disabled, AND the advertisements load.
    if (adverts !== null && Math.random() < advertChance) {
        advertisement = adverts[Math.floor(Math.random() * adverts.length)];
    }
    return advertisement
}

module.exports = {
    getAdvert
}