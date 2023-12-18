import type { ListenerInterface } from '@sleepymaid/handler';
import type { GuildMember } from 'discord.js';
import sanitize from '@aero/sanitizer';
import { SleepyMaidClient } from '../../lib/extensions/SleepyMaidClient';

export default class JoinSanitizerListener implements ListenerInterface {
	public readonly name = 'guildMemberAdd';
	public readonly once = false;

	public async execute(member: GuildMember, client: SleepyMaidClient) {
		const sanitized = sanitize(member.displayName);
		const sanitizerSettings = await client.prisma.sanitizerSettings.findUnique({
			where: { guildId: member.guild.id },
		});
		if (!sanitizerSettings) return;
		if (sanitizerSettings.enabled === false) return;
		if (member.displayName !== sanitized) await member.setNickname(sanitized, 'Sanitizer');
	}
}