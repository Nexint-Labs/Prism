const { EmbedBuilder } = require('discord.js');
const { embedURL, embedIconURL, footerText, defaultColor } = require('#app-config');
const { devMode, devMsg, delay, header, server } = require('#app-config');

let adverts = [];
let date = Math.floor(Date.now() / 1000);
let chance = 0.1 // TO DO: Add this to config.js


// Advertisement function
// This function only appears when connected to the Nexint API.
// Input: description
// Output: description with metadata

const advert = async function (description) {
    let desc = description;

    // Add a \n
    if (!desc.endsWith("\n")) {
        desc += `\n`
    }

    // cached advertisement data
    // this limits the API requests to MAX once every 5 minutes
    // if not connected to the nexint API, it just doesnt show ads
    if ((adverts.length == 0 || Math.floor(Date.now() / 1000) > Number(date) + delay) && (server != null && server != "")) {
        try {

            // Connect to my advertisement API
            const connect = await fetch(server + '/api/v1/advert', {
                method: 'GET',
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const event = await connect.json();
            adverts = event.content;

            // Update description if a succsesful link is established.
            if (devMode) {
                desc += `\n-# Linked to Nexint API. (${server})`
            }
        } catch {

            // Log if the Nexint API could not be hit.
            console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] Could not hit the Nexint API.`);

            if (devMode) {
                desc += `\n-# Could not link to Nexint API. (${server})`
            }
            return desc;
        }
    } else if (server == null || server == "") {

        // If the server is null, output not linked to Nexint API.
        if (devMode) {
            desc += `\n-# Not linked to Nexint API. (${server})`
        }
        return desc;
    }

    // Chance of advertisement
    // Right now, there's a 10% chance of an advert popping up across MikuBot.
    // This does not appear on dev-mode enabled servers.
    // This also does not appear on the open source version, so long as you are not linked to the Nexint API.
    // This ONLY appears, if the chance is hit, the dev mode is disabled, AND the advertisements load.
    if (Math.random() < chance && !devMode && adverts.length > 0) {
        let advertisement = adverts[[Math.floor(Math.random() * adverts.length)]];
        desc += `\n${advertisement}`
    }
    if (devMode) {
        if (desc.endsWith("\n")) {
            desc = desc.trimEnd();
        }
        desc += `\n-# ${devMsg}`
    }
    return desc
}

// Embed function
// Input: title, description, url, shortURL (url can be null)
// Output: returns embed
const embed = async function (title, description, url, shortURL) {

    let desc = await advert(description);
    const embed = new EmbedBuilder()
        .setColor(defaultColor)
        .setTitle(title)
        .setURL(url)
        .setDescription(desc)
        .setThumbnail(embedURL)
        .setImage(shortURL)
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return embed;
}

// Embed function
// Input: title, description, url, shortURL (url can be null)
// Output: returns embed
const embedPlusDesc = async function (title, description, url, shortURL, titleTwo, descTwo, titleThree, descThree, titleFour, descFour) {
    let embed;

    let desc = await advert(description);
    if (titleThree === undefined) {
        embed = new EmbedBuilder()
            .setColor(defaultColor)
            .setTitle(title)
            .setURL(url)
            .setDescription(desc)
            .setThumbnail(embedURL)
            .addFields(
                { name: titleTwo, value: descTwo, inline: true },
            )
            .setImage(shortURL)
            .setTimestamp()
            .setFooter({ text: footerText, iconURL: embedIconURL });
    } else if (titleFour === undefined) {
        embed = new EmbedBuilder()
            .setColor(defaultColor)
            .setTitle(title)
            .setURL(url)
            .setDescription(desc)
            .setThumbnail(embedURL)
            .addFields(
                { name: titleTwo, value: descTwo, inline: true },
                { name: titleThree, value: descThree, inline: true },
            )
            .setImage(shortURL)
            .setTimestamp()
            .setFooter({ text: footerText, iconURL: embedIconURL });
    } else {
        embed = new EmbedBuilder()
            .setColor(defaultColor)
            .setTitle(title)
            .setURL(url)
            .setDescription(desc)
            .setThumbnail(embedURL)
            .addFields(
                { name: titleTwo, value: descTwo, inline: true },
                { name: titleThree, value: descThree, inline: true },
                { name: titleFour, value: descFour, inline: true },
            )
            .setImage(shortURL)
            .setTimestamp()
            .setFooter({ text: footerText, iconURL: embedIconURL });
    }
    return embed;
}



module.exports = {
    embed,
    embedPlusDesc,
};