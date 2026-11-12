
const { InteractionContextType, SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { queryModerationCases } = require('#functions/v2/moderation/databaseQueries/addModCase');
const { pageMenu } = require("#functions/v2/discord/menus/pagination");

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('viewwarn')
        .setDescription('View warnings for a user!')
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The user to view.'))
        .addStringOption(option =>
            option
                .setName("status")
                .setDescription("Which warnings would you like to view?")
                .setRequired(true)
                .addChoices(
                    { name: "Active Warnings", value: "active" },
                    { name: "Lifted Warnings", value: "lifted" },
                    { name: "All Warnings", value: "all" },
                    { name: "All Moderation Cases", value: "cases" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const response = await interaction.deferReply({
            withResponse: true
        });

        const targetUser = interaction.options.getUser("user", true);
        const status = interaction.options.getString("status", true);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await replyContainer(interaction, "View Warns", ["You do not have permission to view warnings."], "warn");
            return;
        }

        const updateValues = async function () {
            // Get either warnings or all moderation cases.
            const result = await queryModerationCases(
                interaction,
                targetUser.id,
                status === "cases" ? null : "warn"
            );

            if (result.error) {
                throw result.reason ?? new Error(result.desc);
            }

            // Filter warnings by status.
            const cases = result.cases.filter(item => {
                if (status === "active") return item.liftedAt === null;
                if (status === "lifted") return item.liftedAt !== null;
                return true;
            });

            // Convert cases into pagination items.
            return cases.map(item => {
                const isWarn = item.type === "warn";
                const isLifted = item.liftedAt !== null;

                const caseType = item.type.toUpperCase();
                const caseStatus = isWarn
                    ? (isLifted ? "Lifted" : "Active")
                    : "Recorded";

                const createdDate = Math.floor(
                    new Date(item.createdAt).getTime() / 1000
                );

                let content =
                    `**Case:** #${item.caseId}\n` +
                    `**Type:** ${caseType}\n` +
                    `**Status:** ${caseStatus}\n` +
                    `**Reason:** ${item.reason ?? "No reason given."}\n` +
                    `**Moderator:** <@${item.moderatorId}>\n` +
                    `**Date:** <t:${createdDate}:F>`;

                // Show lifting information when applicable.
                if (isLifted) {
                    const liftedDate = Math.floor(
                        new Date(item.liftedAt).getTime() / 1000
                    );

                    content +=
                        `\n**Lifted by:** <@${item.liftedBy}>` +
                        `\n**Lifted on:** <t:${liftedDate}:F>`;
                }

                const reason = "Reason: " + (item.reason ?? "No reason given.");

                return {
                    id: item.caseId,
                    title: `${caseType} Case #${item.caseId}`,
                    desc: `Issued by <@${item.moderatorId}>`,
                    displayValue: reason,
                    value: "carry",
                    content,
                    type: "Moderation Case"
                };
            });
        };

        const itemArray = await updateValues();

        const titles = {
            active: "Active Warnings",
            lifted: "Lifted Warnings",
            all: "All Warnings",
            cases: "All Moderation Cases"
        };

        await pageMenu(
            interaction,
            response,
            `${titles[status]} for ${targetUser.username}`,
            itemArray,
            null,
            updateValues
        );
    },
};
