import { Logger } from '@sleepymaid/logger'
import { BaseConfig, ConfigManager } from '@sleepymaid/config'
import { PrismaClient } from '@prisma/client'
import { ActivityType, GatewayIntentBits } from 'discord-api-types/v10'
import { BaseLogger, HandlerClient } from '@sleepymaid/handler'
import { Localizer } from '@sleepymaid/localizer'
import { resolve } from 'path'
import { container } from 'tsyringe'
import { voiceXpManager } from '../managers/voiceXpManager'

export class BotClient extends HandlerClient {
	public declare prisma: PrismaClient
	public declare localizer: Localizer
	public declare configManager: ConfigManager
	public declare config: BaseConfig
	constructor() {
		super(
			{
				devServerId: '821717486217986098',
				logger: new Logger() as unknown as BaseLogger
			},
			{
				intents: [
					GatewayIntentBits.Guilds,
					GatewayIntentBits.GuildMembers,
					GatewayIntentBits.GuildBans,
					GatewayIntentBits.GuildVoiceStates,
					GatewayIntentBits.GuildMessages,
					GatewayIntentBits.MessageContent
				],
				allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
				presence: {
					status: 'online',
					activities: [
						{
							name: 'yo allo ?',
							type: ActivityType.Watching
						}
					]
				}
			}
		)
		this.localizer = new Localizer()
	}

	public async start(): Promise<void> {
		this.configManager = new ConfigManager()
		const configs = await this.configManager.initConfig()
		this.config = configs['bot']
		this.prisma = new PrismaClient({
			datasources: { db: { url: this.config.db } }
		})
		this.env = this.config.environment
		await this.localizer.loadLanguage()

		await this.loadHandlers({
			commands: {
				folder: resolve(__dirname, '../../slashCommands')
			},
			listeners: {
				folder: resolve(__dirname, '../../listeners')
			},
			tasks: {
				folder: resolve(__dirname, '../../tasks')
			}
		})
		this.login(this.config.token)

		process.on('unhandledRejection', (error: Error) => {
			this.logger.error(error.stack)
		})

		process.on('exit', async () => {
			const c = container
			c.register(BotClient, { useValue: this })
			await c.resolve(voiceXpManager).stopAll()
			await this.prisma.$disconnect()
		})
	}
}
