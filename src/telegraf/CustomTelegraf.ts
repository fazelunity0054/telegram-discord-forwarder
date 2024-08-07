import {Telegraf} from 'telegraf';
import {UserFromGetMe} from 'telegraf/types';
import {TheMessageContext} from './types/dodo';
import prisma from "../prisma/PrismaClient";


declare global {
	var CT_BOTS: {
		[key: string]: CustomTelegraf
	}
}
global.CT_BOTS ||= {};


export default class CustomTelegraf extends Telegraf {
	readyEvents: (typeof this.onReady)[] = [];
	disconnectEvents: (typeof this.onDis)[] = [];
	me: UserFromGetMe | undefined;
	name: string;
	ready: boolean = false;
	id: string;

	constructor(name: string, token: string) {
		super(token);
		this.name = name;
		this.id = name.replaceAll(" ", "_") + `:${Object.keys(global.CT_BOTS).length}:` + Math.random();

		console.log(this.id, 'Initializing', 'Bot');
		this.telegram.getMe().then((me) => {
			this.me = me;
			this.launch(() => {
				console.log("LAUNCH READY");
				this.onReady.bind(this)(me);
			}).catch((e) => {
				console.log("CATCH IN LAUNCH EVENT");
				this.onDis.bind(this)(e, this)
			});
		}).catch((e) => {
			console.log("CATCH IN READY ME EVENT");
			this.onDis.bind(this)(e, this)
		});
		global.CT_BOTS[this.id] = this;
	}

	private onReady(bot: UserFromGetMe) {
		this.me = bot;

		for (const readyEvent of this.readyEvents) {
			try {
				readyEvent(bot);
			} catch (e) {
				console.error(`Error in Ready event[${bot.username}]`);
			}
		}

		const handle = (e: TheMessageContext) => {
			try {
				return this.event(e);
			} catch (e) {
				console.error(e);
			}
		}
		console.log("CHANNEL POST REGISTERED")
		this.on('channel_post', async e => {
			await this.waitToReady().then(async (me) => {
				await handle(e);
				try {
					await prisma.forwardChannel.upsert({
						where: {
							id: e.chat.id + "",
						},
						create: {
							id: e.chat.id + "",
							name: e.chat.title,
							type: "TELEGRAM"
						},
						update: {}
					})
				} catch (e) {
					console.error(e);
				}
			})
		})
		this.start(handle as any);
		this.ready = true;
	}

	private onDis(e: Error, t: CustomTelegraf) {
		if (!global.CT_BOTS[this.id]) {
			console.log(this.id,"Ignored",e);
			return;
		}

		console.log(this.id, "Disconnected");
		console.error(e);
		for (let disconnectEvent of this.disconnectEvents) {
			try {
				disconnectEvent(e, t);
			} catch (e) {
				console.error(e);
			}
		}
		this.disconnectEvents = [];
		delete global.CT_BOTS?.[this.id];
	}

	public onDisconnect(e: (e: Error, T: this) => void) {
		this.disconnectEvents.push(e);
	}

	event: (ctx: TheMessageContext) => Promise<any> = async () => console.log(this.id, "Unhandled Message")

	onMessage(func: typeof this.event) {
		this.event = func;
	}

	async waitToReady(): Promise<UserFromGetMe> {
		if (this.me) {
			return this.me;
		}

		return await new Promise(r => {
			this.readyEvents.push((bot) => {
				r(bot);
			});
		});
	}
}
