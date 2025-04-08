export enum ToastType {
    INFO,
    ERROR,
	SUCCESS,
}

export interface ToastElement {
	id: number,
	message: string,
	duration: number,
	type: ToastType
}