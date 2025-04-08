
import { toasts } from "../stores/globalStore.svelte";
import type { ToastType } from "../types/toast";

export function showToast(message: string, duration: number, type: ToastType) {
	const id = Date.now();
	toasts.update((currentToasts) => [
	  ...currentToasts,
	  { id, message, duration, type }
	]);
  }