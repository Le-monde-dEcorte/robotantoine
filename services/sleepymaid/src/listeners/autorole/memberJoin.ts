import { autoRoles } from "@sleepymaid/db";
import { Context, Listener } from "@sleepymaid/handler";
import { GuildMember } from "discord.js";
import { eq } from "drizzle-orm";
import { SleepyMaidClient } from "../../lib/SleepyMaidClient";

export default class MemberJoinListener extends Listener<"guildMemberAdd", SleepyMaidClient> {
	public constructor(context: Context<SleepyMaidClient>) {
		super(context, {
			name: "guildMemberAdd",
		});
	}

	public override async execute(member: GuildMember) {
		const roles = await this.container.drizzle.query.autoRoles.findMany({
			where: eq(autoRoles.guildId, member.guild.id),
		});

		await member.guild.roles.fetch();

		const list = [];

		for (const rl of roles) {
			const role = member.guild.roles.cache.get(rl.roleId);
			if (!role) {
				this.container.logger.debug(`Role ${rl.roleId} not found for guild ${member.guild.id}`);
				await this.container.drizzle.delete(autoRoles).where(eq(autoRoles.roleId, rl.roleId));
				continue;
			}
			list.push(role.id);
		}

		await member.roles.add(list);
	}
}