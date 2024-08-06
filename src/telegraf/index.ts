import {telegramBot} from "../instrumentation";
import {getActionOfSource, handleAction} from "../core/forwarder";
import prisma from "../prisma/PrismaClient";

let count = 0;
export function telegramEvents() {
	telegramBot.event = async (e)=>{
		const id = e.chat.id+"";
		const action =await getActionOfSource(id);
		if (!action) return;

		for (let {destination} of action.destinations) {
			const R = await handleAction(action.source, e, destination)
			if (!R) continue;
			await prisma.actionResult.create({
				data: {
					sourceTrackId: e.msgId+"",
					destinationTrackId: R,
					actionId: action.id,
					destinationId: destination.id
				}
			})
		}

	}
}
