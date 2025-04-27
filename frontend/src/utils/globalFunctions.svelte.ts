
import { toasts } from "../stores/globalStore.svelte";
import type { ToastType } from "../types/toast";
import type { User } from "../types/user";

export function showToast(message: string, type: ToastType) {
	const id = Date.now();
	const duration = 4000;
	toasts.update((currentToasts) => [
	  ...currentToasts,
	  { id, message, duration, type }
	]);
}

export function calculate_age_from_date(date: Date|null|undefined) {
	if (!date)
		return 69
	const today = new Date();
	let age = today.getFullYear() - date.getFullYear();
	const monthDiff = today.getMonth() - date.getMonth();
	const dayDiff = today.getDate() - date.getDate();

	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age--;
	}

	return age;
}

type RawUser = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
  };
  
export function deserialize_user_object(user_obj: RawUser): User {
	return {
		...user_obj,
		birthday: new Date(user_obj.birthday),
		images: user_obj.images.split(",").filter((x: string) => x !== ""),
		tags: user_obj.tags.split(",").filter((x: string) => x !== "")
	} as User;
}
