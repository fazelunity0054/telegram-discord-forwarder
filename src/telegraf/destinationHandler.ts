import {telegramBot} from "../instrumentation";

export async function handleTelegramForwardWithPhoto(chatId: string, imageUrl: string,replyId?: number, content?: string) {
	console.log("sendPhoto",replyId, content);
	if (replyId) {
		return await telegramBot.telegram.callApi('sendPhoto', {
			...replyId && ({
				reply_parameters: {
					message_id: replyId
				}
			}),
			...content && ({
				caption: content
			}),
			photo: {
				url: imageUrl
			},
			chat_id: chatId
		}).catch(console.error).then(r=>r && 'message_id' in r ? r.message_id+"":undefined);

	}
	return await telegramBot.telegram.sendPhoto(chatId, {
		url: imageUrl
	}, {
		...content && ({
			caption: content
		}),
		...replyId && ({
			reply_parameters: {
				message_id: replyId
			}
		}),
	}).catch(console.error).then(r => r ? r.message_id+"":undefined)
}

export async function handleTelegramForward(chatId: string, content: string, replyId?: number) {
	return await telegramBot.telegram.sendMessage(chatId, content, replyId ? {
		reply_parameters: {
			message_id: replyId
		}
	}:undefined).catch(console.error).then(r => r ? r.message_id+"":undefined)
}
