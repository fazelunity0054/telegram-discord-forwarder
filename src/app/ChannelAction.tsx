'use client';

import React from "react";
import {Button, Select} from "@mantine/core";
import {BasicChannelType} from "./page";
import {isSource as checkSource} from "./utils";
import {closeAllModals, modals} from "@mantine/modals";
import {getAvailableChannels, handleForwardRegister, prismaQuery} from "./action";
import {useRouter} from "next/navigation";
import {usePromise} from "./hooks";

const ChannelAction = (props: BasicChannelType) => {
	const isSource = checkSource(props);
	const router = useRouter();
	const name = isSource ? "Source" : "Destination"

	return (
		<div className={'items-center flex gap-2'}>
			{isSource && (
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
				})
			}} color={'red'} variant={'transparent'}>
				Del
			</Button>
		</div>
	);
};

function SelectDestination(props: {
	sourceId?: string
}) {
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

			handleForwardRegister(json.source,json.destination).finally(()=>{
				router.refresh();
				closeAllModals()
			})
		}}>
			<Select
				key={loading + ""}
				name={'source'}
				disabled={loading}
				label={'Source'}
				searchable
				required
				defaultValue={props.sourceId}
				data={data}
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
		<div className={'w-full flex justify-center my-3'}>
			<Button onClick={()=>{
				modals.open({
					title: "Add Forward",
					children: (
						<SelectDestination />
					)
				})
			}}>
				New Forward
			</Button>
		</div>
	);
};



export default ChannelAction;
