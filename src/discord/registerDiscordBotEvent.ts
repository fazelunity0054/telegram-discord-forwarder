import {discordBot} from "../instrumentation";
import {ClientEvents} from "discord.js";

let REGISTERED: {
	[k in keyof ClientEvents]?: (e: ClientEvents[k])=>void | undefined
} = {}

export function registerDiscordBotEvent<
	T extends keyof ClientEvents
>
(event: T, e: (...args: ClientEvents[T])=>void = () => {}): void {

	const handler = REGISTERED[event]
	if (!handler) {
		discordBot.on(event as any, (e)=>{
			REGISTERED[event]?.(e);
		})
		console.log("Discord BotEvents Registered",event);
	} else console.log("Discord BotEvents Updated",event);
	REGISTERED[event] = e as any;
}
