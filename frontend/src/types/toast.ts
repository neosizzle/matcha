export enum ToastType {
    INFO,
    ERROR,
	WARNING,
	SUCCESS,
}

export interface ToastElement {
	id: number,
	message: string,
	duration: number,
	type: ToastType
}