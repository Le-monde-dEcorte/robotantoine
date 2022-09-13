import { Logger } from '@sleepymaid/logger'
import { initConfig, Config } from '@sleepymaid/config'
import { PrismaClient } from '@prisma/client'
import { ActivityType, GatewayIntentBits } from 'discord-api-types/v10'
import { HandlerClient } from '@sleepymaid/handler'
import { resolve, join } from 'path'
import i18next from 'i18next'
import FsBackend from 'i18next-fs-backend'
import { supportedLngs } from '@sleepymaid/localizer'

export class BotClient extends HandlerClient {
	public declare prisma: PrismaClient
	public declare config: Config
	public declare logger: Logger
	constructor() {
		super(
			{
				devServerId: '821717486217986098'
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
	}

	public async start(): Promise<void> {
		this.logger = new Logger()
		this.config = initConfig()
		this.prisma = new PrismaClient()
		this.env = this.config.nodeEnv

		await i18next.use(FsBackend).init({
			//debug: this.config.environment === 'development',
			supportedLngs,
			backend: {
				loadPath: join(__dirname, '../../../../../locales/{{lng}}/{{ns}}.json')
			},
			cleanCode: true,
			fallbackLng: 'en-US',
			preload: ['en-US', 'fr'],
			defaultNS: 'translation',
			ns: 'translation'
		})

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
		this.login(this.config.discordToken)

		process.on('unhandledRejection', (error: Error) => {
			this.logger.error(error)
		})

		process.on('exit', async () => {
			//await stopAll(this)
			await this.prisma.$disconnect()
		})
	}
}
