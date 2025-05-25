export interface ServerToClientEvents {
    message: {data: string};
}

export interface ClientToServerEvents {
	emit_like: (event: string, data: string) => string
	emit_view: (event: string, data: string) => string
	emit_unlike: (event: string, data: string) => string
	emit_chat: (event: string, data: string) => string
}

export interface MessageNotification { 
	user: string;
	contents: string
}

export interface NotificationObj {
	type: string;
	data: string | MessageNotification,
	time: number
}