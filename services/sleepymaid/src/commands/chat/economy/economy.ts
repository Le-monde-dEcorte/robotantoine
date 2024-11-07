import { Context, SlashCommand } from "@sleepymaid/handler";
import { SleepyMaidClient } from "../../../lib/extensions/SleepyMaidClient";
import {
	ActionRowBuilder,
	ApplicationCommandType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	InteractionContextType,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	MessageComponentInteraction,
} from "discord.js";
import { APIEmbed, ApplicationCommandOptionType } from "discord-api-types/v10";
import { userData } from "@sleepymaid/db";
import { desc, eq } from "drizzle-orm";
import DBCheckPrecondtion from "../../../preconditions/dbCheck";
import { decrement, increment } from "@sleepymaid/shared";

const rewards = {
	daily: 1000,
	weekly: 5000,
	monthly: 10000,
	work: 100,
};

const baseEmbed: APIEmbed = {
	color: Colors.Blurple,
	title: "Sleepy Maid Economy",
};

const getBaseEmbed = (interaction: ChatInputCommandInteraction) => {
	return {
		...baseEmbed,
		author: {
			name: interaction.user.username,
			icon_url: interaction.user.avatarURL() ?? interaction.client.user.avatarURL() ?? undefined,
		},
		timestamp: new Date().toISOString(),
	} satisfies APIEmbed;
};

export default class EconomyCommand extends SlashCommand<SleepyMaidClient> {
	public constructor(context: Context<SleepyMaidClient>) {
		super(context, {
			preconditions: [DBCheckPrecondtion],
			data: {
				name: "economy",
				description: "Base commande for economy",
				type: ApplicationCommandType.ChatInput,
				integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
				contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
				options: [
					{
						name: "balance",
						description: "Get your balance",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "The user to get the balance of",
								type: ApplicationCommandOptionType.User,
								required: false,
							},
						],
					},
					{
						name: "leaderboard",
						description: "Get the leaderboard",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "page",
								description: "The page to get",
								type: ApplicationCommandOptionType.Integer,
								required: false,
								min_value: 1,
							},
						],
					},
					{
						name: "daily",
						description: "Get your daily reward",
						type: ApplicationCommandOptionType.Subcommand,
					},
					{
						name: "weekly",
						description: "Get your weekly reward",
						type: ApplicationCommandOptionType.Subcommand,
					},
					{
						name: "monthly",
						description: "Get your monthly reward",
						type: ApplicationCommandOptionType.Subcommand,
					},
					{
						name: "work",
						description: "Work for money",
						type: ApplicationCommandOptionType.Subcommand,
					},
					{
						name: "give",
						description: "Give money to someone",
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: "user",
								description: "The user to give money to",
								type: ApplicationCommandOptionType.User,
								required: true,
							},
							{
								name: "amount",
								description: "The amount of money to give",
								type: ApplicationCommandOptionType.Integer,
								required: true,
							},
						],
					},
				],
			},
		});
	}

	public override async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "balance":
				await this.balance(interaction);
				break;
			case "leaderboard":
				await this.leaderboard(interaction);
				break;
			case "daily":
				await this.daily(interaction);
				break;
			case "weekly":
				await this.weekly(interaction);
				break;
			case "monthly":
				await this.monthly(interaction);
				break;
			case "work":
				await this.work(interaction);
				break;
			case "give":
				await this.give(interaction);
				break;
			default:
				await interaction.reply({ content: "Invalid subcommand", ephemeral: true });
				break;
		}
	}

	private async balance(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user") ?? interaction.user;
		const balance = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, user.id),
		});
		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `${user} has ${balance?.currency ?? 0} coins`,
				},
			],
		});
	}

	private async leaderboard(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const medals = {
			0: "🥇",
			1: "🥈",
			2: "🥉",
			3: "4️⃣",
			4: "5️⃣",
			5: "6️⃣",
			6: "7️⃣",
			7: "8️⃣",
			8: "9️⃣",
			9: "🔟",
		};
		const page = interaction.options.getInteger("page") ?? 1;

		const getEmbed = async (page: number): Promise<InteractionReplyOptions & InteractionUpdateOptions> => {
			const leaderboard = await this.container.client.drizzle.query.userData.findMany({
				orderBy: desc(userData.currency),
				limit: 10,
				offset: (page - 1) * 10,
			});
			return {
				embeds: [
					{
						...getBaseEmbed(interaction),
						description: `### Leaderboard:\n${leaderboard
							.map((user, index) => {
								index = index + (page - 1) * 10;
								if (page !== 1 && index > 9) return `${index + 1}.`;
								const prefix = medals[index as keyof typeof medals] ?? `${index + 1}.`;
								return `${prefix} **${user.userName}**: ${user.currency}`;
							})
							.join("\n")}`,
						footer: {
							text: `Page ${page}`,
						},
					},
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder({
							customId: `economy_leaderboard_${page - 1}`,
							label: "Previous",
							style: ButtonStyle.Secondary,
						}),
						new ButtonBuilder({
							customId: "none",
							label: `${page}`,
							style: ButtonStyle.Primary,
							disabled: true,
						}),
						new ButtonBuilder({
							customId: `economy_leaderboard_${page + 1}`,
							label: "Next",
							style: ButtonStyle.Secondary,
						}),
					),
				],
			};
		};
		const message = await interaction.editReply(await getEmbed(page));
		message
			.createMessageComponentCollector({
				time: 1000 * 60 * 5,
				filter: (i: MessageComponentInteraction) => {
					return i.customId.startsWith("economy_leaderboard_") && i.user.id === interaction.user.id;
				},
			})
			.on("collect", async (i: MessageComponentInteraction) => {
				const page = parseInt(i.customId.split("_")[2] ?? "1");
				await i.update(await getEmbed(page));
			});
	}

	private async daily(interaction: ChatInputCommandInteraction) {
		const data = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, interaction.user.id),
		});
		if (!data) {
			await interaction.reply("An error occurred while fetching your data, please try again later.");
			return;
		}
		if (data.dailyTimestamp && Date.now() - data.dailyTimestamp.getTime() < 24 * 60 * 60 * 1000) {
			const timeLeft = new Date(data.dailyTimestamp.getTime() + 24 * 60 * 60 * 1000 - Date.now());
			await interaction.reply(
				`You have already claimed your daily reward. Come back in ${timeLeft.getUTCHours()}h ${timeLeft.getUTCMinutes()}m.`,
			);
			return;
		}
		const reward = rewards.daily + (data.dailyStreak ?? 0) * 10;
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: increment(userData.currency, reward),
				dailyTimestamp: new Date(),
				dailyStreak: increment(userData.dailyStreak, 1),
			})
			.where(eq(userData.userId, interaction.user.id));

		this.container.client.logger.info(
			`${interaction.user.username} (${interaction.user.id}) claimed their daily reward of ${reward} coins!`,
		);

		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `You claimed your daily reward of ${reward} coins! Your current streak is ${(data.dailyStreak ?? 0) + 1} days.`,
				},
			],
		});
	}

	private async weekly(interaction: ChatInputCommandInteraction) {
		const data = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, interaction.user.id),
		});
		if (!data) {
			await interaction.reply("An error occurred while fetching your data, please try again later.");
			return;
		}
		if (data.weeklyTimestamp && Date.now() - data.weeklyTimestamp.getTime() < 7 * 24 * 60 * 60 * 1000) {
			const timeLeft = new Date(data.weeklyTimestamp.getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now());
			await interaction.reply(
				`You have already claimed your weekly reward. Come back in ${timeLeft.getUTCDate() - 1}d ${timeLeft.getUTCHours()}h ${timeLeft.getUTCMinutes()}m.`,
			);
			return;
		}
		const reward = rewards.weekly + (data.weeklyStreak ?? 0) * 10;
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: increment(userData.currency, reward),
				weeklyTimestamp: new Date(),
				weeklyStreak: increment(userData.weeklyStreak, 1),
			})
			.where(eq(userData.userId, interaction.user.id));

		this.container.client.logger.info(
			`${interaction.user.username} (${interaction.user.id}) claimed their weekly reward of ${reward} coins!`,
		);

		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `You claimed your weekly reward of ${reward} coins! Your current streak is ${(data.weeklyStreak ?? 0) + 1} weeks.`,
				},
			],
		});
	}

	private async monthly(interaction: ChatInputCommandInteraction) {
		const data = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, interaction.user.id),
		});
		if (!data) {
			await interaction.reply("An error occurred while fetching your data, please try again later.");
			return;
		}
		if (data.monthlyTimestamp && Date.now() - data.monthlyTimestamp.getTime() < 30 * 24 * 60 * 60 * 1000) {
			const timeLeft = new Date(data.monthlyTimestamp.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now());
			await interaction.reply(
				`You have already claimed your monthly reward. Come back in ${timeLeft.getUTCDate() - 1}d ${timeLeft.getUTCHours()}h ${timeLeft.getUTCMinutes()}m.`,
			);
			return;
		}
		const reward = rewards.monthly + (data.monthlyStreak ?? 0) * 10;
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: increment(userData.currency, reward),
				monthlyTimestamp: new Date(),
				monthlyStreak: increment(userData.monthlyStreak, 1),
			})
			.where(eq(userData.userId, interaction.user.id));

		this.container.client.logger.info(
			`${interaction.user.username} (${interaction.user.id}) claimed their monthly reward of ${reward} coins!`,
		);

		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `You claimed your monthly reward of ${reward} coins! Your current streak is ${(data.monthlyStreak ?? 0) + 1} months.`,
				},
			],
		});
	}

	private async work(interaction: ChatInputCommandInteraction) {
		const data = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, interaction.user.id),
		});
		if (!data) {
			await interaction.reply("An error occurred while fetching your data, please try again later.");
			return;
		}
		if (data.workTimestamp && Date.now() - data.workTimestamp.getTime() < 10 * 60 * 1000) {
			const timeLeft = new Date(data.workTimestamp.getTime() + 10 * 60 * 1000 - Date.now());
			await interaction.reply(
				`You have already worked today. Come back in ${timeLeft.getUTCMinutes()}m ${timeLeft.getUTCSeconds()}s.`,
			);
			return;
		}
		const reward = rewards.work;
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: increment(userData.currency, reward),
				workTimestamp: new Date(),
			})
			.where(eq(userData.userId, interaction.user.id));

		this.container.client.logger.info(
			`${interaction.user.username} (${interaction.user.id}) worked for ${reward} coins!`,
		);

		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `You worked for ${reward} coins!`,
				},
			],
		});
	}

	private async give(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser("user");
		const amount = interaction.options.getInteger("amount");
		if (!target || !amount) {
			await interaction.reply("Invalid user or amount");
			return;
		}
		if (amount <= 0) {
			await interaction.reply("Amount must be greater than 0");
			return;
		}
		const data = await this.container.client.drizzle.query.userData.findFirst({
			where: eq(userData.userId, interaction.user.id),
		});
		if (!data) {
			await interaction.reply("An error occurred while fetching your data, please try again later.");
			return;
		}
		if (data.currency < amount) {
			await interaction.reply("You don't have enough coins to give");
			return;
		}
		// Remove
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: decrement(userData.currency, amount),
			})
			.where(eq(userData.userId, interaction.user.id));
		// Add
		await this.container.client.drizzle
			.update(userData)
			.set({
				currency: increment(userData.currency, amount),
			})
			.where(eq(userData.userId, target.id));

		this.container.client.logger.info(
			`${interaction.user.username} (${interaction.user.id}) gave ${amount} coins to ${target.username} (${target.id})`,
		);

		await interaction.reply({
			embeds: [
				{
					...getBaseEmbed(interaction),
					description: `You gave ${amount} coins to ${target.username}`,
				},
			],
		});
	}
}
