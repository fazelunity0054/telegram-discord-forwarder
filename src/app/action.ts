'use server';

import prisma from "../prisma/PrismaClient";
import {discordBot} from "../instrumentation";
import {ChannelType, TextChannel} from "discord.js";
import {ForwardChannel} from ".prisma/client";

type PrismaClient = typeof prisma;
type PrismaModel = keyof PrismaClient;
type PrismaAction<T extends PrismaModel> = keyof PrismaClient[T];

export async function prismaQuery<T extends PrismaModel, A extends PrismaAction<T>>(
	model: T,
	action: A,
	//@ts-ignore
	params: Parameters<PrismaClient[T][A]>[0]
	//@ts-ignore
): Promise<Awaited<ReturnType<PrismaClient[T][A]>>> {
	return await (prisma[model][action] as any)(params);
}


export async function getAvailableChannels() {
	const createdChannels = await prisma.forwardChannel.findMany();
	const notCreated = discordBot.channels.cache.filter(o => !createdChannels.find((c=>c.id === o.id)) && o instanceof TextChannel).map((ch) => {
		if (!(ch instanceof TextChannel)) return;

		return {
			name: ch.name + `[${ch.guild.name}]`,
			id: ch.id,
			exists: false,
			type: "DISCORD"
		}
	}).filter(Boolean);

	return [
		...createdChannels.map(e => ({
			...e,
			exists: false
		})),
		...notCreated
	]
}


export async function handleForwardRegister(sourceId: string | ForwardChannel, destinationId: string | ForwardChannel) {
	const source = typeof sourceId === 'string' ? await getForwardChannel(sourceId):sourceId;
	const des = typeof destinationId === 'string' ? await getForwardChannel(destinationId):destinationId;

	const action = await prisma.forwardAction.upsert({
		where: {
			sourceId: source.id
		},
		create: {
			sourceId: source.id
		},
		update: {}
	})

	await prisma.forwardActionDestination.upsert({
		where: {
			id: {
				destinationId: des.id,
				actionId: action.id
			}
		},
		create: {
			destinationId: des.id,
			actionId: action.id
		},
		update: {}
	});
}

export async function getDiscordCategories() {
	return Array.from(discordBot.channels.cache.filter(o => o.type === ChannelType.GuildCategory).values()).map(ch => ({
		name: ch.name + `[${ch.guild.name}]`,
		id: ch.id,
		exists: false,
		type: "DISCORD_CAT"
	}))
}

export async function handleCategoryForward(categoryId: string,destinationId: string) {
	const textChannels = Array.from(discordBot.channels.cache.filter(o =>o.type === ChannelType.GuildText).values());
	const targets = textChannels.filter(t => t.parentId === categoryId);
	const destination = await getForwardChannel(destinationId);

	await Promise.all(targets.map(async t => {
		return await handleForwardRegister(t.id,destination)
	}));

}

export async function deleteManyForward(sources: string[]) {
	return await prisma.forwardAction.deleteMany({
		where: {
			OR: sources.map(source => ({
				source: {
					id: source
				}
			}))
		}
	})
}

export async function getForwardChannel(id: string) {
	const channels = await getAvailableChannels();


	let sourceChannel = channels.find(o => o?.id === id);
	if (!sourceChannel?.exists) {
		delete (sourceChannel as any)?.exists;
		await prisma.forwardChannel.create({
			data: sourceChannel as any
		}).catch(()=>undefined)
	}

	return sourceChannel as unknown as ForwardChannel;
}
