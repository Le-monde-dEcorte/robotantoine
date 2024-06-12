import { Task, type Context } from "@sleepymaid/handler";
import { ChannelType } from "discord.js";
import type { HelperClient } from "../lib/extensions/HelperClient";

export default class BannerTask extends Task<HelperClient> {
	public constructor(context: Context<HelperClient>) {
		super(context, {
			interval: "* * * * *",
		});
	}

	public override async execute() {
		const client = this.container.client;
		client.logger.debug("Random bitrate task started");
		const channels = await client.drizzle.query.randomBitrate.findMany();
		for (const channelObject of channels) {
			const channel = client.channels.cache.get(channelObject.channelId);
			if (!channel) continue;
			if (channel.type !== ChannelType.GuildVoice) continue;
			const maxBitrate = channel.guild.maximumBitrate;
			const minBitrate = 8_000;
			// Random bitrate between min and maxBitrate
			const bitrate = Math.floor(Math.random() * (maxBitrate - minBitrate + 1) + minBitrate);
			// Round up the birate by to get the last 3 digit to be 0
			const roundedBitrate = Math.ceil(bitrate / 1_000) * 1_000;
			await channel.setBitrate(roundedBitrate);
			await channel.send(`The bitrate for the voice channel has been set to ${Math.ceil(bitrate / 1_000)}kbps.`);
		}
	}
}
