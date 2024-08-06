import {registerDiscordBotEvent} from "./registerDiscordBotEvent";
import prisma from "../prisma/PrismaClient";
import {getActionOfSource, handleAction} from "../core/forwarder";


export function discordEvents() {
	registerDiscordBotEvent('messageCreate',  async e =>{
		if (!e.guild) return;

		const action = await getActionOfSource(e.channelId+"");

		if (!action) return;

		for (let {destination} of action.destinations) {
			const result = await handleAction(action.source,e,destination);
			if (!result) continue;

			await prisma.actionResult.create({
				data: {
					sourceTrackId: e.id,
					destinationTrackId: result,
					actionId: action.id,
					destinationId: destination.id
				}
			})
		}
	});

}
