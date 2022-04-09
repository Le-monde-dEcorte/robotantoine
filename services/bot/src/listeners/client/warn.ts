import { Listener } from '@sleepymaid/handler'
import { BotClient } from '../../lib/BotClient'

export default new Listener(
	{
		name: 'warn',
		once: false
	},
	{
		run(client: BotClient, info) {
			return client.logger.debug(info)
		}
	}
)
