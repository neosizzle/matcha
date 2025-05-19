import type { User } from "./user";

export interface ServerToClientEvents {
    message: {data: string};
}

export interface ClientToServerEvents {
	emit_like: (event: string, data: string) => string
	emit_view: (event: string, data: string) => string
}

interface MessageNotification { 
	user: string;
	contents: string
}

export interface NotificationObj {
	type: string;
	data: string | MessageNotification,
	time: number
}