'use client';

import React from "react";
import {Button, Select} from "@mantine/core";
import {BasicChannelType} from "./page";
import {isSource as checkSource} from "./utils";
import {closeAllModals, modals} from "@mantine/modals";
import {
	deleteManyForward,
	getAvailableChannels,
	getDiscordCategories,
	handleCategoryForward,
	handleForwardRegister,
	prismaQuery
} from "./action";
import {useRouter} from "next/navigation";
import {usePromise} from "./hooks";

const ChannelAction = (props: BasicChannelType) => {
	const isSource = checkSource(props);
	const router = useRouter();
	const name = isSource ? "Source" : "Destination"

	return (
		<div className={'items-center flex gap-2'}>
			{isSource && props.source.type !== 'DISCORD_CATEGORY' && (
				<Button onClick={() => {
					modals.open({
						title: "Add Destination",
						children: (
							<SelectDestination sourceId={props.sourceId}/>
						)
					})
				}} color={'green'} variant={'transparent'}>
					Add
				</Button>
			)}
			<Button onClick={() => {
				modals.openConfirmModal({
					title: `Delete ${name}`,
					children: (
						<div>
							Are you sure you want to delete {name}?
						</div>
					),
					onConfirm: () => {
						if (isSource && props.source.type === "DISCORD_CATEGORY") {
							deleteManyForward(props.destinations.map(o => 'source' in o ? o.source.id : '').filter(Boolean)).then(() => {
								router.refresh()
							})
						} else {
							prismaQuery(isSource ? "forwardAction" : "forwardActionDestination", "delete", {
								where: isSource ? {
									id: props.id
								} : {
									id: {
										actionId: props.actionId,
										destinationId: props.destinationId
									}
								}
							} as any).then(() => {
								router.refresh()
							})
						}
					}
				})
			}
			} color={'red'} variant={'transparent'}>
				Del
			</Button>
		</div>
	);
};

function SelectDestination(props: {
	sourceId?: string,
	discordCategory?: boolean
}) {
	const {result: categories} = usePromise(() => getDiscordCategories(), props.discordCategory ? "DISCORD_CATEGORIES" : false);
	const {result: channels, loading} = usePromise(() => getAvailableChannels());
	const router = useRouter();

	const data = channels?.map(ch => ({
		value: ch?.id + "",
		label: `${ch?.name} (${ch?.type})`
	})) || []

	return (
		<form className={'flex flex-col gap-3'} action={async e => {
			const json: {
				source: string,
				destination: string,
			} = Object.fromEntries(e.entries()) as any;

			if (json.source === json.destination) {
				window.alert("select another destination");
				return;
			}

			if (!props.discordCategory) {
				handleForwardRegister(json.source, json.destination).finally(() => {
					router.refresh();
					closeAllModals()
				})
			} else {
				handleCategoryForward(json.source, json.destination).finally(() => {
					router.refresh();
					closeAllModals()
				})
			}
		}}>
			<Select
				key={loading + ""}
				name={'source'}
				disabled={props.discordCategory ? !categories : loading}
				label={'Source'}
				searchable
				required
				defaultValue={props.sourceId}
				data={props?.discordCategory ? categories?.map(o => ({label: o.name, value: o.id})) : data}
			/>
			<Select
				name={'destination'}
				disabled={loading}
				searchable
				required
				label={'Destination'}
				data={data}
			/>
			<Button type={'submit'}>
				Create Forward
			</Button>
		</form>
	)
}

export const NewForward = () => {
	return (
		<div className={'w-full flex justify-center my-3 gap-2 flex-wrap'}>
			<Button onClick={() => {
				modals.open({
					title: "Add Forward",
					children: (
						<SelectDestination/>
					)
				})
			}}>
				New Forward
			</Button>
			<Button onClick={() => {
				modals.open({
					title: "Add Forward",
					children: (
						<SelectDestination discordCategory/>
					)
				})
			}}>
				DCategory Forward
			</Button>
		</div>
	);
};


export default ChannelAction;
