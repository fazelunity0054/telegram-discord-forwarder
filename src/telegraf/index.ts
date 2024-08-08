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
			if (!R) {
				console.log("IGNORED RESULT!");
				continue;
			}

			const o = e as any;
			const p = {
				data: {
					sourceTrackId: (o?.message_id ?? e?.update?.message_id ?? e?.update?.channelPost?.message_id  ?? e?.msgId)+"",
					destinationTrackId: R,
					actionId: action.id,
					destinationId: destination.id
				}
			};
			await prisma.actionResult.create(p as any)
		}
	}
}
