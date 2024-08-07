import {Client} from "discord.js";
import CustomTelegraf from "./telegraf/CustomTelegraf";
import {unity_hotreload} from "./index";

declare global {
	var discordBot: Client | undefined;
	var telegramBot: CustomTelegraf | undefined;
}

export let telegramBot = global.telegramBot ?? stableTelegram();
global.telegramBot = telegramBot;

function stableTelegram() {
	const T = new CustomTelegraf('TD',process.env.TELEGRAM+"");
	T.onDisconnect(async ()=>{
		console.log("Reconnecting telegram...");
		telegramBot = stableTelegram();
		global.telegramBot = telegramBot;
		await T.waitToReady();
	})
	return T;
}

export let discordBot = global.discordBot ?? new Client({
	intents: ['MessageContent','GuildMessages',"Guilds","GuildMembers"]
});
global.discordBot = discordBot;
export const BotsReadyPromise = Promise.all([
	telegramBot.waitToReady().then(r => r.username),
	discordBot.login(process.env.DISCORD).then(()=>discordBot.user?.username)
]).then((e)=>{
	console.log("All Bots Ready!",...e)
})

export async function register() {
	unity_hotreload().catch(console.error)
}
