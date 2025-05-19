export enum ToastType {
    INFO,
    ERROR,
	SUCCESS,
	HAPPY,
}

export interface ToastElement {
	id: number,
	message: string,
	duration: number,
	type: ToastType
}