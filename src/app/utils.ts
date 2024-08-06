import {getForwards} from "./page";

export type Forwards = NonNullable<Awaited<ReturnType<typeof getForwards>>>;

export function isSource(forward: any): forward is Forwards[number] {
	return !!forward.source;
}
