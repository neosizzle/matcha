
import { toasts } from "../stores/globalStore.svelte";
import type { ToastType } from "../types/toast";

export function showToast(message: string, type: ToastType) {
	const id = Date.now();
	const duration = 4000;
	toasts.update((currentToasts) => [
	  ...currentToasts,
	  { id, message, duration, type }
	]);
  }