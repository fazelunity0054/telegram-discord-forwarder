import {discordEvents} from "./discord";
import {BotsReadyPromise} from "./instrumentation";
import {telegramEvents} from "./telegraf";



export async function unity_hotreload() {
	await BotsReadyPromise;
	discordEvents();
	telegramEvents();
}
