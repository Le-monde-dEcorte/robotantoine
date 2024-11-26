import { DrizzleInstance } from "@sleepymaid/db";
import { WatcherClient } from "./WatcherClient";
import Manager from "./manager";
import { BaseContainer } from "@sleepymaid/handler";
import { Redis } from "iovalkey";

export default class WatcherContainer extends BaseContainer<WatcherClient> {
	public declare drizzle: DrizzleInstance;

	public declare manager: Manager;

	public declare redis: Redis;

	constructor(client: WatcherClient) {
		super(client);
		this.drizzle = client.drizzle;
		this.manager = new Manager(client);
		this.redis = client.redis;
	}
}
