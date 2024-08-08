import {Client} from "discord.js";
import CustomTelegraf from "./telegraf/CustomTelegraf";
import {unity_hotreload} from "./index";
import prisma from "./prisma/PrismaClient";
import {telegramEvents} from "./telegraf";

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
		telegramEvents();
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

	const logChannel = await prisma.forwardChannel.findFirst({
		where: {
			name: {
				contains: "LOG"
			}
		}
	});


	if (logChannel) {
		let LOGS: string[] = [];
		const thread = setInterval(()=>{
			if (!LOGS.length) return;
			const SPECIAL_CHARS = [
				'\\',
				'_',
				'*',
				'[',
				']',
				'(',
				')',
				'~',
				'>',
				'<',
				'&',
				'#',
				'+',
				'-',
				'=',
				'|',
				'{',
				'}',
				'.',
				'!'
			]

			const escapeMarkdown = (text: string) => {
				SPECIAL_CHARS.forEach(char => (text = text.replaceAll(char, `\\${char}`)))
				return text
			}
			telegramBot.telegram.sendMessage(logChannel.id, escapeMarkdown(LOGS.join('\n\n')), {
				parse_mode: "MarkdownV2"
			}).catch(()=>undefined)
			LOGS = [];
		}, 2000)
		for (let key of ['log', 'warn', 'error'] as const) {
			const origin = console[key];
			console[key] = (...args)=>{
				LOGS.push(`[${key.toUpperCase()}] ${args.map(o=>{
					if (o?.toString?.()) return o?.toString?.();
					if (typeof o === "object") return "```json\n"+JSON.stringify(o)+"\n```";
					return o+"";
				}).join(" ")}`);
				origin(...args);
			}
		}
	} else console.log('LOG CHANNEL DOESNT Exists')
}
