import {Client} from "discord.js";
import CustomTelegraf from "./telegraf/CustomTelegraf";
import {unity_hotreload} from "./index";



export let telegramBot = stableTelegram();

function stableTelegram() {
	const T = new CustomTelegraf('TD',process.env.TELEGRAM+"");
	T.onDisconnect(async ()=>{
		console.log("Reconnecting telegram...");
		telegramBot = stableTelegram();
		await T.waitToReady();
	})
	return T;
}

export let discordBot = new Client({
	intents: ['MessageContent','GuildMessages',"Guilds","GuildMembers"]
});
export const BotsReadyPromise = Promise.all([
	telegramBot.waitToReady(),
	discordBot.login(process.env.DISCORD)
]).then((e)=>{
	console.log("All Bots Ready!",...e)
})

export async function register() {
	unity_hotreload().catch(console.error)
}
