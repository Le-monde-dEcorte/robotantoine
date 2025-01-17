import { Context, Listener } from "@sleepymaid/handler";
import { AuditLogEvent, Snowflake, VoiceState } from "discord.js";
import { HelperClient } from "../../lib/extensions/HelperClient";
import { sql } from "drizzle-orm";
import { disconnectCounter } from "@sleepymaid/db";

const userDisconnectCounter: Record<Snowflake, number> = {};

export default class extends Listener<"voiceStateUpdate", HelperClient> {
	constructor(context: Context<HelperClient>) {
		super(context, {
			name: "voiceStateUpdate",
			once: false,
		});
	}

	public override async execute(oldState: VoiceState, newState: VoiceState) {
		if (oldState.guild.id !== "796534493535928320") return;
		if (!oldState.member) return;
		// if (oldState.member.id !== "523915165545136141") return;
		if (!oldState.guild.members.me?.permissions.has("ManageNicknames")) return;
		if (!oldState.member.manageable) return;
		if (oldState.member.user.bot) return;
		if (oldState.channel !== null && newState.channel == null) {
			const auditLog = await oldState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect });
			let valid = false;
			for (const entry of auditLog.entries.values()) {
				if (!entry.executor) continue;
				const currentCount = userDisconnectCounter[entry.executor.id] ?? 0;
				const newCount = entry.extra.count;

				if (currentCount === newCount) continue;

				userDisconnectCounter[entry.executor.id] = newCount;

				valid = true;
			}
			if (!valid) return;

			const user = await this.container.client.drizzle
				.insert(disconnectCounter)
				.values({
					userId: oldState.member.id,
					count: 1,
				})
				.onConflictDoUpdate({
					target: [disconnectCounter.userId],
					set: {
						count: sql`${disconnectCounter.count} + 1`,
					},
				})
				.returning({
					count: disconnectCounter.count,
				});
			if (!user || !user[0]) return;

			const currentName = oldState.member.nickname ?? oldState.member.user.displayName;
			const baseNickname = currentName.replace(/^\[\d+\]\s+/, "");
			const newNickname = `[${user[0].count}] ${baseNickname}`;

			await oldState.member.setNickname(newNickname);
		}
	}
}