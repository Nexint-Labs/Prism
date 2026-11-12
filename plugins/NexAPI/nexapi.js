const { SlashCommandBuilder } = require('discord.js');

const { execute: blacklist } = require('#functions/v2/nexapi/handlers/blacklist');
const { execute: blacklist_id } = require('#functions/v2/nexapi/handlers/blacklist-id');
const { execute: whitelist } = require('#functions/v2/nexapi/handlers/whitelist');
const { execute: whitelist_id } = require('#functions/v2/nexapi/handlers/whitelist-id');
const { execute: viewlist } = require('#functions/v2/nexapi/handlers/viewlist');
const { execute: notify } = require('#functions/v2/nexapi/handlers/notify');
const { execute: notifications } = require('#functions/v2/nexapi/handlers/notifications');
const { execute: invite } = require('#functions/v2/nexapi/handlers/invite');
const { execute: server_blacklist } = require('#functions/v2/nexapi/handlers/server-blacklist');
const { execute: server_whitelist } = require('#functions/v2/nexapi/handlers/server-whitelist');
const { execute: add_notification } = require('#functions/v2/nexapi/handlers/add-notification');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('nexapi')
        .setDescription('NexAPI administration and notifications.')
        .addSubcommand(subcommand =>
            subcommand.setName('blacklist').setDescription('Blacklist a user from Nexint services.')
                .addUserOption(option => option.setName('user').setDescription('The user.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('blacklist-id').setDescription('Blacklist a user by ID.')
                .addStringOption(option => option.setName('user').setDescription('The user ID.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('whitelist').setDescription('Whitelist a user from Nexint services.')
                .addUserOption(option => option.setName('user').setDescription('The user.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('whitelist-id').setDescription('Whitelist a user by ID.')
                .addStringOption(option => option.setName('user').setDescription('The user ID.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('viewlist').setDescription('View the Nexint blacklist.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('notify').setDescription('Send a developer DM notification.')
                .addUserOption(option => option.setName('user').setDescription('The recipient.').setRequired(true))
                .addStringOption(option => option.setName('msg').setDescription('Message.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('notifications').setDescription('View your notifications.')
                .addStringOption(option => option.setName('notifs').setDescription('Which notifications?').setRequired(true)
                    .addChoices({ name: 'Unread Notifications', value: 'unread' }, { name: 'All Notifications', value: 'all' }))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('invite').setDescription('Get an invite from a server.')
                .addStringOption(option => option.setName('id').setDescription('The server ID.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('server-blacklist').setDescription('Blacklist a server.')
                .addStringOption(option => option.setName('id').setDescription('The server ID.').setRequired(true))
                .addStringOption(option => option.setName('msg').setDescription('Reason.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('server-whitelist').setDescription('Remove a server blacklist.')
                .addStringOption(option => option.setName('id').setDescription('The server ID.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add-notification').setDescription('Add a NexAPI notification.')
                .addStringOption(option => option.setName('title').setDescription('Notification title.').setRequired(true))
                .addStringOption(option => option.setName('content').setDescription('Notification content.').setRequired(true))
                .addStringOption(option => option.setName('type').setDescription('Notification type.').setRequired(true))
        )
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'blacklist': return blacklist(interaction);
            case 'blacklist-id': return blacklist_id(interaction);
            case 'whitelist': return whitelist(interaction);
            case 'whitelist-id': return whitelist_id(interaction);
            case 'viewlist': return viewlist(interaction);
            case 'notify': return notify(interaction);
            case 'notifications': return notifications(interaction);
            case 'invite': return invite(interaction);
            case 'server-blacklist': return server_blacklist(interaction);
            case 'server-whitelist': return server_whitelist(interaction);
            case 'add-notification': return add_notification(interaction);
        }
    }
};
