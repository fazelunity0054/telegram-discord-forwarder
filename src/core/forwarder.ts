import prisma from "../prisma/PrismaClient";
import Discord, {ChannelType} from "discord.js";
import {ForwardChannel} from ".prisma/client";
import {handleTelegramForward, handleTelegramForwardWithPhoto} from "../telegraf/destinationHandler";
import {discordBot, telegramBot} from "../instrumentation";
import {SupportedMessage} from "./types";

export async function getActionOfSource(id: string) {
	return prisma.forwardAction.findFirst({
		where: {
			source: {
				id: id + ""
			}
		},
		include: {
			destinations: {
				include: {
					destination: true
				}
			},
			source: true
		}
	});
}


export async function convertMessageToBaseObject(destination: ForwardChannel, message: SupportedMessage) {
	const isWebhook = message instanceof Discord.Message && message.content.startsWith("Replied to");
	const repliedTo = message instanceof Discord.Message ? (
		isWebhook ? message.content.split("\n").at(0)?.split("/")?.at(-1):message.reference?.messageId
	) : ((message as any)?.channelPost)?.reply_to_message?.message_id || message.update?.channel_post?.reply_to_message?.message_id;
	const replyDestination = repliedTo ? (await prisma.actionResult.findFirst({
		where: {
			destinationId: destination.id,
			sourceTrackId: repliedTo+""
		}
	}))?.destinationTrackId : undefined;

	if (message instanceof Discord.Message) {
		if (isWebhook && repliedTo) {
			message.content = message.content.split("\n").slice(2).join("\n");
		}
		return {
			content: message.content+"" || undefined,
			replied: replyDestination,
			imageUrl: message.attachments.filter(e => e.contentType?.includes('image')).at(0)?.url,
			avatar: message.author.avatarURL({
				size: 64
			}) || undefined,
			name: message.author.displayName
		}
	} else {
		return {
			content: (message.text ?? ((message.channelPost as any).caption as string | undefined) as string | undefined),
			replied: replyDestination,
			imageUrl: await telegramBot.telegram.getFileLink((message.channelPost as any)?.photo?.at(-1)?.file_id + "").then(r => r.toString()).catch(()=>undefined),
			avatar: await telegramBot.telegram.getFileLink(
				await telegramBot.telegram.getChat(message.chat.id).then(r => r.photo?.small_file_id + "").catch(() => "")
			).catch(() => undefined).then(r => r?.toString()),
			name: (message.channelPost as any).author_signature || message.chat.title
		}
	}
}

export async function handleAction<Source extends ForwardChannel>(
	source: Source,
	_message: SupportedMessage,
	destination: ForwardChannel
) {
	if (source.id === destination.id) {
		console.log('SELF FORWARD NOT AVAILABLE!');
		return;
	}

	const message = await convertMessageToBaseObject(destination, _message);
	console.log(`Forwarding from ${source.name} to ${destination.name}: ${message?.content?.slice?.(0,50) || "NuLL"}`);
	if (destination.type === "TELEGRAM") {
		const replyId = message?.replied ? +message.replied : undefined;
		const imageUrl = message.imageUrl;

		if (imageUrl) {
			return await handleTelegramForwardWithPhoto(destination.id, imageUrl, replyId, message.content);
		} else if (message.content) {
			return await handleTelegramForward(destination.id, message.content, replyId);
		} else {
			console.error("Message doesn't have content");
		}
	} else {
		const channel = await discordBot.channels.fetch(destination.id).catch(console.error);
		if (!channel || channel.type !== ChannelType.GuildText) return;

		const webhooks = await channel.fetchWebhooks();
		const webhook = webhooks.first() || (await channel.createWebhook({
			name: "FORWARDER"
		}).catch(() => undefined));

		if (!webhook) {
			console.log("WEBHOOK NOT FOUND");
			return;
		}

		const reply = message.replied ? await channel.messages.fetch(message.replied).catch(()=>undefined):undefined;
		if (reply) {
			message.content = `Replied to ${reply.url}\n\n${message.content || ""}`
		}

		return await webhook.send({
			content: message.content || ".",
			avatarURL: message.avatar,
			username: message.name.replaceAll("discord", "").replaceAll("Discord", ""),
			...message.imageUrl && ({
				files: [message.imageUrl]
			}),
		}).then(r => r.id).catch(console.error);

	}
}
