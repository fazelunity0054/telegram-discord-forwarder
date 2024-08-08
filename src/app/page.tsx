import Image from "next/image";
import React, {ReactNode} from "react";
import prisma from "../prisma/PrismaClient";
import ChannelAction, {NewForward} from "./ChannelAction";
import {Forwards, isSource} from "./utils";
import {getDiscordCategories} from "./action";
import {ChannelType, TextChannel} from "discord.js";

export default async function Home() {
	const forwards = await getForwards();



	return (
		<main className="min-h-screen min-w-screen p-2 py-5 container mx-auto">
			<h1 className={'text-center text-3xl font-bold'}>Total Forwards {forwards.length}</h1>
			<NewForward />
			<br/>
			<div className={'flex-col flex gap-3'}>

				{forwards.map(forward => (
					<ChannelView {...forward} />
				))}
			</div>
		</main>
	);
}



export async function getForwards() {
	const forwards = await prisma.forwardAction.findMany({
		include: {
			source: true,
			destinations: {
				include: {
					destination: true
				}
			}
		}
	})
	const telegram = forwards.filter(f => f.source.type === "TELEGRAM");
	const discordCategories = await getDiscordCategories();

	const categories = discordCategories.map(cat => ({
		id: cat.id,
		source: {
			name: cat.name,
			id: cat.id,
			type: "DISCORD_CATEGORY",
		},
		sourceId: cat.id,
		destinations: forwards.filter(f => {
			const channel = discordBot?.channels.cache.find(c =>c.type === ChannelType.GuildText && f.sourceId+"" === c.id && c.parentId === cat.id) as TextChannel;
			return !!channel;
		})
	})).filter(o=>!!o.destinations.length)

	const inCats = categories.map(c => c.destinations.map(c=>c.sourceId)).flat();

	console.log(inCats)
	return [
		...telegram,
		...categories,
		...forwards.filter(f => f.source.type === "DISCORD" && !inCats.includes(f.sourceId)),
	]
}


export type BasicChannelType = Forwards[number] | Forwards[number]['destinations'][number];

function ChannelView(props: (BasicChannelType) & {
	action?: ReactNode
}) {
	const {action, ...forward} = props;


	return (
		<details className={'rounded-lg bg-white/10 border p-2'}>
			<summary className={'flex gap-2 items-center justify-between w-full'}>
				<div className={'flex gap-2 items-center'}>
					<Image
						src={(isSource(forward) ? forward.source : forward.destination).type === "TELEGRAM" ? '/tel.png' : "/discord.png"}
						width={isSource(forward) ? 60 : 30} height={isSource(forward) ? 50 : 30} alt={''}
						className={'object-cover'}/>
					{isSource(forward) ? (
						<>
							<div>
								<p><span className={'text-gray-400'}>from: </span>{forward.source.name}</p>
								<p className={'text-xs text-gray-400'}>to: {forward.destinations.length} destinations</p>
							</div>
						</>
					) : (
						<>
							<p>{forward.destination.name}</p>
						</>
					)}
				</div>
				<ChannelAction {...forward} />
			</summary>
			<br/>
			<p className={'text-xs text-gray-400'}>id: {isSource(forward) ? forward.sourceId:forward.destination.id}</p>
			{isSource(forward) && (
				<>
					<div className={'flex pt-2 flex-col gap-2'}>
						{forward.destinations.map((des) => (
							<ChannelView {...des} />
						))}
					</div>
				</>
			)}
		</details>
	)
}
