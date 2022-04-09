import { Listener } from '@sleepymaid/handler'
import { Guild } from 'discord.js'
import { BotClient } from '../../lib/BotClient'

export default new Listener(
	{
		name: 'guildCreate',
		once: false
	},
	{
		async run(client: BotClient, guild: Guild) {
			return await client.prisma.guilds_settings.create({
				data: {
					guild_id: guild.id
				}
			})
		}
	}
)
