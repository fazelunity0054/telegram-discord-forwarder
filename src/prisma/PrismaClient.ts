import {PrismaClient} from "@prisma/client";

declare const global: {
	instance: PrismaClient
}

const instance: PrismaClient = global?.instance ?? new PrismaClient();
global.instance = instance;

function prop<T>(value: T) {
	return {
		needs: {},
		compute: () => value
	}
}

const prisma = instance.$extends({
});

//@ts-ignore
export type PrismaModelType<T extends keyof typeof prisma> = Awaited<ReturnType<(typeof prisma[T])['findFirst']>>


export default prisma;
