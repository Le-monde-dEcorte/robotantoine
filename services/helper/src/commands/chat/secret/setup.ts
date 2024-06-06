import type { SlashCommandInterface } from "@sleepymaid/handler";
import type { MessagesType } from "@sleepymaid/shared";
import { setupInteraction, getChoices } from "@sleepymaid/shared";
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits } from "discord-api-types/v10";
import type { ChatInputCommandInteraction, ChatInputApplicationCommandData } from "discord.js";
import { PermissionsBitField } from "discord.js";
import type { HelperClient } from "../../../lib/extensions/HelperClient";

const messages: MessagesType = {
	setupWelcome: {
		fancyName: "Welcome",
		// eslint-disable-next-line @typescript-eslint/require-await
		function: async () => {
			const msg1 = `# QCG Secret
This server is made to help and contribute to the completion of the secret on the Québec Games servers.
## Rules
- Be respectful to everyone.
- No NSFW content.
- No spamming.
- No advertising.
- No racism, homophobia, transphobia, etc.
- No politics.
- No harassment.
- No impersonation.
- No doxxing.
## Roles
<@&1131655066462466178> » The admin role. They manage the server.
<@&1131655038473879634> » The moderator role. They moderate the server.
<@&1131659418648445010> » Given to the admins of the Québec Games servers.
<@&1247690007095939245> » Given to the moderators of the Québec Games servers.
<@&1131658226363015339> » Given to people that have done a significant contribution to any of the secret completion.
<@&1139282350929346560> » Gives access to a text and voice channel that are non-secret related.
<@&1131656791118336071> » The default role. Given to everyone.
## Useful links
Guides » <https://qcgsecret.ecorte.xyz/>
Permanent invite link » <https://discord.gg/h65PAkZgru>
Québec Games Discord » <https://discord.gg/qcgames>
			`;

			return [{ content: msg1 }];
		},
	},
};

export default class QCGSecretSetupCommand implements SlashCommandInterface {
	public readonly guildIds = ["1131653884377579651"];

	public readonly data = {
		name: "qcgssetup",
		description: "[Admin only] Allow you to post pre-made messages.",
		type: ApplicationCommandType.ChatInput,
		defaultMemberPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]),
		options: [
			{
				name: "name",
				description: "The name of the command",
				type: ApplicationCommandOptionType.String,
				choices: getChoices(messages),
				required: true,
			},
			{
				name: "message_id",
				description: "The id of the message you want to edit",
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	} as ChatInputApplicationCommandData;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	public async execute(interaction: ChatInputCommandInteraction, client: HelperClient) {
		if (!interaction.inCachedGuild()) return;
		if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return;
		await setupInteraction(interaction, client, messages);
	}
}
