import { Context, NarrowedContext } from 'telegraf';
import {Message, Update} from 'telegraf/typings/core/types/typegram';
import ChannelPostUpdate = Update.ChannelPostUpdate;

export type TheMessageContext = NarrowedContext<Context<Update>, ChannelPostUpdate<Message> & {
	updateType?: string
}>
